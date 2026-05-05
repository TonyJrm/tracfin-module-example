"use server";

import { GameSession } from "@/data/types";
import { prisma } from "@/lib/prisma";

export async function getCountAlertsByPlayer(
  client_id: string,
  startDate?: Date,
  endDate?: Date): Promise<GameSession[]> {
  try {
    const countAlert = await prisma.game_sessions.findMany({
      where: {
        has_stacker_alert: true,
        client_id,
        start_time: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    const formattedAlerts = countAlert.map(alert => ({
      ...alert,
      bills: alert.bills ? Number(alert.bills) : 0,
      coin_in: alert.coin_in ? Number(alert.coin_in) : 0,
      cash_out: alert.cash_out ? Number(alert.cash_out) : 0,
      jackpot: alert.jackpot ? Number(alert.jackpot) : 0,
    }));
    return formattedAlerts;
  } catch (error) {
    console.error("Error fetching count alerts:", error);
    throw new Error("Failed to fetch count alerts");
  }
}
