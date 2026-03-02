# Solana Monorepo Setup Agent

> **Purpose**: Initialize a complete Solana project monorepo from scratch with best practices, proper tooling, and standardized structure.

---

## Overview

This agent guides you through setting up a production-ready Solana monorepo with:

- Anchor framework for Solana programs
- pnpm workspaces for package management
- TypeScript with strict configuration
- Proper git setup and ignore patterns
- Standardized folder structure

---

## Prerequisites

Before starting, ensure you have:

```bash
# Check installed tools
solana --version      # Solana CLI (recommend 1.18.x)
anchor --version      # Anchor CLI (recommend 0.30.x+)
pnpm --version        # pnpm (v9+ recommended)
node --version        # Node.js (v20+ LTS recommended)
rustc --version       # Rust (latest stable)
```

**Install missing tools:**

```bash
# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Anchor CLI (using AVM)
cargo install avm
avm install latest
avm use latest

# pnpm
npm install -g pnpm

# Rust (if not installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## Step 1: Create Project Directory

```bash
# Replace <project-name> with your project name
PROJECT_NAME="<project-name>"
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"
```

---

## Step 2: Create Folder Structure

```bash
# Core directories
mkdir -p programs        # Anchor programs (smart contracts)
mkdir -p packages/sdk    # TypeScript SDK
mkdir -p packages/shared # Shared utilities/types
mkdir -p apps/frontend   # Frontend application
mkdir -p apps/landing    # Landing page / marketing site
mkdir -p tests           # Integration tests
mkdir -p docs            # Documentation

# Hidden directories (gitignored)
mkdir -p .anchor         # Anchor build artifacts
mkdir -p .swarm          # Swarm agent coordination

# Optional: Add more structure based on needs
# mkdir -p packages/cli       # CLI tools
# mkdir -p packages/ui        # Shared UI components
# mkdir -p scripts            # Deployment/management scripts
# mkdir -p migrations         # Database migrations (if needed)
```

**Directory Purpose:**

| Directory   | Purpose                                      |
| ----------- | -------------------------------------------- |
| `programs/` | Anchor Rust programs (smart contracts)       |
| `packages/` | Shared libraries, SDK, utilities             |
| `apps/`     | User-facing applications (frontend, landing) |
| `tests/`    | Integration tests                            |
| `docs/`     | Documentation (MkDocs, Docusaurus, etc.)     |
| `.anchor/`  | Anchor build artifacts (gitignored)          |

---

## Step 3: Initialize Git

```bash
git init
git branch -M main
```

---

## Step 4: Create pnpm Workspace Configuration

Create `pnpm-workspace.yaml`:

```yaml
# pnpm-workspace.yaml
# Defines workspace packages for the monorepo

packages:
  # Programs (Anchor projects)
  - "programs/*"

  # Shared packages
  - "packages/*"

  # Applications
  - "apps/*"

  # Test suites
  - "tests"
```

---

## Step 5: Create Root TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    /* Base Options */
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    /* Strict Type-Checking */
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    /* Additional Checks */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,

    /* Output */
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",

    /* Interop */
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    /* Advanced */
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": [
    "node_modules",
    "dist",
    "target",
    "**/dist/**",
    "**/node_modules/**"
  ]
}
```

---

## Step 6: Create Package-Specific tsconfig Templates

### For SDK Package (`packages/sdk/tsconfig.json`):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### For Apps (`apps/frontend/tsconfig.json`):

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true
  },
  "include": ["src/**/*", "*.config.ts"],
  "exclude": ["node_modules"]
}
```

---

## Step 7: Create Root Package.json

Create `package.json`:

```json
{
  "name": "<project-name>",
  "version": "0.1.0",
  "private": true,
  "description": "Solana project monorepo",
  "keywords": ["solana", "anchor", "blockchain", "web3"],
  "author": "",
  "license": "MIT",
  "packageManager": "pnpm@9.15.1",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "lint": "pnpm -r lint",
    "lint:fix": "pnpm -r lint:fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "build": "pnpm -r build",
    "build:programs": "anchor build",
    "test": "anchor test",
    "test:unit": "pnpm -r test:unit",
    "clean": "pnpm -r clean && rm -rf node_modules",
    "typecheck": "pnpm -r typecheck",
    "deps:check": "pnpm outdated -r",
    "deps:update": "pnpm update -r -i"
  },
  "devDependencies": {
    "@coral-xyz/anchor": "^0.30.1",
    "@solana/web3.js": "^1.95.0",
    "@types/node": "^20.14.0",
    "prettier": "^3.3.0",
    "typescript": "^5.5.0"
  },
  "pnpm": {
    "overrides": {
      "@solana/web3.js": "^1.95.0"
    }
  }
}
```

---

## Step 8: Create Anchor.toml

Create `Anchor.toml`:

```toml
# Anchor.toml
# Main configuration for Anchor projects

[toolchain]
anchor_version = "0.31.0"
solana_version = "1.18.20"

[features]
resolution = true
skip-lint = false

[programs.localnet]
# Replace with your program name and generated keypair
<program_name> = "<PROGRAM_ID_PLACEHOLDER>"

[programs.devnet]
<program_name> = "<PROGRAM_ID_DEVNET>"

[programs.mainnet]
<program_name> = "<PROGRAM_ID_MAINNET>"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "pnpm test"
# Add custom scripts as needed
# init = "ts-node scripts/init.ts"
# deploy = "ts-node scripts/deploy.ts"

[[test.genesis]]
# Add program genesis accounts for testing if needed
# address = "<ADDRESS>"
# program = "target/deploy/<program_name>.so"

[test]
startup_wait = 5000

[test.validator]
# Local validator configuration
url = "https://api.mainnet-beta.solana.com"
bind_address = "0.0.0.0"
rpc_port = 8899
ledger_dir = ".anchor/test-ledger"

# Clone accounts from mainnet for testing (optional)
# [[test.validator.clone]]
# address = "<ACCOUNT_ADDRESS>"
```

**Note:** Replace `<program_name>` with your actual program name and `<PROGRAM_ID_*>` with actual deployed addresses.

---

## Step 9: Create .gitignore

Create `.gitignore`:

```gitignore
# =========================
# Solana / Anchor
# =========================
target/
.anchor/
test-ledger/
*.so
*.json.gzip

# Program keypairs (IMPORTANT: Never commit!)
programs/**/target/
**/target/deploy/*.json

# =========================
# Node.js / TypeScript
# =========================
node_modules/
dist/
*.tsbuildinfo
.turbo/
.wrangler/

# =========================
# Environment & Secrets
# =========================
.env
.env.local
.env.*.local
*.env
.envrc
.secrets/

# =========================
# IDE / Editor
# =========================
.idea/
.vscode/
*.swp
*.swo
*~
.DS_Store

# =========================
# Logs & Debug
# =========================
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
logs/

# =========================
# Build & Cache
# =========================
.cache/
.parcel-cache/
.eslintcache
*.tsbuildinfo

# =========================
# Testing
# =========================
coverage/
.nyc_output/

# =========================
# Misc
# =========================
.swarm/
.hive/
*.pem
*.key
*.pid
*.seed

# =========================
# OS Generated
# =========================
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

---

## Step 10: Create .gitattributes (Optional)

Create `.gitattributes`:

```gitattributes
# Auto detect text files and normalize to LF
* text=auto eol=lf

# Source code
*.rs text diff=rust
*.ts text
*.tsx text
*.js text
*.jsx text
*.json text
*.toml text
*.yaml text
*.yml text
*.md text

# Shell scripts should always use LF
*.sh text eol=lf

# Binary files
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.so binary
*.pdf binary

# Ignore certain files in exports
.gitignore export-ignore
.gitattributes export-ignore
```

---

## Step 11: Create .nvmrc (Optional but Recommended)

Create `.nvmrc`:

```
20.15.0
```

---

## Step 12: Create .prettierrc

Create `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

## Step 13: Create EditorConfig

Create `.editorconfig`:

```ini
# EditorConfig - https://editorconfig.org

root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.rs]
indent_size = 4

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

---

## Step 14: Create Initial Anchor Program (Optional)

If you want to scaffold a basic Anchor program:

```bash
# Navigate to programs directory
cd programs

# Initialize new Anchor program
anchor init <program_name> --no-git

# This creates:
# programs/<program_name>/
#   ├── Cargo.toml
#   ├── src/
#   │   └── lib.rs
#   └── tests/
#       └── <program_name>.ts

cd ..
```

**Or manually create:**

Create `programs/<program_name>/Cargo.toml`:

```toml
[package]
name = "<program_name>"
version = "0.1.0"
description = "<Program description>"
edition = "2021"
license = "MIT"
repository = "<repository-url>"

[lib]
crate-type = ["cdylib", "lib"]
name = "<program_name>"

[features]
default = []
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = []
idl-build = ["anchor-lang/idl-build"]

[dependencies]
anchor-lang = { version = "0.31.0", features = ["init-if-needed"] }

[dev-dependencies]
anchor-client = "0.31.0"
```

Create `programs/<program_name>/src/lib.rs`:

```rust
use anchor_lang::prelude::*;

declare_id!("<PROGRAM_ID_PLACEHOLDER>");

#[program]
pub mod <program_name> {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Initialized!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
```

---

## Step 15: Create SDK Package Structure

Create `packages/sdk/package.json`:

```json
{
  "name": "@<scope>/<project-name>-sdk",
  "version": "0.1.0",
  "description": "TypeScript SDK for <project-name>",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist node_modules"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.30.1",
    "@solana/web3.js": "^1.95.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "tsup": "^8.1.0",
    "typescript": "^5.5.0"
  },
  "peerDependencies": {
    "@coral-xyz/anchor": "^0.30.1",
    "@solana/web3.js": "^1.95.0"
  }
}
```

Create `packages/sdk/src/index.ts`:

```typescript
/**
 * @packageDocumentation
 * SDK for interacting with <project-name> Solana programs
 */

export * from "./constants";
export * from "./types";
// Add exports as you develop
```

---

## Step 16: Create Shared Package Structure

Create `packages/shared/package.json`:

```json
{
  "name": "@<scope>/<project-name>-shared",
  "version": "0.1.0",
  "description": "Shared utilities and types for <project-name>",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist node_modules"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "tsup": "^8.1.0",
    "typescript": "^5.5.0"
  }
}
```

---

## Step 17: Create Test Package Structure

Create `tests/package.json`:

```json
{
  "name": "@<scope>/<project-name>-tests",
  "version": "0.1.0",
  "private": true,
  "description": "Integration tests for <project-name>",
  "scripts": {
    "test": "anchor test",
    "test:unit": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf node_modules"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.30.1",
    "@solana/web3.js": "^1.95.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.14.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.5.0"
  }
}
```

Create `tests/tsconfig.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": ".",
    "types": ["jest", "node"]
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Step 18: Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Add additional dev dependencies if needed
pnpm add -Dw eslint prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

---

## Step 19: Generate Program Keypair (If Not Exists)

```bash
# Generate a new keypair for your program
solana-keygen new -o programs/<program_name>/target/deploy/<program_name>-keypair.json --no-bip39-passphrase

# Get the public key (program ID)
solana-keygen pubkey programs/<program_name>/target/deploy/<program_name>-keypair.json

# IMPORTANT: Add keypair file to .gitignore (should already be covered)
echo "programs/<program_name>/target/deploy/<program_name>-keypair.json" >> .gitignore
```

---

## Step 20: Verify Setup

```bash
# Check workspace is configured correctly
pnpm list -r --depth 0

# Build all packages
pnpm build

# Run linter
pnpm lint

# Type check
pnpm typecheck

# Run Anchor build (if program exists)
anchor build
```

---

## Step 21: Initial Git Commit

```bash
# Stage all files
git add .

# Create initial commit
git commit -m "chore: initialize monorepo

- Set up pnpm workspace
- Configure TypeScript with strict settings
- Add Anchor.toml configuration
- Set up package structure (programs, packages, apps, tests)
- Add comprehensive .gitignore
- Configure Prettier and EditorConfig
"
```

---

## Final Project Structure

```
<project-name>/
├── .anchor/                    # Anchor artifacts (gitignored)
├── .swarm/                     # Swarm agent coordination
├── apps/
│   ├── frontend/               # Frontend application
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── landing/                # Landing page
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── sdk/                    # TypeScript SDK
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                 # Shared utilities
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── programs/
│   └── <program_name>/         # Anchor program
│       ├── src/
│       │   └── lib.rs
│       ├── Cargo.toml
│       └── Xargo.toml
├── tests/                      # Integration tests
│   ├── *.test.ts
│   ├── package.json
│   └── tsconfig.json
├── docs/                       # Documentation
├── .editorconfig               # Editor configuration
├── .env                        # Environment variables (gitignored)
├── .gitattributes              # Git attributes
├── .gitignore                  # Git ignore patterns
├── .nvmrc                      # Node version
├── .prettierrc                 # Prettier config
├── Anchor.toml                 # Anchor configuration
├── package.json                # Root package.json
├── pnpm-lock.yaml             # Lockfile
├── pnpm-workspace.yaml        # Workspace definition
├── tsconfig.json              # Root TypeScript config
└── README.md                   # Project documentation
```

---

## Best Practices

### 1. **Version Management**

- Use `.nvmrc` for Node.js version consistency
- Specify package manager version in `package.json`
- Pin toolchain versions in `Anchor.toml`

### 2. **Security**

- **NEVER commit program keypairs** (`*-keypair.json`)
- Use environment variables for secrets
- Consider using `.env` files for local development

### 3. **TypeScript**

- Use strict mode for all packages
- Share base config via `extends`
- Enable `noUncheckedIndexedAccess` for safer array access

### 4. **Monorepo Management**

- Use pnpm workspaces for dependency deduplication
- Keep shared types in `packages/shared`
- Version packages independently with Changesets

### 5. **Testing**

- Integration tests in `tests/` (run via Anchor)
- Unit tests in each package
- Use `jest` for TypeScript tests

### 6. **Documentation**

- Add README to each package
- Use JSDoc/TSDoc for APIs
- Consider MkDocs or Docusaurus for docs site

---

## Common Commands Reference

```bash
# Development
pnpm dev                    # Start all dev servers
pnpm build                  # Build all packages
pnpm lint                   # Lint all packages
pnpm lint:fix               # Auto-fix linting issues
pnpm typecheck              # Type check all packages

# Solana/Anchor
anchor build                # Build Anchor programs
anchor test                 # Run Anchor tests
anchor deploy               # Deploy to configured cluster
anchor keys list            # List program IDs

# Cleanup
pnpm clean                  # Clean all packages
rm -rf node_modules         # Remove root node_modules
rm -rf target               # Remove Anchor build artifacts

# Dependencies
pnpm install                # Install all dependencies
pnpm update -r              # Update all dependencies
pnpm outdated -r            # Check for outdated deps

# Git
git add .
git commit -m "message"
git push origin main
```

---

## Troubleshooting

### Issue: `pnpm: command not found`

```bash
npm install -g pnpm
```

### Issue: `anchor: command not found`

```bash
cargo install avm
avm install latest
avm use latest
```

### Issue: `Error: Anchor version mismatch`

```bash
# Check installed version
anchor --version

# Install specific version via AVM
avm install 0.31.0
avm use 0.31.0
```

### Issue: `insufficient funds for instruction`

```bash
# Airdrop SOL on localnet/devnet
solana airdrop 10 <YOUR_WALLET> --url localnet
solana airdrop 2 <YOUR_WALLET> --url devnet
```

### Issue: TypeScript errors in generated IDL types

```bash
# Regenerate IDL types after Anchor build
anchor build
cp target/types/<program_name>.ts packages/sdk/src/generated/
```

### Issue: `Program log: Custom program error`

Check the program's error codes in the Anchor program or IDL for specific error meanings.

---

## Next Steps After Setup

1. **Configure your program ID** in `Anchor.toml` and program source
2. **Set up CI/CD** (GitHub Actions, etc.)
3. **Add ESLint configuration** if needed
4. **Initialize frontend framework** (Next.js, Vite, etc.)
5. **Set up Changesets** for versioning
6. **Configure deployment scripts**
7. **Add comprehensive tests**

---

## Agent Checklist

- [ ] Prerequisites verified (solana, anchor, pnpm, node, rust)
- [ ] Project directory created
- [ ] Folder structure created
- [ ] Git initialized
- [ ] pnpm-workspace.yaml created
- [ ] Root tsconfig.json created
- [ ] Root package.json created
- [ ] Anchor.toml created
- [ ] .gitignore created
- [ ] .gitattributes created (optional)
- [ ] .prettierrc created
- [ ] .editorconfig created
- [ ] SDK package scaffolded
- [ ] Shared package scaffolded
- [ ] Tests package scaffolded
- [ ] Dependencies installed
- [ ] Build verified
- [ ] Initial commit created

---

_Generated by Solana Monorepo Setup Agent v1.0_
