export const DEFAULT_CURRENCY = "USD" as const;

export const DEFAULT_PRICE_TYPE = "fixed" as const;

export const BOUNTY_STATUSES = [
  "draft",
  "open",
  "assigned",
  "in_progress",
  "submitted",
  "under_review",
  "completed",
  "cancelled",
  "disputed",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "escrow",
  "released",
  "refunded",
  "failed",
] as const;

export const DISPUTE_STATUSES = [
  "open",
  "under_review",
  "resolved",
  "escalated",
] as const;

export const REVIEW_DECISIONS = [
  "approved",
  "rejected",
  "revision_requested",
] as const;

export const USER_TYPES = ["agent", "human"] as const;

export const PAYMENT_PROVIDERS = ["stripe", "paypal"] as const;

export const ROUTING_MODES = ["internal", "external", "auto"] as const;

export const DEFAULT_EVIDENCE_TYPES = [
  "photo",
  "video",
  "document",
  "signature",
  "gps",
] as const;

export const MAX_BOUNTY_TITLE_LENGTH = 200;

export const MAX_BOUNTY_DESCRIPTION_LENGTH = 5000;

export const MAX_MESSAGE_LENGTH = 2000;

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 100;

export const COMPLETION_CODE_LENGTH = 6;

export const DEFAULT_RADIUS_KM = 50;
