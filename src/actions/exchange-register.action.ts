"use server";

import { ExchangeGroupedRow, ExchangeRow } from "@/data/types";
import { prisma } from "@/lib/prisma";

/**
 * Fetch all cash transactions within the given date range in chronological order.
 * Each row represents a single transaction with the player's identity details.
 *
 * Used by the Exchange Register view in "flat / detail" mode.
 */
export async function getExchangeRegister(
  fromDate: Date,
  toDate: Date,
): Promise<ExchangeRow[]> {
  try {
    const txns = await prisma.cash_transactions.findMany({
      where: {
        flow_datetime: { gte: fromDate, lte: toDate },
      },
      include: { players: true },
      orderBy: { flow_datetime: "asc" },
    });

    return txns.map((tx) => ({
      client_id: tx.client_id,
      lastname: tx.players?.lastname ?? "",
      firstname: tx.players?.firstname ?? "",
      birth_date: tx.players?.birth_date ?? null,
      flow_datetime: tx.flow_datetime,
      buy: tx.buy ? Number(tx.buy) : 0,
      sell: tx.sell ? Number(tx.sell) : 0,
    }));
  } catch (error) {
    console.error("Error fetching exchange register:", error);
    throw error;
  }
}

/**
 * Aggregate cash transactions by player within the given date range.
 * Returns one row per player with total buy, total sell, and transaction count,
 * sorted by total buy descending (highest spenders first).
 *
 * Used by the Exchange Register view in "grouped / summary" mode.
 * Note: aggregation is done in JS (not SQL) to avoid a raw query — acceptable
 * given the view already filters to a date range.
 */
export async function getExchangeRegisterGrouped(
  fromDate: Date,
  toDate: Date,
): Promise<ExchangeGroupedRow[]> {
  try {
    const txns = await prisma.cash_transactions.findMany({
      where: {
        flow_datetime: { gte: fromDate, lte: toDate },
      },
      include: { players: true },
    });

    // Group by client_id using a Map for O(n) aggregation
    const map = new Map<string, ExchangeGroupedRow>();
    for (const tx of txns) {
      const buy = tx.buy ? Number(tx.buy) : 0;
      const sell = tx.sell ? Number(tx.sell) : 0;
      const existing = map.get(tx.client_id);
      if (existing) {
        existing.transaction_count += 1;
        existing.total_buy += buy;
        existing.total_sell += sell;
      } else {
        map.set(tx.client_id, {
          client_id: tx.client_id,
          lastname: tx.players?.lastname ?? "",
          firstname: tx.players?.firstname ?? "",
          birth_date: tx.players?.birth_date ?? null,
          transaction_count: 1,
          total_buy: buy,
          total_sell: sell,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total_buy - a.total_buy);
  } catch (error) {
    console.error("Error fetching grouped exchange register:", error);
    throw error;
  }
}
