"use server";

import { CashTransaction, CashTransactionWithRelations, CsgPlayerSummary } from "@/data/types";
import { prisma } from "@/lib/prisma";

export async function getCashTransactionsByPlayer(
  client_id: string,
  startDate?: Date,
  endDate?: Date
): Promise<CashTransaction[]> {
  try {
    const transactions = await prisma.cash_transactions.findMany({
      where: {
        client_id,
        flow_datetime: {
          gte: startDate,
          lte: endDate,
        },
        transaction: {
          not: "TAX", // Exclude tax transactions
        }
      },
    });
    const formattedTransactions = transactions.map(tx => ({
      ...tx,
      buy: tx.buy ? Number(tx.buy) : 0,
      sell: tx.sell ? Number(tx.sell) : 0,
      value: tx.value ? Number(tx.value) : 0,
      amount_after_tax: tx.amount_after_tax ? Number(tx.amount_after_tax) : 0,
      amount_before_tax: tx.amount_before_tax ? Number(tx.amount_before_tax) : 0,
      tax_amount: tx.tax_amount ? Number(tx.tax_amount) : 0,
    }));

    return formattedTransactions;
  } catch (error) {
    console.error("Error fetching cash transactions:", error);
    throw error;
  }
}

type CashTransactionFilters = {
  transaction?: string;
  subtransaction?: string;
};

export async function getCashTransactions(startDate: Date, endDate: Date, filters?: CashTransactionFilters): Promise<CashTransactionWithRelations[]> {
  try {
    const transactions = await prisma.cash_transactions.findMany({
      where: {
        ...(filters?.transaction && { transaction: filters.transaction }),
        ...(filters?.subtransaction && { subtransaction: filters.subtransaction }),
        flow_datetime: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        players: true,
        game_sessions: true,
      },
    });
    const formattedTransactions = transactions.map(tx => ({
      ...tx,
      buy: tx.buy ? Number(tx.buy) : 0,
      sell: tx.sell ? Number(tx.sell) : 0,
      value: tx.value ? Number(tx.value) : 0,
      amount_after_tax: tx.amount_after_tax ? Number(tx.amount_after_tax) : 0,
      amount_before_tax: tx.amount_before_tax ? Number(tx.amount_before_tax) : 0,
      tax_amount: tx.tax_amount ? Number(tx.tax_amount) : 0,
      players: tx.players ? {
        ...tx.players,
        loyalty_points: tx.players.loyalty_points ? Number(tx.players.loyalty_points) : 0,
      } : null,
      game_sessions: tx.game_sessions ? {
        ...tx.game_sessions,
        bills: tx.game_sessions.bills ? Number(tx.game_sessions.bills) : 0,
        coin_in: tx.game_sessions.coin_in ? Number(tx.game_sessions.coin_in) : 0,
        cash_out: tx.game_sessions.cash_out ? Number(tx.game_sessions.cash_out) : 0,
        jackpot: tx.game_sessions.jackpot ? Number(tx.game_sessions.jackpot) : 0,
      } : null,
    }));

    return formattedTransactions;
  } catch (error) {
    console.error("Error fetching cash transactions:", error);
    throw error;
  }
}

export async function getCsgSummaryByPlayer(startDate: Date, endDate: Date): Promise<CsgPlayerSummary[]> {
  try {
    const transactions = await prisma.cash_transactions.findMany({
      where: {
        is_taxable: true,
        flow_datetime: { gte: startDate, lte: endDate },
      },
      include: { players: true },
    });

    const map = new Map<string, CsgPlayerSummary>();
    for (const tx of transactions) {
      const existing = map.get(tx.client_id);
      const taxAmount = tx.tax_amount ? Number(tx.tax_amount) : 0;
      const beforeTax = tx.amount_before_tax ? Number(tx.amount_before_tax) : 0;
      if (existing) {
        existing.count += 1;
        existing.total_tax += taxAmount;
        existing.total_before_tax += beforeTax;
      } else {
        map.set(tx.client_id, {
          client_id: tx.client_id,
          lastname: tx.players?.lastname ?? '',
          firstname: tx.players?.firstname ?? '',
          birth_date: tx.players?.birth_date ?? null,
          is_anpr: tx.players?.is_anpr ?? null,
          is_im: tx.players?.is_im ?? null,
          count: 1,
          total_tax: taxAmount,
          total_before_tax: beforeTax,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total_tax - a.total_tax);
  } catch (error) {
    console.error("Error fetching CSG summary:", error);
    throw error;
  }
}