# Complete D1 Migration Guide

## Overview
Migrating from PostgreSQL to Cloudflare D1 requires converting 43 tables with 3269 lines of schema code. This is a **major architectural change** that cannot be fully automated.

## What Has Been Done

### ✅ Infrastructure Changes (Complete)
1. **package.json**: Updated dependencies
   - Removed: `pg`, `@types/pg`
   - Added: `@cloudflare/workers-types`
   - Kept: `drizzle-orm` (supports both PostgreSQL and D1)

2. **drizzle.config.ts**: Configured for D1
   - Changed dialect from `postgresql` to `sqlite`
   - Added D1 driver configuration
   - Uses environment variables for Cloudflare credentials

3. **client.ts**: Refactored for D1
   - Changed from `drizzle-orm/node-postgres` to `drizzle-orm/d1`
   - Removed connection pool management (D1 handles this)
   - Removed replica logic (D1 manages replication)
   - **Breaking Change**: `db` now requires D1 binding parameter

4. **job-client.ts**: Simplified for D1
   - Removed PostgreSQL pool management
   - **Breaking Change**: `createJobDb` now requires D1 binding parameter

5. **health.ts**: Updated for D1
   - **Breaking Change**: `checkHealth` now requires database parameter
   - Changed from `executeOnReplica` to standard `run` method

### ⚠️ Schema Migration (Needs Completion)

The schema migration is **partially complete**. We've created:
- `schema-d1.ts`: A template showing conversion patterns
- `MIGRATION_NOTES.md`: Comprehensive migration documentation
- `convert-schema.js`: Helper script (requires manual fixes)

## What You Need To Do

### Option 1: Complete Manual Migration (Recommended)
This is the safest approach for a production system.

1. **Review the template** (`schema-d1.ts`)
   - Study the conversion patterns for enums, types, and tables
   - Understand how PostgreSQL types map to SQLite

2. **Convert each table systematically**
   - Start with core tables (users, teams, etc.)
   - Test each table conversion
   - Update one table at a time

3. **Handle special cases**:
   - **Vector embeddings**: Move to external service (Pinecone, Weaviate, or Cloudflare Vectorize)
   - **Full-text search**: Use D1 FTS5 or external search (Typesense, Algolia)
   - **Row-level security**: Implement in application layer
   - **Materialized views**: Convert to regular tables or remove

4. **Update all queries**
   - Check `packages/db/src/queries/*.ts` files
   - Update any PostgreSQL-specific query syntax
   - Test each query with new schema

### Option 2: Hybrid Approach
Keep PostgreSQL for main application, use D1 for specific services.

- Use D1 in Cloudflare Workers (e.g., engine service)
- Keep PostgreSQL for main dashboard/API
- Gradually migrate services one by one

### Option 3: Use Automated Tool (Risky)
Use the conversion script and fix errors:

\`\`\`bash
cd /home/runner/work/midday/midday/packages/db
node /tmp/convert-schema.js > src/schema-new.ts
# Then manually fix all errors
\`\`\`

## Critical Decisions Needed

### 1. Vector Embeddings (3 tables affected)
Tables with embeddings:
- `documentTagEmbeddings`
- `transactionCategoryEmbeddings`  
- `transactionEmbeddings`
- `inboxEmbeddings`

**Options**:
- A) Use Cloudflare Vectorize (recommended for D1)
- B) Use external vector DB (Pinecone, Weaviate)
- C) Remove vector search features temporarily

### 2. Full-Text Search (1 table affected)
`transactions` table has `fts_vector` column.

**Options**:
- A) Use SQLite FTS5 virtual tables
- B) Use external search (Typesense, Algolia)
- C) Remove FTS, use simple LIKE queries

### 3. Security Model
PostgreSQL RLS policies need replacement.

**Options**:
- A) Implement all checks in application layer
- B) Use Cloudflare Workers middleware
- C) Redesign security architecture

## Step-by-Step Migration Process

### Phase 1: Preparation
1. ✅ Update infrastructure files (DONE)
2. ✅ Create migration documentation (DONE)
3. ✅ Create schema template (DONE)
4. 🔄 Make architectural decisions (IN PROGRESS - needs your input)
5. ⏳ Plan data migration strategy

### Phase 2: Schema Migration
1. ⏳ Convert core tables (users, teams, etc.)
2. ⏳ Convert transaction tables
3. ⏳ Convert invoice tables
4. ⏳ Convert remaining tables
5. ⏳ Handle special features (vectors, FTS, etc.)
6. ⏳ Update all relations

### Phase 3: Application Updates
1. ⏳ Update all database imports to pass D1 binding
2. ⏳ Update query files for type changes
3. ⏳ Implement security checks in code
4. ⏳ Test all database operations

### Phase 4: Data Migration
1. ⏳ Export data from PostgreSQL
2. ⏳ Transform data for SQLite
3. ⏳ Import into D1
4. ⏳ Verify data integrity

### Phase 5: Testing & Deployment
1. ⏳ Unit tests for all queries
2. ⏳ Integration tests
3. ⏳ Performance testing
4. ⏳ Gradual rollout

## Estimated Effort

- **Phase 1 (Preparation)**: 4-8 hours ✅ DONE (except decisions)
- **Phase 2 (Schema)**: 20-40 hours ⚠️ PARTIAL (template created)
- **Phase 3 (Application)**: 15-30 hours
- **Phase 4 (Data)**: 10-20 hours
- **Phase 5 (Testing)**: 15-25 hours

**Total**: 64-123 hours of development work

## Quick Start Commands

### Using the Template (Recommended for Learning)
\`\`\`bash
# Review the template
cat packages/db/src/schema-d1.ts

# Study conversion patterns
cat packages/db/MIGRATION_NOTES.md
\`\`\`

### Testing Infrastructure Changes
\`\`\`typescript
// In a Cloudflare Worker
import { db } from '@midday/db/client';

export default {
  async fetch(request, env) {
    const database = db(env.DB);
    // Use database...
  }
}
\`\`\`

## Getting Help

The framework is in place, but completing this migration requires:
1. **Architectural decisions** (embeddings, FTS, security)
2. **Time investment** (64-123 hours)
3. **Testing resources**
4. **Data migration planning**

This is a **complex, multi-week project**. Consider:
- Breaking it into smaller phases
- Testing extensively in staging
- Having rollback plans ready
- Consulting with Cloudflare D1 experts if needed

## Next Steps

To continue, please decide:
1. Do you want to complete the full migration now?
2. Should we do a hybrid approach?
3. Which tables are most critical to migrate first?
4. How will you handle embeddings and FTS?

Once you've made these decisions, I can help complete the specific parts you need.
