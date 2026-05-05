"use server";

import { prisma } from "@/lib/prisma";
import { LOYALTY_RATIO } from "@/lib/rules";

export type BwrCell = {
  value: number;
};

export type BwrRow = {
  client_id: string;
  lastname: string;
  firstname: string;
  birth_date: Date | null;
  is_anpr: boolean | null;
  is_im: boolean | null;
  months: Record<string, number>; // key: "YYYY-MM", value: points or visits
  total: number;
  /** Number of months with activity (value > 0) */
  nb_active_months: number;
  /** Number of empty months BEFORE first activity in the period */
  nb_bleu: number;
  /** Number of empty months AFTER last activity in the period */
  nb_rouge: number;
  /** Number of months where value exceeds the alert threshold */
  nb_alerte: number;
  /** Number of HANDPAY game sessions per month */
  handpay_months: Record<string, number>;
};

export type BwrData = {
  rows: BwrRow[];
  monthKeys: string[]; // ordered list of "YYYY-MM" keys
};

/**
 * Returns a list of "YYYY-MM" strings for every month between fromDate and toDate (inclusive).
 */
function getMonthKeys(fromDate: Date, toDate: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const end = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  while (cursor <= end) {
    keys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}

export async function getBwrData(
  fromDate: Date,
  toDate: Date,
  type: "points" | "visits",
  threshold: number
): Promise<BwrData> {
  const monthKeys = getMonthKeys(fromDate, toDate);

  // Inclusive range: start of fromDate month → end of toDate month
  const startDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const endDate = new Date(toDate.getFullYear(), toDate.getMonth() + 1, 1);

  const handpayRows = await prisma.$queryRaw<
    { client_id: string; month: string; count: bigint }[]
  >`
    SELECT
      gs.client_id::text,
      TO_CHAR(gs.start_time, 'YYYY-MM') AS month,
      COUNT(*) AS count
    FROM game_sessions gs
    WHERE gs.out_type = 'HANDPAY'
      AND gs.start_time >= ${startDate}
      AND gs.start_time < ${endDate}
    GROUP BY gs.client_id, TO_CHAR(gs.start_time, 'YYYY-MM')
  `;

  if (type === "visits") {
    // COUNT(DISTINCT gamedate) per client per month from cash_transactions
    const rows = await prisma.$queryRaw<
      { client_id: string; lastname: string; firstname: string; birth_date: Date | null; is_anpr: boolean | null; is_im: boolean | null; month: string; visits: bigint }[]
    >`
      SELECT
        p.client_id::text,
        p.lastname,
        p.firstname,
        p.birth_date,
        p.is_anpr,
        p.is_im,
        TO_CHAR(ct.gamedate, 'YYYY-MM') AS month,
        COUNT(DISTINCT ct.gamedate) AS visits
      FROM cash_transactions ct
      JOIN players p ON p.client_id = ct.client_id
      WHERE ct.gamedate >= ${startDate}
        AND ct.gamedate < ${endDate}
      GROUP BY p.client_id, p.lastname, p.firstname, p.birth_date, p.is_anpr, p.is_im, TO_CHAR(ct.gamedate, 'YYYY-MM')
      ORDER BY p.lastname, p.firstname
    `;

    return mergeHandpays(buildResult(rows, monthKeys, (r) => Number(r.visits), threshold), handpayRows);
  } else {
    // SUM(coin_in) * LOYALTY_RATIO per client per month from game_sessions
    const rows = await prisma.$queryRaw<
      { client_id: string; lastname: string; firstname: string; birth_date: Date | null; is_anpr: boolean | null; is_im: boolean | null; month: string; coin_in_sum: number }[]
    >`
      SELECT
        p.client_id::text,
        p.lastname,
        p.firstname,
        p.birth_date,
        p.is_anpr,
        p.is_im,
        TO_CHAR(gs.start_time, 'YYYY-MM') AS month,
        COALESCE(SUM(gs.coin_in), 0)::float8 AS coin_in_sum
      FROM game_sessions gs
      JOIN players p ON p.client_id = gs.client_id
      WHERE gs.start_time >= ${startDate}
        AND gs.start_time < ${endDate}
      GROUP BY p.client_id, p.lastname, p.firstname, p.birth_date, p.is_anpr, p.is_im, TO_CHAR(gs.start_time, 'YYYY-MM')
      ORDER BY p.lastname, p.firstname
    `;

    return mergeHandpays(buildResult(rows, monthKeys, (r) => r.coin_in_sum * LOYALTY_RATIO, threshold), handpayRows);
  }
}

function buildResult<T extends { client_id: string; lastname: string; firstname: string; birth_date: Date | null; is_anpr: boolean | null; is_im: boolean | null; month: string }>(
  rawRows: T[],
  monthKeys: string[],
  getValue: (row: T) => number,
  threshold: number
): BwrData {
  const map = new Map<string, BwrRow>();

  for (const raw of rawRows) {
    if (!map.has(raw.client_id)) {
      map.set(raw.client_id, {
        client_id: raw.client_id,
        lastname: raw.lastname,
        firstname: raw.firstname,
        birth_date: raw.birth_date,
        is_anpr: raw.is_anpr,
        is_im: raw.is_im,
        months: {},
        total: 0,
        nb_active_months: 0,
        nb_bleu: 0,
        nb_rouge: 0,
        nb_alerte: 0,
        handpay_months: {},
      });
    }
    const row = map.get(raw.client_id)!;
    const value = getValue(raw);
    row.months[raw.month] = value;
    row.total += value;
  }

  // Compute all derived fields server-side
  for (const row of map.values()) {
    let first = -1;
    let last = -1;
    let nbActive = 0;
    for (let i = 0; i < monthKeys.length; i++) {
      if ((row.months[monthKeys[i]] ?? 0) > 0) {
        if (first === -1) first = i;
        last = i;
        nbActive++;
      }
    }
    row.nb_active_months = nbActive;
    row.nb_bleu = first === -1 ? 0 : first;
    row.nb_rouge = last === -1 ? 0 : monthKeys.length - 1 - last;
    // Alerts only meaningful when player has more than 1 active month
    if (nbActive > 1 && threshold > 0 && monthKeys.length > 0) {
      const moyenne = row.total / monthKeys.length;
      const seuil = moyenne * (threshold / 100);
      for (const k of monthKeys) {
        if ((row.months[k] ?? 0) > seuil) row.nb_alerte++;
      }
    }
  }

  return {
    rows: Array.from(map.values()),
    monthKeys,
  };
}

function mergeHandpays(
  result: BwrData,
  handpayRows: { client_id: string; month: string; count: bigint }[]
): BwrData {
  const map = new Map<string, Record<string, number>>();
  for (const h of handpayRows) {
    if (!map.has(h.client_id)) map.set(h.client_id, {});
    map.get(h.client_id)![h.month] = Number(h.count);
  }
  for (const row of result.rows) {
    row.handpay_months = map.get(row.client_id) ?? {};
  }
  return result;
}
