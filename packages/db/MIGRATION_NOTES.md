# PostgreSQL to Cloudflare D1 (SQLite) Migration Notes

## Overview
This migration converts the `@midday/db` package from PostgreSQL (using node-postgres) to Cloudflare D1 (SQLite-based).

## Key Differences Between PostgreSQL and SQLite/D1

### 1. Enums
- **PostgreSQL**: Native ENUM types (`pgEnum`)
- **SQLite/D1**: No native ENUM support
- **Solution**: Use TEXT columns with CHECK constraints or just TEXT (validated in application layer)

### 2. JSON Types
- **PostgreSQL**: `json` and `jsonb` (binary JSON)
- **SQLite/D1**: TEXT only (store JSON as string)
- **Solution**: Use `text()` column with JSON.stringify/parse in application

### 3. UUID
- **PostgreSQL**: Native UUID type with generation functions
- **SQLite/D1**: TEXT only
- **Solution**: Use `text()` column, generate UUIDs in application layer

### 4. BIGINT
- **PostgreSQL**: Native 64-bit integer
- **SQLite/D1**: INTEGER (stores up to 64-bit)
- **Solution**: Use `integer()` in SQLite

### 5. Numeric/Decimal
- **PostgreSQL**: `NUMERIC(precision, scale)` for exact decimal values
- **SQLite/D1**: REAL (floating point) or TEXT
- **Solution**: Use `real()` or store as INTEGER (cents) for exact values

### 6. Vector Types
- **PostgreSQL**: pgvector extension for embeddings
- **SQLite/D1**: No native vector support
- **Solution**: Store as TEXT (JSON array) or BLOB, implement similarity search differently

### 7. Full-Text Search
- **PostgreSQL**: `tsvector` type with GIN indexes
- **SQLite/D1**: FTS5 virtual tables
- **Solution**: Requires significant restructuring, or use external search (e.g., Typesense)

### 8. Materialized Views
- **PostgreSQL**: Native materialized views
- **SQLite/D1**: No materialized views
- **Solution**: Use regular tables with manual refresh logic

### 9. Row Level Security (RLS) Policies
- **PostgreSQL**: `pgPolicy()` for row-level security
- **SQLite/D1**: No RLS support
- **Solution**: Implement security checks in application layer

### 10. Indexes
- **PostgreSQL**: Multiple index types (BTREE, GIN, GIST, HNSW)
- **SQLite/D1**: Only BTREE indexes
- **Solution**: Use standard indexes, may lose some performance optimizations

## Migration Checklist

- [x] Update package.json (remove pg, add @cloudflare/workers-types)
- [x] Update drizzle.config.ts (sqlite dialect)
- [x] Update client.ts (use drizzle-orm/d1)
- [x] Update job-client.ts (remove pool management)
- [x] Update health.ts utility
- [ ] Migrate schema.ts (43 tables, 3269 lines)
  - [ ] Convert imports from pg-core to sqlite-core
  - [ ] Convert enums to text columns
  - [ ] Convert jsonb to text
  - [ ] Convert uuid to text with generation in app
  - [ ] Convert numeric to real or integer
  - [ ] Handle vector columns (remove or store as text)
  - [ ] Remove tsvector columns
  - [ ] Remove materialized views
  - [ ] Remove pgPolicy statements
  - [ ] Simplify indexes
- [ ] Update all queries to handle type changes
- [ ] Create new migrations for D1
- [ ] Test thoroughly

## Breaking Changes

1. **Connection API**: Database instances now require D1 binding as parameter
   ```typescript
   // Old:
   import { db } from "@midday/db/client";
   
   // New:
   import { db } from "@midday/db/client";
   const database = db(env.DB); // Pass D1 binding
   ```

2. **Health Check**: Now requires database parameter
   ```typescript
   // Old:
   await checkHealth();
   
   // New:
   await checkHealth(db);
   ```

3. **Job Client**: Now requires D1 binding parameter
   ```typescript
   // Old:
   const { db, disconnect } = createJobDb();
   
   // New:
   const { db, disconnect } = createJobDb(env.DB);
   ```

4. **No Read Replicas**: D1 doesn't support manual read replica routing
   - Removed `executeOnReplica()` method
   - Removed `usePrimaryOnly()` method
   - Removed replica configuration

## Performance Considerations

1. **Vector Search**: If using pgvector for embeddings, you'll need an alternative solution (e.g., Pinecone, Weaviate, or Typesense)
2. **Full-Text Search**: Consider using Cloudflare's Vectorize or external search service
3. **Connection Pooling**: D1 connection management is handled by Cloudflare Workers runtime
4. **Geographic Distribution**: D1 automatically replicates data globally

## Next Steps

1. Complete schema migration (large task - 43 tables)
2. Generate new migrations for D1
3. Update all application code that uses the database
4. Thoroughly test all database operations
5. Plan data migration from PostgreSQL to D1
