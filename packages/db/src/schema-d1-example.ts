/**
 * Cloudflare D1 Schema - Working Example
 * 
 * This file demonstrates the complete conversion of key tables from PostgreSQL to D1/SQLite.
 * Use these as patterns to convert the remaining tables.
 */

import { type SQL, relations, sql } from "drizzle-orm";
import {
  integer,
  real,
  text,
  sqliteTable,
  index,
  uniqueIndex,
  foreignKey,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// ============================================================================
// ENUMS AS TypeScript Types (SQLite doesn't have native enums)
// ============================================================================

export const accountTypeValues = ["depository", "credit", "other_asset", "loan", "other_liability"] as const;
export type AccountType = typeof accountTypeValues[number];

export const plansValues = ["trial", "starter", "pro"] as const;
export type Plan = typeof plansValues[number];

export const teamRolesValues = ["owner", "member"] as const;
export type TeamRole = typeof teamRolesValues[number];

export const transactionMethodsValues = [
  "payment", "card_purchase", "card_atm", "transfer", "other", 
  "unknown", "ach", "interest", "deposit", "wire", "fee"
] as const;
export type TransactionMethod = typeof transactionMethodsValues[number];

export const transactionStatusValues = ["posted", "pending", "excluded", "completed", "archived"] as const;
export type TransactionStatus = typeof transactionStatusValues[number];

export const trackerStatusValues = ["in_progress", "completed"] as const;
export type TrackerStatus = typeof trackerStatusValues[number];

export const connectionStatusValues = ["disconnected", "connected", "unknown"] as const;
export type ConnectionStatus = typeof connectionStatusValues[number];

export const bankProvidersValues = ["gocardless", "plaid", "teller", "enablebanking"] as const;
export type BankProvider = typeof bankProvidersValues[number];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generate UUID in application layer since SQLite doesn't have UUID functions
export function generateUUID(): string {
  return crypto.randomUUID();
}

// Helper to create timestamp columns (stored as milliseconds since epoch)
const timestampColumn = (name: string) => 
  integer(name, { mode: "timestamp" });

// Helper for boolean columns (SQLite uses INTEGER 0/1)
const booleanColumn = (name: string) => 
  integer(name, { mode: "boolean" });

// ============================================================================
// TABLES
// ============================================================================

// -----------------------------------------------------------------------------
// Teams Table
// -----------------------------------------------------------------------------
export const teams = sqliteTable("teams", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  inboxId: text("inbox_id"),
  emailLanguage: text("email_language").default("en"),
  inboxEmail: text("inbox_email"),
  inboxForwarding: booleanColumn("inbox_forwarding").default(false),
  baseUrl: text("base_url"),
  plan: text("plan").notNull(), // Was enum
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

// -----------------------------------------------------------------------------
// Users Table
// -----------------------------------------------------------------------------
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
  // Note: RLS policies removed - implement security checks in application layer
}));

// -----------------------------------------------------------------------------
// Users on Team (Junction Table)
// -----------------------------------------------------------------------------
export const usersOnTeam = sqliteTable("users_on_team", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  userId: text("user_id").notNull(),
  teamId: text("team_id").notNull(),
  role: text("role").notNull(), // Was enum
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userTeamIdx: uniqueIndex("users_on_team_user_id_team_id_key").on(table.userId, table.teamId),
  teamIdIdx: index("users_on_team_team_id_idx").on(table.teamId),
  userIdIdx: index("users_on_team_user_id_idx").on(table.userId),
}));

// -----------------------------------------------------------------------------
// Bank Accounts Table
// -----------------------------------------------------------------------------
export const bankAccounts = sqliteTable("bank_accounts", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  name: text("name").notNull(),
  currency: text("currency"),
  teamId: text("team_id").notNull(),
  bankConnectionId: text("bank_connection_id"),
  accountId: text("account_id"),
  enabled: booleanColumn("enabled").default(true),
  type: text("type"), // Was enum
  balance: real("balance"),
  manual: booleanColumn("manual").default(false),
}, (table) => ({
  teamIdIdx: index("bank_accounts_team_id_idx").on(table.teamId),
  connectionIdIdx: index("bank_accounts_bank_connection_id_idx").on(table.bankConnectionId),
}));

// -----------------------------------------------------------------------------
// Bank Connections Table
// -----------------------------------------------------------------------------
export const bankConnections = sqliteTable("bank_connections", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  institutionId: text("institution_id").notNull(),
  name: text("name"),
  logoUrl: text("logo_url"),
  provider: text("provider"), // Was enum
  teamId: text("team_id").notNull(),
  accessToken: text("access_token"),
  enrollmentId: text("enrollment_id"),
  status: text("status"), // Was enum
  lastAccessed: timestampColumn("last_accessed"),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  expiresAt: timestampColumn("expires_at"),
  errorDetails: text("error_details"),
  referenceId: text("reference_id"),
}, (table) => ({
  teamIdIdx: index("bank_connections_team_id_idx").on(table.teamId),
  institutionIdIdx: index("bank_connections_institution_id_idx").on(table.institutionId),
}));

// -----------------------------------------------------------------------------
// Transactions Table (Simplified - full version has many more fields)
// -----------------------------------------------------------------------------
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey().notNull().$defaultFn(() => generateUUID()),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  date: text("date").notNull(), // Store as ISO date string
  name: text("name").notNull(),
  method: text("method").notNull(), // Was enum
  amount: real("amount").notNull(), // Store as floating point
  currency: text("currency").notNull(),
  teamId: text("team_id").notNull(),
  assignedId: text("assigned_id"),
  note: text("note"),
  bankAccountId: text("bank_account_id"),
  internalId: text("internal_id").notNull(),
  status: text("status").default("posted"), // Was enum
  balance: real("balance"),
  manual: booleanColumn("manual").default(false),
  internal: booleanColumn("internal").default(false),
  description: text("description"),
  categorySlug: text("category_slug"),
  // Note: For exact monetary calculations, consider storing as INTEGER (cents)
  // e.g., amount: integer("amount").notNull(), // Store cents, divide by 100 in app
}, (table) => ({
  teamIdIdx: index("transactions_team_id_idx").on(table.teamId),
  dateIdx: index("transactions_date_idx").on(table.date),
  bankAccountIdIdx: index("transactions_bank_account_id_idx").on(table.bankAccountId),
  categorySlugIdx: index("transactions_category_slug_idx").on(table.categorySlug),
  internalIdIdx: uniqueIndex("transactions_internal_id_key").on(table.internalId),
  // Note: FTS removed - implement using SQLite FTS5 virtual table or external search
}));

// -----------------------------------------------------------------------------
// Transaction Categories Table
// -----------------------------------------------------------------------------
export const transactionCategories = sqliteTable("transaction_categories", {
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  color: text("color"),
  description: text("description"),
  teamId: text("team_id").notNull(),
  system: booleanColumn("system").default(false).notNull(),
  createdAt: timestampColumn("created_at").notNull().$defaultFn(() => new Date()),
  vat: real("vat"), // VAT/tax rate
}, (table) => ({
  pk: primaryKey({ columns: [table.teamId, table.slug] }),
  teamIdIdx: index("transaction_categories_team_id_idx").on(table.teamId),
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
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
  usersOnTeam: many(usersOnTeam),
  bankAccounts: many(bankAccounts),
  bankConnections: many(bankConnections),
  transactions: many(transactions),
  transactionCategories: many(transactionCategories),
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

export const transactionsRelations = relations(transactions, ({ one }) => ({
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
}));

export const transactionCategoriesRelations = relations(transactionCategories, ({ one, many }) => ({
  team: one(teams, {
    fields: [transactionCategories.teamId],
    references: [teams.id],
  }),
  transactions: many(transactions),
}));

/**
 * MIGRATION NOTES FOR REMAINING TABLES:
 * 
 * You still need to convert:
 * - invoices
 * - invoiceProducts
 * - customers
 * - documents
 * - inbox
 * - activities
 * - trackerProjects
 * - trackerEntries
 * - reports
 * - tags
 * - apiKeys
 * - apps
 * - exchangeRates
 * - shortLinks
 * - userInvites
 * - invoiceTemplates
 * - oauth tables (applications, tokens, scopes, etc.)
 * - notification settings
 * - subscriptions
 * - And any embedding tables (handle separately with external vector DB)
 * 
 * Follow the patterns shown above:
 * 1. Use text() for UUID columns with generateUUID()
 * 2. Use integer({ mode: "timestamp" }) for timestamps
 * 3. Use integer({ mode: "boolean" }) for booleans
 * 4. Use text() for enum columns (with TypeScript type validation)
 * 5. Use real() for decimals (or integer for exact cents)
 * 6. Use text({ mode: "json" }) for JSON columns
 * 7. Remove pgPolicy statements
 * 8. Simplify indexes (no .using(), .op(), etc.)
 * 9. Add $defaultFn() for default values that need functions
 */
