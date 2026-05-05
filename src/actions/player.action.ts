"use server";

import { prisma } from "@/lib/prisma";
import { LOYALTY_RATIO } from "@/lib/rules";

/**
 * Fetch a single player's full profile by their UUID.
 * Returns null when the player does not exist.
 * Note: `loyalty_points` is stored as Prisma Decimal — converted to number here.
 */
export async function getPlayerInfoById(client_id: string) {
  try {
    const playerData = await prisma.players.findUnique({
      where: { client_id },
    });
    // Convert Decimal to number for loyalty_points
    if (playerData) {
      return {
        ...playerData,
        loyalty_points: playerData.loyalty_points ? Number(playerData.loyalty_points) : 0,
      };
    }
    return null;

  } catch (error) {
    console.error("Error fetching player info:", error);
    throw new Error("Failed to fetch player info");
  }
}

/**
 * Fetch all players ordered alphabetically by last name, including their bank accounts.
 * Intended for small datasets / admin use. Prefer `getPlayersPaginated` in production views.
 */
export async function getAllPlayers() {
  try {
    const players = await prisma.players.findMany({
      orderBy: {
        lastname: "asc",
      },
      include: {
        banks: true,
      }
    });
    return players.map(player => ({
      ...player,
      loyalty_points: player.loyalty_points ? Number(player.loyalty_points) : 0,
    }));
  } catch (error) {
    console.error("Error fetching players:", error);
    throw new Error("Failed to fetch players");
  }
}

/**
 * Paginated player list, ordered by number of bank accounts (desc).
 * Returns the page slice, total count, and a `hasMore` flag for infinite scroll.
 */
export async function getPlayersPaginated(limit: number = 50, offset: number = 0) {
  try {
    const [players, total] = await Promise.all([
      prisma.players.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          banks: {
            _count: "desc",
          },
        },
        include: {
          banks: true,
        }
      }),
      prisma.players.count(),
    ]);

    return {
      players: players.map(player => ({
        ...player,
        loyalty_points: player.loyalty_points ? Number(player.loyalty_points) : 0,
      })),
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error("Error fetching paginated players:", error);
    throw new Error("Failed to fetch paginated players");
  }
}

/**
 * Aggregate summary for a single player over an optional date range.
 * Used by the Summary tab to display cashdesk, slots, and loyalty totals.
 *
 * Returns:
 * - `cashdesk`    — total buy / sell at the cage
 * - `slots`       — bills inserted, TITO in/out, HANDPAY total
 * - `loyaltyCard` — session count, coin-in, loyalty points earned in period
 */
export async function getPlayerSummary(client_id: string, startDate?: Date, endDate?: Date) {
  try {
    // Get player with loyalty points
    const player = await prisma.players.findUnique({
      where: { client_id },
      select: {
        client_id: true,
        firstname: true,
        lastname: true,
        loyalty_points: true,
      },
    });

    if (!player) {
      return null;
    }

    // Build date filter — undefined means "all time"
    const dateFilter = startDate && endDate ? {
      gte: startDate,
      lte: endDate,
    } : undefined;

    // Get cash transactions aggregates
    const cashTransactions = await prisma.cash_transactions.aggregate({
      where: {
        client_id,
        ...(dateFilter && { gamedate: dateFilter }),
      },
      _sum: {
        buy: true,
        sell: true,
      },
    });

    // Get game sessions aggregates and count
    const gameSessions = await prisma.game_sessions.aggregate({
      where: {
        client_id,
        ...(dateFilter && { start_time: dateFilter }),
      },
      _sum: {
        bills: true,
        coin_in: true,
        cash_out: true,
      },
      _count: true,
    });

    // Get handpays total
    const handpays = await prisma.game_sessions.aggregate({
      where: {
        client_id,
        out_type: "HANDPAY",
        ...(dateFilter && { start_time: dateFilter }),
      },
      _sum: {
        cash_out: true,
      },
    });

    // ticketsIn: tickets bought at the cage and inserted into a machine (COUNTED = counted by the machine)
    const titoIn = await prisma.tito_transactions.aggregate({
      where: {
        client_id,
        redemption_status: "COUNTED",
        ...(dateFilter && { issuance_time: dateFilter }),
      },
      _sum: {
        amount: true,
      },
    });

    // ticketsOut: tickets issued by machines and redeemed at the cage (REDEEMED, not issued by cage)
    const titoIssued = await prisma.tito_transactions.aggregate({
      where: {
        client_id,
        redemption_status: "REDEEMED",
        NOT: { issuance_device: "CAGE-UNIQUE" },
        ...(dateFilter && { issuance_time: dateFilter }),
      },
      _sum: {
        amount: true,
      },
    });

    // Calculate loyalty points for the period (LOYALTY_RATIO × coin_in)
    const periodCoinIn = gameSessions._sum.coin_in ? Number(gameSessions._sum.coin_in) : 0;
    const periodLoyaltyPoints = periodCoinIn * LOYALTY_RATIO;

    return {
      player: {
        client_id: player.client_id,
        firstname: player.firstname,
        lastname: player.lastname,
        loyalty_points: player.loyalty_points ? Number(player.loyalty_points) : 0,
      },
      cashdesk: {
        purchased: cashTransactions._sum.buy ? Number(cashTransactions._sum.buy) : 0,
        paidBack: cashTransactions._sum.sell ? Number(cashTransactions._sum.sell) : 0,
      },
      slots: {
        bills: gameSessions._sum.bills ? Number(gameSessions._sum.bills) : 0,
        ticketsIn: titoIn._sum.amount ? Number(titoIn._sum.amount) : 0,
        ticketsOut: titoIssued._sum.amount ? Number(titoIssued._sum.amount) : 0,
        handpays: handpays._sum.cash_out ? Number(handpays._sum.cash_out) : 0,
      },
      loyaltyCard: {
        sessionsCount: gameSessions._count,
        coinIn: periodCoinIn,
        points: periodLoyaltyPoints,
      },
    };
  } catch (error) {
    console.error("Error fetching player summary:", error);
    throw new Error("Failed to fetch player summary");
  }
}

/**
 * Search players by first name, last name, and/or birth date.
 * All criteria are optional and combined with AND; name matches are
 * case-insensitive prefix searches (startsWith).
 */
export async function getPlayersBySearchCriteria(firstName?: string, lastName?: string, birthDate?: Date) {
  try {
    const players = await prisma.players.findMany({
      where: {
        firstname: firstName ? { startsWith: firstName, mode: "insensitive" } : undefined,
        lastname: lastName ? { startsWith: lastName, mode: "insensitive" } : undefined,
        birth_date: birthDate ? { equals: birthDate } : undefined,
      },
      orderBy: {
        lastname: "asc",
      },
    });
    return players.map(player => ({
      ...player,
      loyalty_points: player.loyalty_points ? Number(player.loyalty_points) : 0,
    }));
  } catch (error) {
    console.error("Error searching players:", error);
    throw new Error("Failed to search players");
  }
}