"use server";

import { GameSession } from "@/data/types";
import { prisma } from "@/lib/prisma";

export async function getGameSessionsByClientId(client_id: string, start_date?: Date, end_date?: Date): Promise<GameSession[]> {
  try {
    const transactions = await prisma.game_sessions.findMany({
      where: {
        client_id,
        start_time: {
          gte: start_date,
        },
        end_time: {
          lte: end_date,
        },
      },
      orderBy: {
        start_time: "desc",
      }
    });
    const formattedTransactions = transactions.map(tx => ({
      ...tx,
      bills: tx.bills ? Number(tx.bills) : 0,
      coin_in: tx.coin_in ? Number(tx.coin_in) : 0,
      cash_out: tx.cash_out ? Number(tx.cash_out) : 0,
      jackpot: tx.jackpot ? Number(tx.jackpot) : 0,
    }));
    return formattedTransactions;
  } catch (error) {
    console.error("Error fetching game sessions:", error);
    throw error;
  }
}