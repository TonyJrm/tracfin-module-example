/**
 * CSG (Contribution Sociale Généralisée) rate applied to taxable winnings.
 * French regulatory rate — 13.7%.
 */
export const CSG_RATE = 13.7; // in percentage

/**
 * Minimum gross win amount (in €) above which a slot machine win (GAINMAS)
 * becomes subject to CSG taxation.
 * GAINJT (table game wins) are never taxable; JACKPOT is always taxable
 * regardless of amount.
 */
export const WIN_SLOTS_THRESHOLD_BEFORE_TAX = 1500; // in euros

/**
 * Conversion factor for the casino loyalty programme.
 * 1 euro wagered = 0.1 loyalty point.
 */
export const LOYALTY_RATIO = 0.1; // €1 = 0.1 loyalty point

/**
 * Stacker alert multiplier.
 * A machine’s daily cash-in triggers a surveillance alert when it exceeds
 * STACKER_ALERT_RATIO × the casino’s average daily cash-in.
 */
export const STACKER_ALERT_RATIO = 3;