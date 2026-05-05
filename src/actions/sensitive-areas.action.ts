"use server";

import { SensitiveAreaFormData, SensitiveAreasResult } from "@/data/types";
import { prisma } from "@/lib/prisma";

export async function getPlayersInSensitiveAreas(): Promise<SensitiveAreasResult> {
  try {
    const areas = await prisma.sensitive_areas.findMany();

    if (areas.length === 0) return { sensitive_areas: [], players_found: [] };

    const players = await prisma.players.findMany({
      where: {
        AND: [
          {
            OR: areas.map((area) => ({
              address_city: { contains: area.city, mode: "insensitive" },
              address_street: { contains: area.street, mode: "insensitive" },
            })),
          },
          { game_sessions: { some: {} } },
        ],
      },
      select: {
        client_id: true,
        lastname: true,
        firstname: true,
        birth_date: true,
        address_number: true,
        address_street: true,
        address_city: true,
        game_sessions: {
          orderBy: { start_time: "desc" },
          take: 1,
          select: { start_time: true },
        },
      },
    });

    const players_found = players.map((p) => ({
      client_id: p.client_id,
      lastname: p.lastname,
      firstname: p.firstname,
      birth_date: p.birth_date,
      address: `${p.address_number} ${p.address_street}`,
      city: p.address_city,
      last_visit: p.game_sessions[0]?.start_time ?? null,
      matched_areas: areas.filter(
        (a) =>
          p.address_city.toLowerCase().includes(a.city.toLowerCase()) &&
          p.address_street.toLowerCase().includes(a.street.toLowerCase())
      ),
    }));

    return { sensitive_areas: areas, players_found };
  } catch (error) {
    console.error("Error fetching players in sensitive areas:", error);
    throw error;
  }
}

export async function addSensitiveArea(data: SensitiveAreaFormData) {
  try {
    await prisma.sensitive_areas.create({
      data: {
        name: data.name,
        street: data.street,
        city: data.city,
      },
    });
  } catch (error) {
    console.error("Error adding sensitive area:", error);
    throw error;
  }
}

export async function deleteSensitiveArea(id: string) {
  try {
    await prisma.sensitive_areas.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error deleting sensitive area:", error);
    throw error;
  }
}