"use server";

import { Player } from "@/data/types";
import { getAllPlayers } from "./player.action";
import { prisma } from "@/lib/prisma";

export interface CrossTabData {
  nationalities: string[];
  countries: string[];
  matrix: Record<string, Record<string, number>>;
  rowTotals: Record<string, number>; // Total par pays
  columnTotals: Record<string, number>; // Total par nationalité
  grandTotal: number; // Total général
}

export async function calculateCrossTab(): Promise<CrossTabData> {
  const data = await getAllPlayers();

  const nationalitiesSet = new Set<string>();
  const countriesSet = new Set<string>();
  const matrix: Record<string, Record<string, number>> = {};

  // Collect all nationalities and countries
  data.forEach((player) => {
    nationalitiesSet.add(player.nationality);
    countriesSet.add(player.address_country);
  });

  // Initialize matrix
  nationalitiesSet.forEach((nationality) => {
    matrix[nationality] = {};
    countriesSet.forEach((country) => {
      matrix[nationality][country] = 0;
    });
  });

  // Count occurrences
  data.forEach((player) => {
    if (matrix[player.nationality]) {
      matrix[player.nationality][player.address_country] =
        (matrix[player.nationality][player.address_country] || 0) + 1;
    }
  });

  // Calculate totals
  const rowTotals: Record<string, number> = {};
  const columnTotals: Record<string, number> = {};
  let grandTotal = 0;

  // Calculate row totals (total per country)
  countriesSet.forEach((country) => {
    let total = 0;
    nationalitiesSet.forEach((nationality) => {
      total += matrix[nationality][country] || 0;
    });
    rowTotals[country] = total;
    grandTotal += total;
  });

  // Calculate column totals (total per nationality)
  nationalitiesSet.forEach((nationality) => {
    let total = 0;
    countriesSet.forEach((country) => {
      total += matrix[nationality][country] || 0;
    });
    columnTotals[nationality] = total;
  });

  return {
    nationalities: Array.from(nationalitiesSet).sort(),
    countries: Array.from(countriesSet).sort(),
    matrix,
    rowTotals,
    columnTotals,
    grandTotal,
  };
}

export interface PaginatedPlayers {
  players: Player[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getFilteredPlayers(
  nationality: string,
  country: string,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedPlayers> {
  const skip = (page - 1) * pageSize;

  const [players, total] = await Promise.all([
    prisma.players.findMany({
      where: {
        nationality,
        address_country: country,
      },
      skip,
      take: pageSize,
      orderBy: [
        { lastname: 'asc' },
        { firstname: 'asc' },
      ],
    }),
    prisma.players.count({
      where: {
        nationality,
        address_country: country,
      },
    }),
  ]);

  const formattedPlayers = players.map((player) => ({
    ...player,
    loyalty_points: player.loyalty_points ? Number(player.loyalty_points) : 0,
  }));

  return {
    players: formattedPlayers,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
