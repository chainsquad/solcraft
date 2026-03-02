# Solana Project Builder Agents

Comprehensive markdown-based agents for building Solana projects from scratch. Each agent is a self-contained guide that can be executed independently or as part of a complete project workflow.

## Overview

These agents are **generalized** and work with any Solana project, not just Tributary. They follow best practices for TypeScript, Anchor, and web3.js development.

## Agent Catalog

| #   | Agent                                                    | Purpose                                                                  | Lines | Size |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------ | ----- | ---- |
| 01  | [Monorepo Setup](./01-monorepo-setup-agent.md)           | Bootstrap a Solana monorepo with pnpm workspaces, TypeScript, and Anchor | 1,040 | 22KB |
| 02  | [Project Description](./02-project-description-agent.md) | Iterate on PROJECT.md through structured conversation                    | 454   | 15KB |
| 03  | [SDK Builder](./03-sdk-builder-agent.md)                 | Build a web3.js-based TypeScript SDK                                     | 1,900 | 48KB |
| 04  | [Anchor Contract](./04-anchor-contract-agent.md)         | Build Anchor-based Solana smart contracts                                | 1,526 | 35KB |
| 05  | [Testing](./05-testing-agent.md)                         | Write comprehensive integration tests using the SDK                      | 1,096 | 27KB |
| 06  | [App Builder](./06-app-builder-agent.md)                 | Build React apps with wallet integration and SDK                         | 2,239 | 54KB |
| 07  | [Documentation](./07-documentation-agent.md)             | Build MkDocs documentation with Material theme                           | 2,567 | 50KB |
| 08  | [README](./08-readme-agent.md)                           | Generate comprehensive README.md files                                   | 1,370 | 29KB |

**Total**: 12,192 lines, 280KB of comprehensive guidance

## Usage

Each agent file is a complete, self-contained guide. To use:

1. **Read the agent markdown file** to understand the workflow
2. **Follow the step-by-step instructions**
3. **Copy configuration examples** directly into your project
4. **Use the checklists** to track progress

### Recommended Workflow

```
01-monorepo-setup-agent.md
        ↓
02-project-description-agent.md
        ↓
04-anchor-contract-agent.md ←→ 03-sdk-builder-agent.md
        ↓                            ↓
05-testing-agent.md ←───────────────┘
        ↓
06-app-builder-agent.md
        ↓
07-documentation-agent.md
        ↓
08-readme-agent.md
```

## Agent Details

### 01 - Monorepo Setup Agent

**Creates**: Complete Solana monorepo structure

**Includes**:

- pnpm workspace configuration
- TypeScript strict configuration
- Anchor.toml template
- Comprehensive .gitignore
- Folder structure for programs, packages, apps, tests
- Initial program scaffold
- Dependency installation
- Verification steps

**Time**: ~15 minutes to complete setup

### 02 - Project Description Agent

**Creates**: Comprehensive PROJECT.md file

**Process**:

1. Discovery phase with targeted questions
2. Draft creation from answers
3. Iteration based on feedback
4. Polish and finalize

**Outcome**: Clear, professional project documentation for developers, investors, and collaborators

### 03 - SDK Builder Agent

**Creates**: Production-ready TypeScript SDK

**Features**:

- Main SDK class with connection/wallet management
- PDA derivation helpers
- Instruction builders
- Account fetchers with typing
- Error handling
- Build configuration (tsconfig, tsup, package.json)
- Testing utilities

**Pattern**: Instruction-first approach (returns `TransactionInstruction`)

### 04 - Anchor Contract Agent

**Creates**: Anchor-based Solana smart contract

**Covers**:

- Program structure (state, instructions, errors)
- Account structures with proper constraints
- Instruction handlers with validation
- PDA derivation patterns
- Security patterns
- Error handling
- Event emission
- Testing strategy
- Cargo.toml configuration

**Style**: Modular, well-documented Rust code

### 05 - Testing Agent

**Creates**: Comprehensive integration test suite

**Includes**:

- Jest/Mocha test structure
- Test utilities (funding, tokens, PDAs)
- Test patterns (success, errors, edge cases)
- Time-based testing
- Advanced patterns (multi-sig, CPI, concurrency)
- Configuration files
- Coverage reporting

**Approach**: SDK-first testing using the SDK instead of raw instructions

### 06 - App Builder Agent

**Creates**: React application with Solana integration

**Stack**:

- Vite or Next.js
- React with TypeScript
- @solana/wallet-adapter-react
- Tailwind CSS + shadcn/ui
- React Query or SWR
- Zustand or Jotai

**Features**:

- Wallet connection
- SDK integration
- Custom hooks
- Transaction handling
- Error management
- Responsive design

### 07 - Documentation Agent

**Creates**: MkDocs documentation site with Material theme

**Structure**:

- Landing page
- What/Why/How pages
- Architecture documentation
- Developer guides
- API reference
- FAQ
- Deployment guides

**Features**:

- Dark/light mode
- Search
- Code highlighting
- Mermaid diagrams
- Versioning support
- CI/CD deployment

### 08 - README Agent

**Creates**: Comprehensive README.md

**Sections**:

1. Project overview
2. Tech stack
3. Prerequisites
4. Getting started (detailed)
5. Architecture overview (deep dive)
6. Environment variables
7. Available scripts
8. Testing
9. Deployment
10. Troubleshooting

**Principle**: "Absurdly thorough" - assume fresh machine, no prior knowledge

## Agent Design Principles

1. **Generalized** - Not project-specific
2. **Self-contained** - All information in one file
3. **Example-rich** - Real code, not pseudo-code
4. **Step-by-step** - Sequential, trackable progress
5. **Copy-paste ready** - All configs complete
6. **Best practices** - Follow Solana ecosystem standards
7. **Security-first** - Proper keypair handling, validation
8. **Type-safe** - Strict TypeScript throughout

## Contributing

These agents are designed to be improved over time. If you find issues or have enhancements:

1. Open an issue with the agent number and description
2. Submit a PR with improved examples or clearer instructions
3. Share your experience using the agents

## License

MIT - Use freely for any Solana project

---

**Built for the Solana ecosystem** 🚀

These agents encode best practices from production Solana projects and are designed to help developers build high-quality applications quickly.
