/**
 * Cloudflare D1 (SQLite) Schema
 * 
 * This is a migrated version of the PostgreSQL schema for use with Cloudflare D1.
 * Key changes:
 * - pgTable -> sqliteTable
 * - pgEnum -> removed (using text columns instead)
 * - jsonb -> text (store as JSON string)
 * - uuid -> text (with custom ID generation)
 * - numeric -> real (for decimal values)
 * - vector -> text (store as JSON array, requires external vector search)
 * - tsvector -> removed (use D1 FTS or external search)
 * - pgPolicy -> removed (implement security in application layer)
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

// Helper for numeric values stored as REAL
// In production, consider storing monetary values as INTEGER (cents)
export const numericAsReal = (name: string) => real(name);

// Helper for UUID columns (stored as TEXT in SQLite)
export const uuidColumn = (name?: string) => text(name);

// Helper for timestamp columns
export const timestampColumn = (name: string) => 
  integer(name, { mode: "timestamp" });

// Helper for date columns  
export const dateColumn = (name?: string) => text(name);

// Helper for boolean columns (SQLite uses INTEGER 0/1)
export const booleanColumn = (name?: string) => integer(name, { mode: "boolean" });

// Helper for JSON columns (stored as TEXT)
export const jsonColumn = (name: string) => text(name, { mode: "json" });

/**
 * ENUM REPLACEMENTS
 * SQLite doesn't have native enums, so we use text columns.
 * Validation should be done in the application layer.
 */

// Type definitions for enums (for TypeScript type checking)
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

/**
 * IMPORTANT: This is a PARTIAL migration template.
 * You need to convert all 43 tables from the original schema.ts file.
 * 
 * Below is an example of how to convert a table from PostgreSQL to SQLite:
 */

// Example table migration (you need to convert all 43 tables following this pattern)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  fullName: text("full_name"),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  locale: text("locale"),
  timeFormat: integer("time_format"),
  dateFormat: text("date_format"),
  weekStartsOnMonday: integer("week_starts_on_monday", { mode: "boolean" }),
  timezone: text("timezone"),
  timezoneAutoSync: integer("timezone_auto_sync", { mode: "boolean" }),
  teamId: text("team_id"),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  teamIdIdx: index("users_team_id_idx").on(table.teamId),
}));

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  plan: text("plan").notNull(), // Was pgEnum, now text
  countryCode: text("country_code"),
  canceledAt: integer("canceled_at", { mode: "timestamp" }),
  inboxId: text("inbox_id"),
}, (table) => ({
  nameIdx: index("teams_name_idx").on(table.name),
}));

/**
 * TODO: Convert remaining tables:
 * 
 * From the original schema.ts, you need to convert these tables:
 * 1. documentTagEmbeddings (remove vector column or store as text JSON array)
 * 2. transactionCategoryEmbeddings (remove vector column)
 * 3. transactions (large table with many indexes)
 * 4. trackerEntries
 * 5. trackerProjects
 * 6. reports
 * 7. transactionAttachments
 * 8. transactionCategories
 * 9. transactionTags
 * 10. transactionEmbeddings (remove vector)
 * 11. inboxEmbeddings (remove vector)
 * 12. inbox
 * 13. transactionEnrichments
 * 14. bankAccounts
 * 15. usersOnTeam
 * 16. bankConnections
 * 17. tags
 * 18. invoices
 * 19. invoiceProducts
 * 20. customers
 * 21. customerAnalytics
 * 22. documentTags
 * 23. documentTagAssignments
 * 24. documents
 * 25. inboxAccounts
 * 26. activities
 * 27. webhookEvents
 * 28. apiKeys
 * 29. apps
 * 30. exchangeRates
 * 31. shortLinks
 * 32. userInvites
 * 33. invoiceTemplates
 * 34. oauthApplications
 * 35. oauthScopes
 * 36. oauthTokens
 * 37. oauthAuthorizationCodes
 * 38. oauthRefreshTokens
 * 39. notificationSettings
 * 40. subscriptions
 * 41. Any materialized views
 * 42-43. Any other tables
 * 
 * For each table:
 * - Change pgTable to sqliteTable
 * - Change uuid() to text()
 * - Change timestamp() to integer({ mode: "timestamp" })
 * - Change date() to text() or integer()
 * - Change numeric/bigint to real() or integer()
 * - Change jsonb() to text({ mode: "json" })
 * - Change vector() to text() (and handle embeddings externally)
 * - Remove tsvector columns (implement FTS differently)
 * - Remove pgPolicy entries
 * - Simplify indexes (remove .using(), .op(), etc.)
 * - Keep foreign keys but simplify syntax
 */

/**
 * RELATIONS
 * After migrating all tables, copy and adapt the relations from the original schema.ts
 */

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  // Add other relations here
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
  // Add other relations here
}));

/**
 * EXPORT NOTE:
 * After completing the migration, you'll need to:
 * 1. Replace the original schema.ts with this file
 * 2. Or rename this to schema.ts and backup the old one
 * 3. Update all imports across the codebase
 * 4. Generate new migrations for D1
 * 5. Test all database operations thoroughly
 */
