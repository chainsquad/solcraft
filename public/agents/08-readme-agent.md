# README Generator Agent

**Purpose**: Analyze codebases and generate comprehensive README.md files that make onboarding trivial for new developers.

**Philosophy**: A README should be absurdly thorough. Every step, every command, every configuration - documented. Assume the reader is on a fresh machine with nothing installed.

---

## 🎯 Three Purposes of a README

1. **Local Development Guide**: Someone clones the repo → they can run the app locally in <10 minutes
2. **System Understanding**: New developer joins → they understand architecture, data flow, and key components
3. **Production Deployment Reference**: DevOps deploys → they have all environment variables, build steps, and configuration

---

## 🔍 Phase 1: Exploration Checklist

Before writing, gather information systematically.

### 1.1 Project Structure Analysis

```bash
# Get directory structure
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.json" -o -name "*.md" | head -100
tree -L 3 -I 'node_modules|.git|dist|build' .

# Identify project type
cat package.json | grep -E '"next"|"react"|"express"|"anchor"|"solana"'
cat Cargo.toml 2>/dev/null
cat requirements.txt 2>/dev/null
cat go.mod 2>/dev/null
```

**Checklist:**

- [ ] What is the primary language/framework?
- [ ] Is this monorepo or single project?
- [ ] What are the main directories and their purposes?
- [ ] Are there multiple apps/services?

### 1.2 Configuration Files

**Find and read:**

```bash
# Environment templates
cat .env.example 2>/dev/null
cat .env.sample 2>/dev/null
cat .env.local.example 2>/dev/null

# Containerization
cat Dockerfile 2>/dev/null
cat docker-compose.yml 2>/dev/null

# CI/CD
cat .github/workflows/*.yml 2>/dev/null
cat .gitlab-ci.yml 2>/dev/null
cat Jenkinsfile 2>/dev/null

# Build configs
cat tsconfig.json 2>/dev/null
cat vite.config.ts 2>/dev/null
cat webpack.config.js 2>/dev/null
cat anchor.toml 2>/dev/null
```

**Checklist:**

- [ ] What environment variables are required?
- [ ] Is there Docker support?
- [ ] What's the CI/CD platform?
- [ ] Are there multiple build configurations?

### 1.3 Database Schema

```bash
# Prisma
cat prisma/schema.prisma 2>/dev/null

# SQL migrations
cat migrations/*.sql 2>/dev/null
cat database/migrations/*.sql 2>/dev/null

# ORM configs
cat knexfile.js 2>/dev/null
cat typeorm/cli.ts 2>/dev/null

# Solana programs
cat programs/*/src/*.rs 2>/dev/null
```

**Checklist:**

- [ ] What database is used (PostgreSQL, MySQL, MongoDB, etc.)?
- [ ] Where are migrations stored?
- [ ] What are the key tables/collections?
- [ ] Are there seed files?

### 1.4 Key Dependencies

```bash
# Extract main dependencies
cat package.json | jq '.dependencies, .devDependencies'
cat Cargo.toml | grep -A 50 "\[dependencies\]"
cat requirements.txt
cat go.mod | grep -E "require|module"
```

**Checklist:**

- [ ] What are the core frameworks?
- [ ] What external services are integrated (Stripe, OpenAI, etc.)?
- [ ] What's the testing framework?
- [ ] Any critical version requirements?

### 1.5 Scripts & Commands

```bash
# NPM/PNPM scripts
cat package.json | jq '.scripts'

# Make targets
cat Makefile 2>/dev/null

# Shell scripts
ls -la scripts/*.sh 2>/dev/null
```

**Checklist:**

- [ ] How to start development server?
- [ ] How to run tests?
- [ ] How to build for production?
- [ ] Any setup/utility scripts?

### 1.6 Deployment Platform

```bash
# Vercel
cat vercel.json 2>/dev/null

# Netlify
cat netlify.toml 2>/dev/null

# AWS
cat serverless.yml 2>/dev/null
cat cdk.json 2>/dev/null

# Kubernetes
cat k8s/*.yaml 2>/dev/null
cat helm/*.yaml 2>/dev/null

# Solana
cat Anchor.toml | grep -E "provider|programs"
```

**Checklist:**

- [ ] What's the deployment target?
- [ ] Is there staging/production separation?
- [ ] Are there deployment scripts?
- [ ] What environment variables are needed in production?

---

## 📝 Phase 2: README Structure

### A. Project Title & Overview

```markdown
# Project Name

Brief 2-3 sentence description of what this project does and who it's for.

## Key Features

- Feature 1: One-line description
- Feature 2: One-line description
- Feature 3: One-line description
```

**Example:**

```markdown
# Tributary

Automated recurring payments on Solana using token delegation. Web2 subscription UX with Web3 transparency.

## Key Features

- **Token Delegation**: Users approve once, payments execute automatically
- **Flexible Policies**: Configurable payment amounts, intervals, and recipients
- **Fee Distribution**: Protocol and gateway fees split automatically
- **Permissionless Execution**: Anyone can trigger due payments
```

### B. Tech Stack

Create a comprehensive tech stack section:

```markdown
## Tech Stack

| Category       | Technology              |
| -------------- | ----------------------- |
| **Framework**  | Next.js 14, React 18    |
| **Language**   | TypeScript 5.x          |
| **Blockchain** | Solana, Anchor 0.31.0   |
| **Database**   | PostgreSQL 15, Prisma   |
| **Styling**    | Tailwind CSS, shadcn/ui |
| **Testing**    | Jest, Anchor Test       |
| **Deployment** | Vercel, Docker          |
```

### C. Prerequisites

Be thorough. List EVERYTHING needed:

```markdown
## Prerequisites

### Required

| Software   | Version  | How to Install                                                                 |
| ---------- | -------- | ------------------------------------------------------------------------------ |
| Node.js    | ≥18.17.0 | `nvm install 18`                                                               |
| pnpm       | ≥8.0.0   | `npm install -g pnpm`                                                          |
| Solana CLI | 1.18.20  | `sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"`                |
| Anchor     | 0.31.0   | `cargo install --git https://github.com/coral-xyz/anchor avm --locked --force` |

### Optional

| Software | Purpose                   | How to Install                 |
| -------- | ------------------------- | ------------------------------ |
| Docker   | Containerized development | [Download](https://docker.com) |
| Make     | Build automation          | `brew install make`            |

### External Services

- **RPC Provider**: Helius, QuickNode, or Solana official RPC
- **Wallet**: Phantom or Solflare for testing
- **Storage**: Arweave or IPFS for metadata (if needed)
```

### D. Getting Started (Detailed)

**Include EVERY step. No assumptions.**

```markdown
## Getting Started

### 1. Clone the Repository

\`\`\`bash

# Via HTTPS

git clone https://github.com/org/project.git
cd project

# Via SSH

git clone git@github.com:org/project.git
cd project
\`\`\`

### 2. Install Dependencies

\`\`\`bash

# Install pnpm if not installed

npm install -g pnpm

# Install project dependencies

pnpm install

# For Solana programs

cd programs && cargo build
\`\`\`

### 3. Environment Setup

Copy the example environment file:

\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` with your values:

| Variable                 | Required | Default                    | Description                  | How to Obtain                                                      |
| ------------------------ | -------- | -------------------------- | ---------------------------- | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_RPC_URL`    | Yes      | -                          | Solana RPC endpoint          | [Helius](https://helius.dev) or [QuickNode](https://quicknode.com) |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes      | -                          | Deployed program ID          | Run `anchor keys list` after build                                 |
| `DATABASE_URL`           | Yes      | -                          | PostgreSQL connection string | Local: `postgresql://user:pass@localhost:5432/dbname`              |
| `ANCHOR_WALLET`          | No       | `~/.config/solana/id.json` | Path to keypair              | `solana-keygen new`                                                |

\`\`\`bash

# Example .env.local

NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=TRibg8W8zmPHQqWtyAD1rEBRXEdyU13Mu6qX1Sg42tJ
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tributary
ANCHOR_WALLET=/Users/you/.config/solana/id.json
\`\`\`

### 4. Database Setup

\`\`\`bash

# Start PostgreSQL (Docker)

docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Run migrations

pnpm prisma migrate dev

# Seed data (optional)

pnpm prisma db seed
\`\`\`

### 5. Solana Setup (if applicable)

\`\`\`bash

# Configure Solana CLI for devnet

solana config set --url devnet

# Generate keypair if needed

solana-keygen new --outfile ~/.config/solana/id.json

# Airdrop SOL for testing

solana airdrop 2

# Build Anchor program

anchor build

# Deploy to devnet

anchor deploy
\`\`\`

### 6. Start Development Server

\`\`\`bash

# Start Next.js development server

pnpm dev

# Start Anchor test validator (separate terminal)

anchor localnet

# Output:

# ✓ Ready on http://localhost:3000

# ✓ Local validator running at http://localhost:8899

\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.
```

### E. Architecture Overview (Go Deep)

```markdown
## Architecture Overview

### Directory Structure

\`\`\`
project/
├── app/ # Next.js app router
│ ├── (auth)/ # Authenticated routes
│ ├── api/ # API routes
│ └── layout.tsx # Root layout
├── components/ # React components
│ ├── ui/ # Base UI components
│ └── features/ # Feature-specific components
├── lib/ # Utility libraries
│ ├── solana/ # Solana utilities
│ └── utils.ts # General utilities
├── programs/ # Solana programs (Rust)
│ └── tributary/
│ └── src/
│ ├── lib.rs # Program entrypoint
│ └── state/ # Account structs
├── sdk/ # TypeScript SDK
├── tests/ # Integration tests
├── prisma/ # Database schema
│ └── schema.prisma
├── anchor.toml # Anchor configuration
└── package.json
\`\`\`

### Request Lifecycle

\`\`\`
User Action
│
▼
┌─────────────────────────────────────────────────────────┐
│ Frontend (Next.js) │
│ ├── Component triggers transaction │
│ └── SDK constructs instruction │
└────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────┐
│ Wallet Adapter │
│ ├── Signs transaction │
│ └── Sends to RPC │
└────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────┐
│ Solana Runtime │
│ ├── Validates signatures │
│ ├── Executes program instructions │
│ └── Updates account state │
└────────────────────┬────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────┐
│ Tributary Program │
│ ├── Verifies accounts │
│ ├── Transfers tokens │
│ └── Distributes fees │
└─────────────────────────────────────────────────────────┘
\`\`\`

### Key Components

#### 1. Payment Flow

1. **User creates `UserPayment`**: Links owner wallet + token mint
2. **Merchant creates `PaymentGateway`**: Configures fee structure
3. **User creates `PaymentPolicy`**: Defines recurring payment terms
4. **User approves delegate**: Token delegation for automatic payments
5. **Gateway executes payment**: Permissionless function anyone can call

#### 2. Account Relationships

\`\`\`
ProgramConfig (singleton)
│
├── PaymentGateway[]
│ ├── authority: Pubkey
│ ├── fee_bps: u16
│ └── fee_recipient: Pubkey
│
└── UserPayment[]
├── owner: Pubkey
├── mint: Pubkey
└── PaymentPolicy[]
├── amount: u64
├── interval: i64
└── recipient: Pubkey
\`\`\`

### Database Schema

\`\`\`prisma
model User {
id String @id @default(cuid())
pubkey String @unique
createdAt DateTime @default(now())
payments Payment[]
}

model Payment {
id String @id @default(cuid())
userId String
user User @relation(fields: [userId])
amount BigInt
signature String @unique
executedAt DateTime @default(now())
}
\`\`\`
```

### F. Environment Variables

```markdown
## Environment Variables

### Required Variables

| Variable              | Type   | Description           | Example                                    |
| --------------------- | ------ | --------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_RPC_URL` | string | Solana RPC endpoint   | `https://api.devnet.solana.com`            |
| `DATABASE_URL`        | string | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |

### Optional Variables

| Variable              | Default  | Description                              |
| --------------------- | -------- | ---------------------------------------- |
| `NEXT_PUBLIC_NETWORK` | `devnet` | Solana network (localnet/devnet/mainnet) |
| `LOG_LEVEL`           | `info`   | Logging level (debug/info/warn/error)    |

### Security Notes

- ⚠️ **Never commit** `.env.local` or `.env` files
- 🔐 **Production secrets** should use platform secrets (Vercel Env, AWS Secrets Manager)
- 🔄 **Rotate keys** periodically, especially after team member departures

### Obtaining Values

#### RPC Endpoint

1. **Helius** (recommended for production):
   \`\`\`bash

   # Sign up at https://helius.dev

   # Copy your RPC URL from dashboard

   NEXT_PUBLIC_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
   \`\`\`

2. **QuickNode**:
   \`\`\`bash

   # Sign up at https://quicknode.com

   # Create Solana endpoint

   NEXT_PUBLIC_RPC_URL=https://example.solana-devnet.quiknode.pro/YOUR_KEY
   \`\`\`

3. **Public RPC** (development only):
   \`\`\`bash
   NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
   \`\`\`

#### Database URL

\`\`\`bash

# Local PostgreSQL

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb

# Docker PostgreSQL

DATABASE_URL=postgresql://user:password@postgres:5432/mydb

# Production (Neon, Supabase, etc.)

DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
\`\`\`
```

### G. Available Scripts

```markdown
## Available Scripts

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm dev`        | Start development server on port 3000            |
| `pnpm build`      | Build for production                             |
| `pnpm start`      | Start production server                          |
| `pnpm lint`       | Run ESLint                                       |
| `pnpm lint:fix`   | Fix ESLint errors automatically                  |
| `pnpm test`       | Run all tests                                    |
| `pnpm test:watch` | Run tests in watch mode                          |
| `anchor build`    | Build Solana program                             |
| `anchor test`     | Run program tests with local validator           |
| `anchor deploy`   | Deploy program to configured network             |
| `make prep`       | Setup Solana toolchain (v1.18.20, Anchor 0.31.0) |

### Development Workflow

\`\`\`bash

# Start full development environment

pnpm dev # Terminal 1: Next.js
anchor localnet # Terminal 2: Solana validator

# Make changes and test

pnpm lint
pnpm test

# Build and deploy

anchor build
anchor deploy
\`\`\`

### Program Commands

\`\`\`bash

# Build program only

anchor build --program-name tributary

# Test with logs

anchor test --skip-local-validator --detach

# Deploy to devnet

solana config set --url devnet
anchor deploy

# Check deployment

solana program show <PROGRAM_ID>
\`\`\`
```

### H. Testing

```markdown
## Testing

### Run Tests

\`\`\`bash

# Run all tests

pnpm test

# Run specific test file

pnpm test -- tributary.test.ts

# Run with coverage

pnpm test --coverage

# Watch mode

pnpm test:watch
\`\`\`

### Test Structure

\`\`\`
tests/
├── tributary.test.ts # Integration tests
│ ├── initialization # Program init
│ ├── user-payments # User payment creation
│ ├── gateways # Gateway setup
│ ├── policies # Policy creation
│ └── execution # Payment execution
└── utils/
└── helpers.ts # Test utilities
\`\`\`

### Writing Tests

\`\`\`typescript
describe("Payment Execution", () => {
it("should execute payment when due", async () => {
// Setup: Create user, gateway, policy
const user = await createUser();
const gateway = await createGateway();
const policy = await createPolicy(user, gateway);

    // Approve delegation
    await approveDelegate(user, policy);

    // Fast forward time
    await sleep(POLICY_INTERVAL);

    // Execute payment
    await executePayment(policy);

    // Verify transfer
    const balance = await getTokenBalance(user);
    expect(balance).toBeLessThan(INITIAL_BALANCE - POLICY_AMOUNT);

});
});
\`\`\`

### Anchor Testing

\`\`\`bash

# Run Anchor tests (spins up local validator)

anchor test

# Run with existing validator

anchor test --skip-local-validator

# Run specific test

anchor test -- --grep "initialize"
\`\`\`

### Coverage

\`\`\`bash

# Generate coverage report

pnpm test --coverage

# Output:

# ----------|---------|----------|---------|---------|

# File | % Stmts | % Branch | % Funcs | % Lines |

# ----------|---------|----------|---------|---------|

# All files | 85.71 | 78.94 | 90.00 | 85.71 |

# ----------|---------|----------|---------|---------|

\`\`\`
```

### I. Deployment

```markdown
## Deployment

### Vercel (Recommended)

1. **Connect Repository**:
   \`\`\`bash

   # Install Vercel CLI

   pnpm i -g vercel

   # Link project

   vercel link
   \`\`\`

2. **Configure Environment**:

   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.example`
   - Use different values for Preview vs Production

3. **Deploy**:
   \`\`\`bash

   # Deploy to preview

   vercel

   # Deploy to production

   vercel --prod
   \`\`\`

### Docker

\`\`\`bash

# Build image

docker build -t project-name .

# Run container

docker run -p 3000:3000 --env-file .env project-name

# Using docker-compose

docker-compose up -d
\`\`\`

### Solana Program Deployment

\`\`\`bash

# 1. Configure for mainnet

solana config set --url mainnet-beta

# 2. Ensure sufficient SOL

solana balance

# Need ~5-10 SOL for program deployment

# 3. Build optimized program

anchor build

# 4. Deploy

anchor deploy --provider.cluster mainnet

# 5. Verify deployment

solana program show <PROGRAM_ID>

# 6. Update program ID in environment

NEXT_PUBLIC_PROGRAM_ID=<PROGRAM_ID>
\`\`\`

### Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Health check endpoint responding
- [ ] Program verified on explorer
- [ ] Monitoring/alerting configured
- [ ] SSL certificate valid
```

### J. Troubleshooting

```markdown
## Troubleshooting

### Common Issues

#### "Program deployment failed: Insufficient funds"

\`\`\`bash

# Check balance

solana balance

# Airdrop on devnet

solana airdrop 2

# For mainnet, ensure wallet has enough SOL

\`\`\`

#### "Anchor build failed: cargo not found"

\`\`\`bash

# Install Rust

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Anchor

cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.31.0
avm use 0.31.0
\`\`\`

#### "Database connection refused"

\`\`\`bash

# Check PostgreSQL is running

pg_isready

# Start PostgreSQL (Docker)

docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

# Check connection string

echo $DATABASE_URL
\`\`\`

#### "Type errors after pulling changes"

\`\`\`bash

# Regenerate types

pnpm prisma generate
anchor build

# Clear Next.js cache

rm -rf .next && pnpm dev
\`\`\`

### Debugging Tips

1. **Enable verbose logging**:
   \`\`\`bash
   LOG_LEVEL=debug pnpm dev
   \`\`\`

2. **Check Anchor logs**:
   \`\`\`bash

   # During test

   anchor test --detach
   solana logs
   \`\`\`

3. **Inspect program state**:
   \`\`\`bash

   # Decode account data

   anchor run decode-account
   \`\`\`

4. **Reset local state**:
   \`\`\`bash

   # Reset Anchor test validator

   rm -rf test-ledger

   # Reset database

   pnpm prisma migrate reset
   \`\`\`

### Getting Help

- 📖 [Documentation](./docs/)
- 💬 [Discord](https://discord.gg/...)
- 🐛 [Issues](https://github.com/org/project/issues)
- 📧 [Email](mailto:support@project.com)
```

---

## ✍️ Phase 3: Writing Principles

### Be Absurdly Thorough

❌ **Bad**: "Install dependencies and start the server"
✅ **Good**:

```markdown
### Install Dependencies

\`\`\`bash

# Ensure pnpm is installed

npm install -g pnpm

# Install all dependencies

pnpm install

# Expected output:

# Lockfile is up to date, resolution step is skipped

# packages/my-app | +45

# packages/sdk | +12

# Done in 3.2s

\`\`\`

### Start Development Server

\`\`\`bash
pnpm dev

# Expected output:

# ▲ Next.js 14.0.4

# - Local: http://localhost:3000

# - Environments: .env.local

#

# ✓ Ready in 2.1s

\`\`\`
```

### Use Code Blocks for Everything

❌ **Bad**: Run the test command
✅ **Good**:

```markdown
\`\`\`bash
pnpm test
\`\`\`
```

### Show Example Output

```markdown
\`\`\`bash
$ solana balance
2.5 SOL

$ anchor deploy
Deploying workspace: /home/user/project
Deploy success. Program ID: TRibg8W8zmPHQqWtyAD1rEBRXEdyU13Mu6qX1Sg42tJ
\`\`\`
```

### Explain the "Why"

❌ **Bad**: "Run migrations"
✅ **Good**: "Run migrations to create database tables. This generates the schema defined in `prisma/schema.prisma`."

### Assume Fresh Machine

Always start from zero:

- Don't assume Node.js is installed
- Don't assume pnpm is installed
- Don't assume database is running
- Don't assume Solana CLI is configured

### Use Tables for References

```markdown
| Command | Purpose                  |
| ------- | ------------------------ |
| `dev`   | Start development server |
| `build` | Create production build  |
```

### Keep Commands Current

Verify commands work with current versions:

- Check `package.json` for actual scripts
- Verify CLI flags are correct
- Test commands before documenting

---

## 📋 Phase 4: Output Format

### Markdown Structure

```markdown
# Project Name

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/project.svg?style=social&label=Follow%20%40project)](https://twitter.com/project)

Brief description of what this project does.

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Architecture](#architecture-overview)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Key Features

...

## Tech Stack

...

(rest of sections)
```

### Language Hints

Always specify language in code blocks:

\`\`\`bash

# Terminal commands

\`\`\`

\`\`\`typescript
// TypeScript code
\`\`\`

\`\`\`rust
// Rust code
\`\`\`

\`\`\`prisma
// Prisma schema
\`\`\`

\`\`\`toml

# Configuration files

\`\`\`

### Clear Section Hierarchy

```markdown
# H1 - Title

## H2 - Main Sections

### H3 - Subsections

#### H4 - Details
```

### Table of Contents

For long docs (500+ lines), include ToC with anchor links.

---

## 🌐 Phase 5: Special Considerations

### For Solana Projects

Add these sections after "Getting Started":

```markdown
### Solana CLI Setup

\`\`\`bash

# Install Solana CLI

sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Add to PATH

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify installation

solana --version

# Expected: solana-cli 1.18.20

\`\`\`

### Anchor Setup

\`\`\`bash

# Install Anchor Version Manager

cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install specific Anchor version

avm install 0.31.0
avm use 0.31.0

# Verify

anchor --version

# Expected: anchor-cli 0.31.0

\`\`\`

### Keypair Management

\`\`\`bash

# Generate new keypair

solana-keygen new --outfile ~/.config/solana/devnet.json

# Set as default

solana config set --keypair ~/.config/solana/devnet.json

# View public key

solana-keygen pubkey ~/.config/solana/devnet.json

# ⚠️ SECURITY: Never commit keypair files

echo "\*.json" >> .gitignore
\`\`\`

### Network Configuration

\`\`\`bash

# Local validator (for testing)

solana config set --url localhost

# Devnet (development)

solana config set --url devnet

# Mainnet (production)

solana config set --url mainnet-beta

# Check configuration

solana config get
\`\`\`

### Program Deployment

\`\`\`bash

# 1. Build program

anchor build

# 2. Get program keypair

anchor keys list

# Copy the program ID to Anchor.toml and code

# 3. Deploy to devnet

anchor deploy --provider.cluster devnet

# 4. Verify on explorer

# https://explorer.solana.com/address/<PROGRAM_ID>?cluster=devnet

\`\`\`

### Testing with Test Validator

\`\`\`bash

# Start local validator

solana-test-validator

# In another terminal, run tests

anchor test --skip-local-validator

# Or let anchor manage validator

anchor test
\`\`\`

### Common Solana Issues

**"Custom program error: 0x1"** - Insufficient SOL for rent
\`\`\`bash
solana airdrop 2
\`\`\`

**"Account data too small"** - Account wasn't initialized correctly
\`\`\`bash

# Rebuild and redeploy program

anchor build && anchor deploy
\`\`\`

**"Transaction simulation failed"** - Check account order in instruction

- Verify all accounts are in correct order
- Check signers are marked as mutable if needed
- Ensure PDAs are derived correctly
```

---

## 🚀 Execution Checklist

When generating a README:

1. [ ] **Explore**: Run exploration commands, gather information
2. [ ] **Identify**: Determine project type, framework, dependencies
3. [ ] **Structure**: Create section outline based on project needs
4. [ ] **Write**: Follow structure, be thorough, include examples
5. [ ] **Verify**: Check all commands work, links are valid
6. [ ] **Format**: Ensure proper markdown, code hints, tables
7. [ ] **Review**: Read as if you're a new developer - is anything missing?

---

## 📚 Examples

### Minimal README (Small Project)

```markdown
# My Package

Brief description of package purpose.

## Install

\`\`\`bash
pnpm add my-package
\`\`\`

## Usage

\`\`\`typescript
import { myFunction } from 'my-package';

myFunction();
\`\`\`

## API

### `myFunction(input: string): void`

Description of what it does.

## License

MIT
```

### Full README (Production Project)

(Use the complete structure above with all sections)

---

## 🎯 Success Criteria

A README succeeds when:

- ✅ Developer can run project locally in <10 minutes
- ✅ No "how do I..." questions for first week
- ✅ All environment variables documented with sources
- ✅ Architecture is clear without reading code
- ✅ Deployment process is repeatable
- ✅ Troubleshooting section covers 80% of issues

---

## 🔗 Resources

- [Make a README](https://www.makeareadme.com/)
- [Awesome README](https://github.com/matiassingers/awesome-readme)
- [Standard README](https://github.com/RichardLitt/standard-readme)

---

**Remember**: The goal is onboarding trivial. Every step documented, every assumption eliminated, every "why" explained.
