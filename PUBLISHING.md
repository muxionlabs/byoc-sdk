# Publishing Guide

## Package Information

- **Name:** `@eliteencoder/byoc-sdk`
- **Version:** 1.0.0
- **Scope:** `@eliteencoder`
- **Registry:** npm (https://registry.npmjs.org)

## Prerequisites

1. **npm Account:** You need an npm account with username `eliteencoder`
2. **Authentication:** You must be logged in to npm
3. **Scope Access:** You must own or have access to the `@eliteencoder` scope

## Step-by-Step Publishing

### 1. Verify Build

```bash
cd /home/elite/repos/byoc-sdk
npm run build
```

Expected output:
```
✅ ESM build success
✅ CJS build success  
✅ DTS build success
```

### 2. Run Tests

```bash
npm test -- --run
```

Expected output:
```
✅ All tests passing (22/22)
```

### 3. Login to npm

```bash
npm login
```

You'll be prompted to:
- Enter your username: `eliteencoder`
- Enter your password
- Enter your email
- Optionally complete 2FA

### 4. Verify Login

```bash
npm whoami
```

Should output: `eliteencoder`

### 5. Publish

```bash
npm publish --access public
```

Notes:
- The `--access public` flag is required for scoped packages
- This will automatically run `prepublishOnly` script (builds the package)
- Package will be published to: https://www.npmjs.com/package/@eliteencoder/byoc-sdk

### 6. Verify Publication

Visit: https://www.npmjs.com/package/@eliteencoder/byoc-sdk

Or test installation:
```bash
npm info @eliteencoder/byoc-sdk
```

## Updating the Package

### For Bug Fixes (Patch)

```bash
npm version patch  # 1.0.0 -> 1.0.1
npm publish
```

### For New Features (Minor)

```bash
npm version minor  # 1.0.0 -> 1.1.0
npm publish
```

### For Breaking Changes (Major)

```bash
npm version major  # 1.0.0 -> 2.0.0
npm publish
```

## Using the Published Package

Once published, anyone can install it:

```bash
npm install @eliteencoder/byoc-sdk
```

```typescript
import { useStreamPublisher } from '@eliteencoder/byoc-sdk'
```

## Troubleshooting

### Error: 403 Forbidden

**Problem:** You don't have permission to publish to `@eliteencoder`

**Solution:** 
- Make sure you're logged in as `eliteencoder`
- If the scope doesn't exist, npm will create it for you on first publish

### Error: 404 Not Found

**Problem:** Scope doesn't exist or you don't have access

**Solution:**
- First publish to the scope will create it
- Make sure you're using `--access public` flag

### Error: Package name already exists

**Problem:** Someone else owns this package name

**Solution:**
- Choose a different name
- Or request ownership if it's abandoned

### Error: Version already published

**Problem:** You're trying to publish the same version twice

**Solution:**
```bash
npm version patch  # Increment version
npm publish
```

## Unpublishing (Emergency Only)

⚠️ **Warning:** Unpublishing is not recommended and has restrictions

```bash
# Unpublish a specific version (within 72 hours)
npm unpublish @eliteencoder/byoc-sdk@1.0.0

# Unpublish entire package (within 72 hours)
npm unpublish @eliteencoder/byoc-sdk --force
```

**Note:** After 72 hours, packages cannot be unpublished. Use deprecation instead:

```bash
npm deprecate @eliteencoder/byoc-sdk@1.0.0 "This version has issues, please use 1.0.1+"
```

## CI/CD Publishing

For automated publishing (GitHub Actions, etc.):

### 1. Create npm Token

```bash
npm token create --read-only
```

### 2. Add to CI Secrets

Add the token as `NPM_TOKEN` in your CI environment

### 3. GitHub Actions Example

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## Current Status

✅ Package renamed to `@eliteencoder/byoc-sdk`  
✅ Build successful  
✅ All tests passing  
✅ Documentation updated  
🚀 Ready to publish!

## Quick Commands

```bash
# Build and test
npm run build && npm test -- --run

# Publish
npm publish --access public

# Update and publish
npm version patch && npm publish
```

