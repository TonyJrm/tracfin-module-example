"use server";

import { RequisitionFormData } from "@/data/types";
import { prisma } from "@/lib/prisma";

export async function getAllRequisitions() {
  try {
    const requisitions = await prisma.requisitions.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
    return requisitions;
  } catch (error) {
    console.error("Error fetching requisitions:", error);
    throw new Error("Failed to fetch requisitions");
  }
}

export async function createRequisition(data: RequisitionFormData) {
  try {
    const newRequisition = await prisma.requisitions.create({
      data: {
        requested_lastname: data.requested_lastname,
        requested_firstname: data.requested_firstname,
        requested_birth_date: data.requested_birth_date,
        added_at: new Date(),
        remarks: data.remarks,
      }
    })
    return newRequisition;
  } catch (error) {
    console.error("Error creating requisition:", error);
    throw new Error("Failed to create requisition");
  }
}

export async function markRequisitionAsFound(id: string, found_client_id: string) {
  try {
    const updatedRequisition = await prisma.requisitions.update({
      where: { id },
      data: {
        found_at: new Date(),
        found_client_id,
      }
    });
    return updatedRequisition;
  } catch (error) {
    console.error("Error marking requisition as found:", error);
    throw new Error("Failed to mark requisition as found");
  }
}

export async function deleteRequisition(id: string) {
  try {
    await prisma.requisitions.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Error deleting requisition:", error);
    throw new Error("Failed to delete requisition");
  }
}

export async function searchPlayersForRequisition(lastname: string, firstname: string, birth_date: Date) {
  try {
    const players = await prisma.players.findMany({
      where: {
        lastname: { equals: lastname, mode: "insensitive" },
        firstname: { equals: firstname, mode: "insensitive" },
        birth_date: { equals: birth_date },
      }
    })
    const formattedPlayers = players.map(player => ({
      ...player,
      loyalty_points: player.loyalty_points ? Number(player.loyalty_points) : 0,
    }))
    return formattedPlayers;
  } catch (error) {
    console.error("Error searching player for requisition:", error);
    throw new Error("Failed to search player for requisition");
  }
}