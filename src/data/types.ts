import z from "zod";

/**
 * PLAYER PROFILE
 * - client_id: string (unique identifier for the player)
 * - parent_casino_id: string (identifier for the casino where the player was registered)
 */

enum IdDocumentType {
  PASSPORT = "passport",
  ID_CARD = "id_card",
  DRIVER_LICENSE = "driver_license",
}

export const idDocumentSchema = z.object({
  type: z.enum(IdDocumentType),
  number: z.string(),
  delivery_date: z.date(),
  delivery_place: z.string(),
  delivery_dept: z.string(),
  expiring_date: z.date(),
  country: z.string(),
});

export const idDocumentAddressSchema = z.object({
  number: z.string(),
  street: z.string(),
  postal_code: z.string(),
  city: z.string(),
  country: z.string(),
});

export const playerSchema = z.object({
  client_id: z.string(),
  parent_casino_id: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  birth_date: z.date(),
  birth_place: z.string(),
  nationality: z.string(),
  profession: z.string(),
  phone_number: z.string(),
  email: z.email(),
  mobile: z.string(),
  address: idDocumentAddressSchema,
  id_document: idDocumentSchema,
  comments: z.string().nullable(),
});

export type Player = z.infer<typeof playerSchema>;

/**
 * CASINO PROFILE
 * - casino_id: string (unique identifier for the casino)
 */

export const casinoSchema = z.object({
  casino_id: z.string(),
  name: z.string(),
});

export type Casino = z.infer<typeof casinoSchema>;