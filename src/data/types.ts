import z from "zod";

/**
 * Zod schemas matching Prisma database schema
 * All schemas reflect the flat structure of the database tables
 */

/**
 * CASINOS
 */
export const casinoSchema = z.object({
  casino_id: z.string(),
  name: z.string(),
  created_at: z.date().nullable(),
});

export type Casino = z.infer<typeof casinoSchema>;

/**
 * PLAYERS
 */
export const playerSchema = z.object({
  client_id: z.string(),
  parent_casino_id: z.string(),
  picture_url: z.string().nullable(),
  gender: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  birth_date: z.date(),
  birth_place: z.string(),
  nationality: z.string(),
  profession: z.string(),
  phone_number: z.string(),
  email: z.string(),
  mobile: z.string(),
  address_number: z.string(),
  address_street: z.string(),
  address_postal_code: z.string().nullable(),
  address_city: z.string(),
  address_country: z.string(),
  id_doc_type: z.string(),
  id_doc_number: z.string(),
  id_doc_delivery_date: z.date(),
  id_doc_delivery_place: z.string(),
  id_doc_delivery_dept: z.string(),
  id_doc_expiring_date: z.date(),
  id_doc_country: z.string(),
  comments: z.string().nullable(),
  is_anpr: z.boolean().nullable(),
  is_im: z.boolean().nullable(),
  loyalty_points: z.number().nullable(),
  created_at: z.date().nullable(),
  updated_at: z.date().nullable(),
});

export const playerWithRelationsSchema = playerSchema.extend({
  banks: z.lazy(() => z.array(bankSchema)),
});

export type Player = z.infer<typeof playerSchema>;
export type PlayerWithRelations = z.infer<typeof playerWithRelationsSchema>;

/**
 * BANKS
 */
export const bankSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  bank_name: z.string(),
  account_number: z.string(),
  created_at: z.date().nullable(),
});

export type Bank = z.infer<typeof bankSchema>;

/**
 * GAME SESSIONS
 */
export const gameSessionSchema = z.object({
  id: z.string(),
  client_id: z.string().nullable(),
  start_time: z.date(),
  end_time: z.date(),
  machine_number: z.string(),
  bills: z.number(),
  coin_in: z.number(),
  cash_out: z.number(),
  jackpot: z.number().nullable(),
  out_type: z.string(),
  has_stacker_alert: z.boolean(),
  created_at: z.date().nullable(),
});

export type GameSession = z.infer<typeof gameSessionSchema>;

/**
 * CASH TRANSACTIONS
 * Flat structure - all fields are at the same level
 */
export const cashTransactionSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  game_session_id: z.string().nullable(),
  gamedate: z.date(),
  flow_datetime: z.date(),
  place: z.string(),
  buy: z.number(),
  sell: z.number(),
  transaction: z.string(),
  subtransaction: z.string(),
  is_jackpot: z.boolean().nullable(),
  is_taxable: z.boolean().nullable(),
  amount_before_tax: z.number().nullable(),
  tax_amount: z.number().nullable(),
  amount_after_tax: z.number().nullable(),
  value: z.number().nullable(),
  cheque_number: z.string().nullable(),
  account_number: z.string().nullable(),
  bank_name: z.string().nullable(),
  is_guaranteed: z.boolean().nullable(),
  guarantee_number: z.string().nullable(),
  related_txn_id: z.string().nullable(),
  created_at: z.date().nullable(),
});

export const cashTransactionWithRelationsSchema = cashTransactionSchema.extend({
  players: playerSchema.nullable(),
  game_sessions: gameSessionSchema.nullable(),
});

export type CashTransaction = z.infer<typeof cashTransactionSchema>;
export type CashTransactionWithRelations = z.infer<typeof cashTransactionWithRelationsSchema>;

/**
 * CSG PLAYER SUMMARY
 * Aggregated CSG data per player
 */
export type CsgPlayerSummary = {
  client_id: string;
  lastname: string;
  firstname: string;
  birth_date: Date | null;
  is_anpr: boolean | null;
  is_im: boolean | null;
  count: number;
  total_tax: number;
  total_before_tax: number;
};

/**
 * TITO TRANSACTIONS
 */
export const titoTransactionSchema = z.object({
  id: z.string(),
  game_session_id: z.string(),
  client_id: z.string(),
  ticket_number: z.string(),
  amount: z.number(),
  issuance_status: z.string(),
  redemption_status: z.string(),
  issuance_device: z.string(),
  redemption_device: z.string(),
  issuance_time: z.date(),
  redemption_time: z.date().nullable(),
  type: z.string(),
  issuance_serial_number: z.string(),
  redemption_serial_number: z.string().nullable(),
  created_at: z.date().nullable(),
});

export type TitoTransaction = z.infer<typeof titoTransactionSchema>;

/**
 * EXCHANGE REGISTER
 * Flat row (one per transaction) and grouped row (one per client)
 */
export type ExchangeRow = {
  client_id: string;
  lastname: string;
  firstname: string;
  birth_date: Date | null;
  flow_datetime: Date;
  buy: number;
  sell: number;
};

export type ExchangeGroupedRow = {
  client_id: string;
  lastname: string;
  firstname: string;
  birth_date: Date | null;
  transaction_count: number;
  total_buy: number;
  total_sell: number;
};

/**
 * PLAYER SUMMARY
 * Aggregate data computed from various tables
 */
export const playerSummarySchema = z.object({
  player: z.object({
    client_id: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    loyalty_points: z.number(),
  }),
  cashdesk: z.object({
    purchased: z.number(),
    paidBack: z.number(),
  }),
  slots: z.object({
    bills: z.number(),
    ticketsIn: z.number(),
    ticketsOut: z.number(),
    handpays: z.number(),
  }),
  loyaltyCard: z.object({
    sessionsCount: z.number(),
    coinIn: z.number(),
    points: z.number(),
  }),
});

export type PlayerSummary = z.infer<typeof playerSummarySchema>;

/**
 * REQUISITIONS
 */
export const requisitionSchema = z.object({
  id: z.string(),
  requested_lastname: z.string().min(1, "Last name is required"),
  requested_firstname: z.string().min(1, "First name is required"),
  requested_birth_date: z.date().max(new Date(), "Birth date cannot be in the future"),
  added_at: z.date(),
  found_at: z.date().nullable(),
  found_client_id: z.string().nullable(),
  remarks: z.string().max(255),
  created_at: z.date().nullable(),
});

export const requisitionWithRelationsSchema = requisitionSchema.extend({
  players: playerSchema.nullable(),
});

export const requisitionFormSchema = requisitionSchema.pick({
  requested_lastname: true,
  requested_firstname: true,
  requested_birth_date: true,
  added_at: true,
  remarks: true,
});

export type Requisition = z.infer<typeof requisitionSchema>;
export type RequisitionWithRelations = z.infer<typeof requisitionWithRelationsSchema>;
export type RequisitionFormData = z.infer<typeof requisitionFormSchema>;


/**
 * SENSITIVE AREAS
 */
export const sensitiveAreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  street: z.string(),
  city: z.string(),
  description: z.string().nullable(),
  created_at: z.date().nullable(),
});

export const playersFoundInSensitiveAreasSchema = z.object({
  client_id: z.string(),
  lastname: z.string(),
  firstname: z.string(),
  birth_date: z.date(),
  address: z.string(),
  city: z.string(),
  last_visit: z.date().nullable(),
  matched_areas: z.lazy(() => z.array(sensitiveAreaSchema)),
});

export const sensitiveAreasResultSchema = z.object({
  sensitive_areas: z.lazy(() => z.array(sensitiveAreaSchema)),
  players_found: z.lazy(() => z.array(playersFoundInSensitiveAreasSchema)),
});

export const sensitiveAreaFormSchema = sensitiveAreaSchema.pick({
  name: true,
  street: true,
  city: true,
});


export type PlayersFoundInSensitiveAreas = z.infer<typeof playersFoundInSensitiveAreasSchema>;

export type SensitiveArea = z.infer<typeof sensitiveAreaSchema>;
export type SensitiveAreaFormData = z.infer<typeof sensitiveAreaFormSchema>;
export type SensitiveAreasResult = z.infer<typeof sensitiveAreasResultSchema>;