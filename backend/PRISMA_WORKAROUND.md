# Prisma Client Generation Workaround

**Issue**: Cannot generate Prisma client due to CDN access restrictions (403 Forbidden)

---

## Quick Fix for Development

If you have access to a machine with unrestricted internet, use this script:

```bash
#!/bin/bash
# Run this on a machine WITH internet access

cd /home/user/NEURM/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create a tarball of generated files
tar -czf prisma-client.tar.gz \
  node_modules/.prisma/client/ \
  node_modules/@prisma/client/

echo "✅ Created prisma-client.tar.gz"
echo "📦 Transfer this file to your deployment server"
```

Then on the deployment server:

```bash
cd /home/user/NEURM/backend

# Extract the generated client
tar -xzf prisma-client.tar.gz

# Verify extraction
ls -la node_modules/.prisma/client/
ls -la node_modules/@prisma/client/

echo "✅ Prisma client ready!"
```

---

## Verify Installation

```bash
# Check TypeScript compilation
npm run type-check

# If still errors, try:
npm install
npm run type-check
```

---

## Alternative: Enable CDN Access (Recommended)

Whitelist this domain in your firewall/proxy:

```
binaries.prisma.sh
```

Then run:

```bash
npx prisma generate
```

---

## For Production Deployments

Add to your deployment pipeline:

```yaml
# .github/workflows/deploy.yml (example)
steps:
  - name: Install dependencies
    run: npm ci

  - name: Generate Prisma Client
    run: npx prisma generate

  - name: Build
    run: npm run build
```

---

## Environment Variables for Prisma

If using Prisma with custom configuration:

```bash
# .env.production
DATABASE_URL="postgresql://user:pass@host:5432/neurmatic"

# Optional: Skip checksum validation (not recommended for production)
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Optional: Use custom engine binary path
PRISMA_QUERY_ENGINE_BINARY="/path/to/query-engine"
PRISMA_MIGRATION_ENGINE_BINARY="/path/to/migration-engine"
```

---

## Troubleshooting

### Issue: "Cannot find module '@prisma/client'"

**Solution**:
```bash
npm install @prisma/client
npx prisma generate
```

### Issue: "PrismaClient is not a constructor"

**Solution**:
```bash
# Clear generated client
rm -rf node_modules/.prisma

# Regenerate
npx prisma generate
```

### Issue: Type errors like "Module '@prisma/client' has no exported member 'UserRole'"

**Solution**:
```bash
# This means Prisma client is not generated
# Follow the "Quick Fix" steps above
```

---

## Manual Engine Download (Advanced)

If automated methods fail, manually download engines:

1. **Find your Prisma version**:
   ```bash
   npm list prisma
   # Example: 6.18.0
   ```

2. **Get commit hash**:
   ```bash
   npx prisma version
   # Look for: "Query Engine: 34b5a692b7bd79939a9a2c3ef97d816e749cda2f"
   ```

3. **Download engines**:
   ```bash
   COMMIT="34b5a692b7bd79939a9a2c3ef97d816e749cda2f"
   PLATFORM="debian-openssl-3.0.x"

   # Query Engine
   wget "https://binaries.prisma.sh/all_commits/${COMMIT}/${PLATFORM}/libquery_engine.so.node"

   # Schema Engine
   wget "https://binaries.prisma.sh/all_commits/${COMMIT}/${PLATFORM}/schema-engine"
   ```

4. **Place engines**:
   ```bash
   mkdir -p node_modules/@prisma/engines
   mv libquery_engine.so.node node_modules/@prisma/engines/
   mv schema-engine node_modules/@prisma/engines/
   chmod +x node_modules/@prisma/engines/schema-engine
   ```

5. **Generate client**:
   ```bash
   PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
   ```

---

**Last Updated**: November 6, 2025
