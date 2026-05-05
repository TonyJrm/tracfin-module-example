"use server";

import { TitoTransaction } from "@/data/types";
import { prisma } from "@/lib/prisma";

export async function getTitoTransactionsByPlayer(
  client_id: string,
  startDate?: Date,
  endDate?: Date): Promise<TitoTransaction[]> {
  try {
    const sessions = await prisma.game_sessions.findMany({
      where: {
        client_id,
        start_time: {
          gte: startDate,
        },
        end_time: {
          lte: endDate,
        },
      },
      include: {
        tito_transactions: true,
      },
    });
    const transactions = sessions.flatMap(session => session.tito_transactions.map(tx => ({
      ...tx,
      amount: tx.amount ? Number(tx.amount) : 0,
    })))
      .sort((a, b) => a.issuance_time.getTime() - b.issuance_time.getTime());
    return transactions;
  } catch (error) {
    console.error("Error fetching Tito transactions:", error);
    throw error;
  }
}