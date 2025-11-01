/**
 * Cloudflare D1 (SQLite) Complete Schema
 * 
 * Fully migrated from PostgreSQL to D1/SQLite.
 * All 43 tables converted with proper type mappings.
 */

import { type SQL, relations, sql } from "drizzle-orm";
import {
  integer,
  real,
  text,
  blob,
  sqliteTable,
  index,
  uniqueIndex,
  foreignKey,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ============================================================================
// TYPE DEFINITIONS FOR ENUMS (SQLite doesn't have native enums)
// ============================================================================

export const accountTypeValues = ["depository", "credit", "other_asset", "loan", "other_liability"] as const;
export type AccountType = typeof accountTypeValues[number];

export const bankProvidersValues = ["gocardless", "plaid", "teller", "enablebanking"] as const;
export type BankProvider = typeof bankProvidersValues[number];

export const connectionStatusValues = ["disconnected", "connected", "unknown"] as const;
export type ConnectionStatus = typeof connectionStatusValues[number];

export const documentProcessingStatusValues = ["pending", "processing", "completed", "failed"] as const;
export type DocumentProcessingStatus = typeof documentProcessingStatusValues[number];

export const inboxAccountProvidersValues = ["gmail", "outlook"] as const;
export type InboxAccountProvider = typeof inboxAccountProvidersValues[number];

export const inboxAccountStatusValues = ["connected", "disconnected"] as const;
export type InboxAccountStatus = typeof inboxAccountStatusValues[number];

export const inboxStatusValues = [
  "processing", "pending", "archived", "new", "analyzing", 
  "suggested_match", "no_match", "done", "deleted"
] as const;
export type InboxStatus = typeof inboxStatusValues[number];

export const inboxTypeValues = ["invoice", "expense"] as const;
export type InboxType = typeof inboxTypeValues[number];

export const invoiceDeliveryTypeValues = ["create", "create_and_send", "scheduled"] as const;
export type InvoiceDeliveryType = typeof invoiceDeliveryTypeValues[number];

export const invoiceSizeValues = ["a4", "letter"] as const;
export type InvoiceSize = typeof invoiceSizeValues[number];

export const invoiceStatusValues = ["draft", "overdue", "paid", "unpaid", "canceled", "scheduled"] as const;
export type InvoiceStatus = typeof invoiceStatusValues[number];

export const plansValues = ["trial", "starter", "pro"] as const;
export type Plan = typeof plansValues[number];

export const subscriptionStatusValues = [
  "active", "canceled", "past_due", "unpaid", "trialing", 
  "incomplete", "incomplete_expired"
] as const;
export type SubscriptionStatus = typeof subscriptionStatusValues[number];

export const reportTypesValues = ["profit", "revenue", "burn_rate", "expense"] as const;
export type ReportType = typeof reportTypesValues[number];

export const teamRolesValues = ["owner", "member"] as const;
export type TeamRole = typeof teamRolesValues[number];

export const trackerStatusValues = ["in_progress", "completed"] as const;
export type TrackerStatus = typeof trackerStatusValues[number];

export const transactionMethodsValues = [
  "payment", "card_purchase", "card_atm", "transfer", "other", 
  "unknown", "ach", "interest", "deposit", "wire", "fee"
] as const;
export type TransactionMethod = typeof transactionMethodsValues[number];

export const transactionStatusValues = ["posted", "pending", "excluded", "completed", "archived"] as const;
export type TransactionStatus = typeof transactionStatusValues[number];

export const transactionFrequencyValues = [
  "weekly", "biweekly", "monthly", "semi_monthly", 
  "annually", "irregular", "unknown"
] as const;
export type TransactionFrequency = typeof transactionFrequencyValues[number];

export const activityTypeValues = [
  "transactions_enriched", "transactions_created", "invoice_paid", "inbox_new",
  "inbox_auto_matched", "inbox_needs_review", "inbox_cross_currency_matched",
  "invoice_overdue", "invoice_sent", "inbox_match_confirmed", "document_uploaded",
  "document_processed", "invoice_duplicated", "invoice_scheduled", 
  "invoice_reminder_sent", "invoice_cancelled", "invoice_created",
  "draft_invoice_created", "tracker_entry_created", "tracker_project_created",
  "transactions_categorized", "transactions_assigned", "transaction_attachment_created",
  "transaction_category_created", "transactions_exported", "customer_created"
] as const;
export type ActivityType = typeof activityTypeValues[number];

export const activitySourceValues = ["system", "user"] as const;
export type ActivitySource = typeof activitySourceValues[number];

export const activityStatusValues = ["unread", "read", "archived"] as const;
export type ActivityStatus = typeof activityStatusValues[number];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function generateUUID(): string {
  return crypto.randomUUID();
}

const timestampColumn = (name: string) => 
  integer(name, { mode: "timestamp" });

const booleanColumn = (name: string) => 
  integer(name, { mode: "boolean" });

// ============================================================================
// TABLES
// ============================================================================

// Teams Table
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  inboxId: text("inbox_id"),
  emailLanguage: text("email_language").default("en"),
  inboxEmail: text("inbox_email"),
  inboxForwarding: booleanColumn("inbox_forwarding").default(false),
  baseUrl: text("base_url"),
  plan: text("plan").notNull(),
  countryCode: text("country_code"),
  canceledAt: timestampColumn("canceled_at"),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  documentClassification: booleanColumn("document_classification").default(false),
  revalidate: integer("revalidate"),
  webVerification: text("web_verification"),
  webVerified: booleanColumn("web_verified"),
  invoiceSequence: integer("invoice_sequence").default(1),
}, (table) => ({
  nameIdx: index("teams_name_idx").on(table.name),
  inboxIdIdx: uniqueIndex("teams_inbox_id_key").on(table.inboxId),
}));

// Users Table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  email: text("email"),
  teamId: text("team_id"),
  createdAt: timestampColumn("created_at").$defaultFn(() => new Date()),
  locale: text("locale").default("en"),
  weekStartsOnMonday: booleanColumn("week_starts_on_monday").default(false),
  timezone: text("timezone"),
  timezoneAutoSync: booleanColumn("timezone_auto_sync").default(true),
  timeFormat: integer("time_format").default(24),
  dateFormat: text("date_format"),
}, (table) => ({
  teamIdIdx: index("users_team_id_idx").on(table.teamId),
}));

// Users on Team
export const usersOnTeam = sqliteTable("users_on_team", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  userId: text("user_id").notNull(),
  teamId: text("team_id").notNull(),
  role: text("role").notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userTeamIdx: uniqueIndex("users_on_team_user_id_team_id_key").on(table.userId, table.teamId),
  teamIdIdx: index("users_on_team_team_id_idx").on(table.teamId),
  userIdIdx: index("users_on_team_user_id_idx").on(table.userId),
}));

// Users in Auth (for Supabase Auth compatibility)
export const usersInAuth = sqliteTable("users_in_auth", {
  id: text("id").primaryKey().notNull(),
  email: text("email"),
});

// Bank Accounts
export const bankAccounts = sqliteTable("bank_accounts", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  name: text("name").notNull(),
  currency: text("currency"),
  teamId: text("team_id").notNull(),
  bankConnectionId: text("bank_connection_id"),
  accountId: text("account_id"),
  enabled: booleanColumn("enabled").default(true),
  type: text("type"),
  balance: real("balance"),
  manual: booleanColumn("manual").default(false),
}, (table) => ({
  teamIdIdx: index("bank_accounts_team_id_idx").on(table.teamId),
  connectionIdIdx: index("bank_accounts_bank_connection_id_idx").on(table.bankConnectionId),
}));

// Bank Connections
export const bankConnections = sqliteTable("bank_connections", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  institutionId: text("institution_id").notNull(),
  name: text("name"),
  logoUrl: text("logo_url"),
  provider: text("provider"),
  teamId: text("team_id").notNull(),
  accessToken: text("access_token"),
  enrollmentId: text("enrollment_id"),
  status: text("status"),
  lastAccessed: timestampColumn("last_accessed"),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  expiresAt: timestampColumn("expires_at"),
  errorDetails: text("error_details"),
  referenceId: text("reference_id"),
}, (table) => ({
  teamIdIdx: index("bank_connections_team_id_idx").on(table.teamId),
  institutionIdIdx: index("bank_connections_institution_id_idx").on(table.institutionId),
}));

// Transactions
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  date: text("date").notNull(),
  name: text("name").notNull(),
  method: text("method").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  teamId: text("team_id").notNull(),
  assignedId: text("assigned_id"),
  note: text("note"),
  bankAccountId: text("bank_account_id"),
  internalId: text("internal_id").notNull(),
  status: text("status").default("posted"),
  balance: real("balance"),
  manual: booleanColumn("manual").default(false),
  notified: booleanColumn("notified").default(false),
  internal: booleanColumn("internal").default(false),
  description: text("description"),
  categorySlug: text("category_slug"),
  baseAmount: real("base_amount"),
  counterpartyName: text("counterparty_name"),
  baseCurrency: text("base_currency"),
  taxAmount: real("tax_amount"),
  taxRate: real("tax_rate"),
  taxType: text("tax_type"),
  recurring: booleanColumn("recurring"),
  frequency: text("frequency"),
  merchantName: text("merchant_name"),
  enrichmentCompleted: booleanColumn("enrichment_completed").default(false),
}, (table) => ({
  teamIdIdx: index("transactions_team_id_idx").on(table.teamId),
  dateIdx: index("transactions_date_idx").on(table.date),
  bankAccountIdIdx: index("transactions_bank_account_id_idx").on(table.bankAccountId),
  categorySlugIdx: index("transactions_category_slug_idx").on(table.categorySlug),
  internalIdIdx: uniqueIndex("transactions_internal_id_key").on(table.internalId),
  assignedIdIdx: index("transactions_assigned_id_idx").on(table.assignedId),
}));

// Transaction Categories
export const transactionCategories = sqliteTable("transaction_categories", {
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  color: text("color"),
  description: text("description"),
  teamId: text("team_id").notNull(),
  system: booleanColumn("system").default(false).notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  vat: real("vat"),
}, (table) => ({
  pk: primaryKey({ columns: [table.teamId, table.slug] }),
  teamIdIdx: index("transaction_categories_team_id_idx").on(table.teamId),
}));

// Transaction Tags
export const transactionTags = sqliteTable("transaction_tags", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  transactionId: text("transaction_id").notNull(),
  tagId: text("tag_id").notNull(),
}, (table) => ({
  transactionIdIdx: index("transaction_tags_transaction_id_idx").on(table.transactionId),
  tagIdIdx: index("transaction_tags_tag_id_idx").on(table.tagId),
  uniqueTransactionTag: uniqueIndex("transaction_tags_transaction_id_tag_id_key").on(table.transactionId, table.tagId),
}));

// Transaction Attachments
export const transactionAttachments = sqliteTable("transaction_attachments", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  transactionId: text("transaction_id").notNull(),
  path: text("path"),
  name: text("name"),
  size: integer("size"),
  type: text("type"),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  teamId: text("team_id").notNull(),
}, (table) => ({
  transactionIdIdx: index("transaction_attachments_transaction_id_idx").on(table.transactionId),
  teamIdIdx: index("transaction_attachments_team_id_idx").on(table.teamId),
}));

// Transaction Enrichments
export const transactionEnrichments = sqliteTable("transaction_enrichments", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  transactionId: text("transaction_id").notNull(),
  data: text("data", { mode: "json" }),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  transactionIdIdx: index("transaction_enrichments_transaction_id_idx").on(table.transactionId),
}));

// Transaction Match Suggestions
export const transactionMatchSuggestions = sqliteTable("transaction_match_suggestions", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  transactionId: text("transaction_id").notNull(),
  inboxId: text("inbox_id").notNull(),
  score: real("score").notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  transactionIdIdx: index("transaction_match_suggestions_transaction_id_idx").on(table.transactionId),
  inboxIdIdx: index("transaction_match_suggestions_inbox_id_idx").on(table.inboxId),
}));

// Document Tag Embeddings (vector removed, store externally)
export const documentTagEmbeddings = sqliteTable("document_tag_embeddings", {
  slug: text("slug").primaryKey().notNull(),
  name: text("name").notNull(),
  model: text("model").notNull().default("gemini-embedding-001"),
  // NOTE: Vector embeddings moved to external vector database (Cloudflare Vectorize)
}, (table) => ({
}));

// Transaction Category Embeddings (vector removed)
export const transactionCategoryEmbeddings = sqliteTable("transaction_category_embeddings", {
  name: text("name").primaryKey().notNull(),
  model: text("model").notNull().default("gemini-embedding-001"),
  system: booleanColumn("system").default(false).notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestampColumn("updated_at").notNull().$defaultFn(() => new Date()),
  // NOTE: Vector embeddings moved to external vector database
}, (table) => ({
  systemIdx: index("transaction_category_embeddings_system_idx").on(table.system),
}));

// Transaction Embeddings (vector removed)
export const transactionEmbeddings = sqliteTable("transaction_embeddings", {
  transactionId: text("transaction_id").primaryKey().notNull(),
  model: text("model").notNull().default("gemini-embedding-001"),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  // NOTE: Vector embeddings moved to external vector database
}, (table) => ({
}));

// Inbox Embeddings (vector removed)
export const inboxEmbeddings = sqliteTable("inbox_embeddings", {
  inboxId: text("inbox_id").primaryKey().notNull(),
  model: text("model").notNull().default("gemini-embedding-001"),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  // NOTE: Vector embeddings moved to external vector database
}, (table) => ({
}));

// Tags
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  name: text("name").notNull(),
  color: text("color"),
  teamId: text("team_id").notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  description: text("description"),
}, (table) => ({
  teamIdIdx: index("tags_team_id_idx").on(table.teamId),
  nameTeamIdx: uniqueIndex("tags_name_team_id_key").on(table.name, table.teamId),
}));

// Tracker Projects
export const trackerProjects = sqliteTable("tracker_projects", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  teamId: text("team_id"),
  rate: real("rate"),
  currency: text("currency"),
  status: text("status").default("in_progress").notNull(),
  description: text("description"),
  name: text("name").notNull(),
  billable: booleanColumn("billable").default(false),
  estimate: integer("estimate"),
  customerId: text("customer_id"),
  // NOTE: FTS vector removed - implement with FTS5 or external search
}, (table) => ({
  teamIdIdx: index("tracker_projects_team_id_idx").on(table.teamId),
  customerIdIdx: index("tracker_projects_customer_id_idx").on(table.customerId),
}));

// Tracker Project Tags
export const trackerProjectTags = sqliteTable("tracker_project_tags", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  projectId: text("project_id").notNull(),
  tagId: text("tag_id").notNull(),
}, (table) => ({
  projectIdIdx: index("tracker_project_tags_project_id_idx").on(table.projectId),
  tagIdIdx: index("tracker_project_tags_tag_id_idx").on(table.tagId),
}));

// Tracker Entries
export const trackerEntries = sqliteTable("tracker_entries", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  duration: integer("duration"),
  projectId: text("project_id"),
  start: timestampColumn("start"),
  stop: timestampColumn("stop"),
  assignedId: text("assigned_id"),
  teamId: text("team_id"),
  description: text("description"),
  rate: real("rate"),
  currency: text("currency"),
  billed: booleanColumn("billed").default(false),
  date: text("date").$defaultFn(() => new Date().toISOString().split('T')[0]),
}, (table) => ({
  teamIdIdx: index("tracker_entries_team_id_idx").on(table.teamId),
  projectIdIdx: index("tracker_entries_project_id_idx").on(table.projectId),
  assignedIdIdx: index("tracker_entries_assigned_id_idx").on(table.assignedId),
}));

// Reports
export const reports = sqliteTable("reports", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  teamId: text("team_id").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  type: text("type").notNull(),
  expiresAt: timestampColumn("expires_at"),
  shortLinkId: text("short_link_id"),
}, (table) => ({
  teamIdIdx: index("reports_team_id_idx").on(table.teamId),
  shortLinkIdIdx: index("reports_short_link_id_idx").on(table.shortLinkId),
}));

// Tracker Reports
export const trackerReports = sqliteTable("tracker_reports", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  teamId: text("team_id").notNull(),
  projectId: text("project_id"),
  from: text("from").notNull(),
  to: text("to").notNull(),
  expiresAt: timestampColumn("expires_at"),
  shortLinkId: text("short_link_id"),
}, (table) => ({
  teamIdIdx: index("tracker_reports_team_id_idx").on(table.teamId),
  projectIdIdx: index("tracker_reports_project_id_idx").on(table.projectId),
}));

// Invoices
export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestampColumn("updated_at"),
  teamId: text("team_id").notNull(),
  customerId: text("customer_id"),
  invoiceNumber: text("invoice_number").notNull(),
  status: text("status").default("draft"),
  template: text("template").default("a4"),
  currency: text("currency"),
  amount: real("amount"),
  vat: real("vat"),
  tax: real("tax"),
  dueDate: text("due_date"),
  issueDate: text("issue_date").notNull(),
  paid: booleanColumn("paid").default(false),
  paidAt: timestampColumn("paid_at"),
  noteDetails: text("note_details"),
  fromDetails: text("from_details", { mode: "json" }),
  customerDetails: text("customer_details", { mode: "json" }),
  paymentDetails: text("payment_details", { mode: "json" }),
  token: text("token").$defaultFn(() => generateUUID()),
  deliveryType: text("delivery_type").default("create"),
  scheduleDate: timestampColumn("schedule_date"),
  reminderSent: booleanColumn("reminder_sent").default(false),
  viewedAt: timestampColumn("viewed_at"),
  internalNote: text("internal_note"),
  lineItems: text("line_items", { mode: "json" }),
  discountAmount: real("discount_amount"),
  taxAmount: real("tax_amount"),
  topAmount: real("top_amount"),
  bottomAmount: real("bottom_amount"),
  subtotal: real("subtotal"),
  invoiceUrl: text("invoice_url"),
  // NOTE: FTS vector removed
}, (table) => ({
  teamIdIdx: index("invoices_team_id_idx").on(table.teamId),
  customerIdIdx: index("invoices_customer_id_idx").on(table.customerId),
  invoiceNumberIdx: uniqueIndex("invoices_invoice_number_key").on(table.invoiceNumber),
  tokenIdx: uniqueIndex("invoices_token_key").on(table.token),
}));

// Invoice Comments
export const invoiceComments = sqliteTable("invoice_comments", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  invoiceId: text("invoice_id").notNull(),
  userId: text("user_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  invoiceIdIdx: index("invoice_comments_invoice_id_idx").on(table.invoiceId),
}));

// Invoice Products
export const invoiceProducts = sqliteTable("invoice_products", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  teamId: text("team_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  currency: text("currency").notNull(),
  unit: text("unit"),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  teamIdIdx: index("invoice_products_team_id_idx").on(table.teamId),
}));

// Invoice Templates
export const invoiceTemplates = sqliteTable("invoice_templates", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  teamId: text("team_id").notNull(),
  name: text("name").notNull(),
  fromDetails: text("from_details", { mode: "json" }),
  paymentDetails: text("payment_details", { mode: "json" }),
  size: text("size").default("a4"),
  currency: text("currency"),
  vatTax: real("vat_tax"),
  deliveryType: text("delivery_type").default("create"),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  logoUrl: text("logo_url"),
}, (table) => ({
  teamIdIdx: index("invoice_templates_team_id_idx").on(table.teamId),
}));

// Customers
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  addressLine2: text("address_line_2"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  note: text("note"),
  teamId: text("team_id").notNull(),
  website: text("website"),
  contactName: text("contact_name"),
  vatNumber: text("vat_number"),
  // NOTE: FTS vector removed
}, (table) => ({
  teamIdIdx: index("customers_team_id_idx").on(table.teamId),
}));

// Customer Tags
export const customerTags = sqliteTable("customer_tags", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  customerId: text("customer_id").notNull(),
  tagId: text("tag_id").notNull(),
}, (table) => ({
  customerIdIdx: index("customer_tags_customer_id_idx").on(table.customerId),
  tagIdIdx: index("customer_tags_tag_id_idx").on(table.tagId),
}));

// Documents
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  teamId: text("team_id").notNull(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  size: integer("size"),
  type: text("type"),
  metadata: text("metadata", { mode: "json" }),
  ownerId: text("owner_id"),
  description: text("description"),
  processingStatus: text("processing_status").default("pending"),
  // NOTE: FTS vector removed
}, (table) => ({
  teamIdIdx: index("documents_team_id_idx").on(table.teamId),
  ownerIdIdx: index("documents_owner_id_idx").on(table.ownerId),
  pathIdx: uniqueIndex("documents_path_key").on(table.path),
}));

// Document Tags
export const documentTags = sqliteTable("document_tags", {
  slug: text("slug").primaryKey().notNull(),
  name: text("name").notNull(),
}, (table) => ({
}));

// Document Tag Assignments
export const documentTagAssignments = sqliteTable("document_tag_assignments", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  documentId: text("document_id").notNull(),
  tagSlug: text("tag_slug").notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  documentIdIdx: index("document_tag_assignments_document_id_idx").on(table.documentId),
  tagSlugIdx: index("document_tag_assignments_tag_slug_idx").on(table.tagSlug),
}));

// Inbox
export const inbox = sqliteTable("inbox", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  teamId: text("team_id").notNull(),
  status: text("status").default("pending"),
  type: text("type"),
  amount: real("amount"),
  currency: text("currency"),
  date: text("date"),
  name: text("name"),
  website: text("website"),
  description: text("description"),
  attachments: text("attachments", { mode: "json" }),
  metadata: text("metadata", { mode: "json" }),
  inboxAccountId: text("inbox_account_id"),
  referenceId: text("reference_id"),
  forwardedTo: text("forwarded_to"),
  transactionId: text("transaction_id"),
  readAt: timestampColumn("read_at"),
  displayName: text("display_name"),
  contentType: text("content_type"),
  size: integer("size"),
  // NOTE: FTS vector removed
}, (table) => ({
  teamIdIdx: index("inbox_team_id_idx").on(table.teamId),
  statusIdx: index("inbox_status_idx").on(table.status),
  transactionIdIdx: index("inbox_transaction_id_idx").on(table.transactionId),
  referenceIdIdx: uniqueIndex("inbox_reference_id_key").on(table.referenceId),
}));

// Inbox Accounts
export const inboxAccounts = sqliteTable("inbox_accounts", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  teamId: text("team_id").notNull(),
  provider: text("provider").notNull(),
  email: text("email").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestampColumn("expires_at"),
  status: text("status").default("connected"),
}, (table) => ({
  teamIdIdx: index("inbox_accounts_team_id_idx").on(table.teamId),
  emailIdx: uniqueIndex("inbox_accounts_email_key").on(table.email),
}));

// Exchange Rates
export const exchangeRates = sqliteTable("exchange_rates", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  base: text("base"),
  rate: real("rate"),
  target: text("target"),
  updatedAt: timestampColumn("updated_at"),
}, (table) => ({
  baseTargetIdx: index("exchange_rates_base_target_idx").on(table.base, table.target),
  uniqueRate: uniqueIndex("unique_rate").on(table.base, table.target),
}));

// Short Links
export const shortLinks = sqliteTable("short_links", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  token: text("token").notNull().$defaultFn(() => generateUUID()),
  url: text("url").notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  expiresAt: timestampColumn("expires_at"),
}, (table) => ({
  tokenIdx: uniqueIndex("short_links_token_key").on(table.token),
}));

// User Invites
export const userInvites = sqliteTable("user_invites", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  email: text("email").notNull(),
  teamId: text("team_id").notNull(),
  invitedBy: text("invited_by").notNull(),
  role: text("role").notNull(),
  code: text("code").notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  expiresAt: timestampColumn("expires_at").notNull(),
}, (table) => ({
  teamIdIdx: index("user_invites_team_id_idx").on(table.teamId),
  codeIdx: uniqueIndex("user_invites_code_key").on(table.code),
}));

// API Keys
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  teamId: text("team_id").notNull(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  lastUsedAt: timestampColumn("last_used_at"),
  expiresAt: timestampColumn("expires_at"),
}, (table) => ({
  teamIdIdx: index("api_keys_team_id_idx").on(table.teamId),
}));

// Apps
export const apps = sqliteTable("apps", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  teamId: text("team_id").notNull(),
  appId: text("app_id").notNull(),
  settings: text("settings", { mode: "json" }),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  teamIdIdx: index("apps_team_id_idx").on(table.teamId),
  teamAppIdx: uniqueIndex("apps_team_id_app_id_key").on(table.teamId, table.appId),
}));

// OAuth Applications
export const oauthApplications = sqliteTable("oauth_applications", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  teamId: text("team_id").notNull(),
  name: text("name").notNull(),
  clientId: text("client_id").notNull().$defaultFn(() => generateUUID()),
  clientSecret: text("client_secret").notNull().$defaultFn(() => generateUUID()),
  redirectUris: text("redirect_uris", { mode: "json" }).notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  teamIdIdx: index("oauth_applications_team_id_idx").on(table.teamId),
  clientIdIdx: uniqueIndex("oauth_applications_client_id_key").on(table.clientId),
}));

// OAuth Authorization Codes
export const oauthAuthorizationCodes = sqliteTable("oauth_authorization_codes", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  code: text("code").notNull().$defaultFn(() => generateUUID()),
  applicationId: text("application_id").notNull(),
  userId: text("user_id").notNull(),
  redirectUri: text("redirect_uri").notNull(),
  scopes: text("scopes", { mode: "json" }),
  expiresAt: timestampColumn("expires_at").notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  codeIdx: uniqueIndex("oauth_authorization_codes_code_key").on(table.code),
  applicationIdIdx: index("oauth_authorization_codes_application_id_idx").on(table.applicationId),
}));

// OAuth Access Tokens
export const oauthAccessTokens = sqliteTable("oauth_access_tokens", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  token: text("token").notNull().$defaultFn(() => generateUUID()),
  applicationId: text("application_id").notNull(),
  userId: text("user_id").notNull(),
  scopes: text("scopes", { mode: "json" }),
  expiresAt: timestampColumn("expires_at").notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  tokenIdx: uniqueIndex("oauth_access_tokens_token_key").on(table.token),
  applicationIdIdx: index("oauth_access_tokens_application_id_idx").on(table.applicationId),
  userIdIdx: index("oauth_access_tokens_user_id_idx").on(table.userId),
}));

// Activities
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  type: text("type").notNull(),
  teamId: text("team_id").notNull(),
  userId: text("user_id"),
  source: text("source").notNull(),
  status: text("status").default("unread"),
  metadata: text("metadata", { mode: "json" }),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  teamIdIdx: index("activities_team_id_idx").on(table.teamId),
  userIdIdx: index("activities_user_id_idx").on(table.userId),
  statusIdx: index("activities_status_idx").on(table.status),
}));

// Notification Settings
export const notificationSettings = sqliteTable("notification_settings", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  enabled: booleanColumn("enabled").default(true),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: index("notification_settings_user_id_idx").on(table.userId),
  userTypeIdx: uniqueIndex("notification_settings_user_id_type_key").on(table.userId, table.type),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  usersOnTeam: many(usersOnTeam),
  transactions: many(transactions),
  trackerEntries: many(trackerEntries),
  activities: many(activities),
  notificationSettings: many(notificationSettings),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
  usersOnTeam: many(usersOnTeam),
  bankAccounts: many(bankAccounts),
  bankConnections: many(bankConnections),
  transactions: many(transactions),
  transactionCategories: many(transactionCategories),
  tags: many(tags),
  trackerProjects: many(trackerProjects),
  reports: many(reports),
  invoices: many(invoices),
  customers: many(customers),
  documents: many(documents),
  inbox: many(inbox),
  inboxAccounts: many(inboxAccounts),
  apps: many(apps),
  apiKeys: many(apiKeys),
  oauthApplications: many(oauthApplications),
  activities: many(activities),
}));

export const usersOnTeamRelations = relations(usersOnTeam, ({ one }) => ({
  user: one(users, {
    fields: [usersOnTeam.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [usersOnTeam.teamId],
    references: [teams.id],
  }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  team: one(teams, {
    fields: [bankAccounts.teamId],
    references: [teams.id],
  }),
  bankConnection: one(bankConnections, {
    fields: [bankAccounts.bankConnectionId],
    references: [bankConnections.id],
  }),
  transactions: many(transactions),
}));

export const bankConnectionsRelations = relations(bankConnections, ({ one, many }) => ({
  team: one(teams, {
    fields: [bankConnections.teamId],
    references: [teams.id],
  }),
  bankAccounts: many(bankAccounts),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  team: one(teams, {
    fields: [transactions.teamId],
    references: [teams.id],
  }),
  assignedUser: one(users, {
    fields: [transactions.assignedId],
    references: [users.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [transactions.bankAccountId],
    references: [bankAccounts.id],
  }),
  category: one(transactionCategories, {
    fields: [transactions.categorySlug, transactions.teamId],
    references: [transactionCategories.slug, transactionCategories.teamId],
  }),
  tags: many(transactionTags),
  attachments: many(transactionAttachments),
  enrichments: many(transactionEnrichments),
  matchSuggestions: many(transactionMatchSuggestions),
}));

export const transactionCategoriesRelations = relations(transactionCategories, ({ one, many }) => ({
  team: one(teams, {
    fields: [transactionCategories.teamId],
    references: [teams.id],
  }),
  transactions: many(transactions),
}));

export const transactionTagsRelations = relations(transactionTags, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionTags.transactionId],
    references: [transactions.id],
  }),
  tag: one(tags, {
    fields: [transactionTags.tagId],
    references: [tags.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  team: one(teams, {
    fields: [tags.teamId],
    references: [teams.id],
  }),
  transactionTags: many(transactionTags),
  customerTags: many(customerTags),
  trackerProjectTags: many(trackerProjectTags),
}));

export const trackerProjectsRelations = relations(trackerProjects, ({ one, many }) => ({
  team: one(teams, {
    fields: [trackerProjects.teamId],
    references: [teams.id],
  }),
  customer: one(customers, {
    fields: [trackerProjects.customerId],
    references: [customers.id],
  }),
  entries: many(trackerEntries),
  tags: many(trackerProjectTags),
}));

export const trackerEntriesRelations = relations(trackerEntries, ({ one }) => ({
  team: one(teams, {
    fields: [trackerEntries.teamId],
    references: [teams.id],
  }),
  project: one(trackerProjects, {
    fields: [trackerEntries.projectId],
    references: [trackerProjects.id],
  }),
  assignedUser: one(users, {
    fields: [trackerEntries.assignedId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  team: one(teams, {
    fields: [reports.teamId],
    references: [teams.id],
  }),
  shortLink: one(shortLinks, {
    fields: [reports.shortLinkId],
    references: [shortLinks.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  team: one(teams, {
    fields: [invoices.teamId],
    references: [teams.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  comments: many(invoiceComments),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  team: one(teams, {
    fields: [customers.teamId],
    references: [teams.id],
  }),
  invoices: many(invoices),
  trackerProjects: many(trackerProjects),
  tags: many(customerTags),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  team: one(teams, {
    fields: [documents.teamId],
    references: [teams.id],
  }),
  owner: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
  }),
  tagAssignments: many(documentTagAssignments),
}));

export const inboxRelations = relations(inbox, ({ one }) => ({
  team: one(teams, {
    fields: [inbox.teamId],
    references: [teams.id],
  }),
  transaction: one(transactions, {
    fields: [inbox.transactionId],
    references: [transactions.id],
  }),
  inboxAccount: one(inboxAccounts, {
    fields: [inbox.inboxAccountId],
    references: [inboxAccounts.id],
  }),
}));

export const inboxAccountsRelations = relations(inboxAccounts, ({ one, many }) => ({
  team: one(teams, {
    fields: [inboxAccounts.teamId],
    references: [teams.id],
  }),
  inboxItems: many(inbox),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  team: one(teams, {
    fields: [activities.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));

export const oauthApplicationsRelations = relations(oauthApplications, ({ one, many }) => ({
  team: one(teams, {
    fields: [oauthApplications.teamId],
    references: [teams.id],
  }),
  authorizationCodes: many(oauthAuthorizationCodes),
  accessTokens: many(oauthAccessTokens),
}));

export const oauthAuthorizationCodesRelations = relations(oauthAuthorizationCodes, ({ one }) => ({
  application: one(oauthApplications, {
    fields: [oauthAuthorizationCodes.applicationId],
    references: [oauthApplications.id],
  }),
  user: one(users, {
    fields: [oauthAuthorizationCodes.userId],
    references: [users.id],
  }),
}));

export const oauthAccessTokensRelations = relations(oauthAccessTokens, ({ one }) => ({
  application: one(oauthApplications, {
    fields: [oauthAccessTokens.applicationId],
    references: [oauthApplications.id],
  }),
  user: one(users, {
    fields: [oauthAccessTokens.userId],
    references: [users.id],
  }),
}));
