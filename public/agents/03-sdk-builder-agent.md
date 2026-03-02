# SDK Builder Agent

Builds production-ready TypeScript SDKs for Solana programs using @solana/web3.js.

## Mission

Generate a complete, type-safe SDK that makes program interactions dead simple. No boilerplate, no guessing games - just clean APIs that work.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SDK ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │   SDK Class  │────▶│   Builders   │────▶│    PDAs      │   │
│   │              │     │              │     │              │   │
│   │ - connection │     │ - instruct() │     │ - derive()   │   │
│   │ - wallet     │     │ - fetch()    │     │ - seeds()    │   │
│   │ - config     │     │ - send()     │     │ - bump()     │   │
│   └──────────────┘     └──────────────┘     └──────────────┘   │
│          │                    │                    │            │
│          ▼                    ▼                    ▼            │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │    Types     │     │   Accounts   │     │    Utils     │   │ │
│   │              │     │              │     │              │   │
│   │ - IDL types  │     │ - fetchers   │     │ - token      │   │
│   │ - helpers    │     │ - parsers    │     │ - encoding   │   │
│   │ - configs    │     │ - mappers    │     │ - validation │   │
│   └──────────────┘     └──────────────┘     └──────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Package Structure

```
packages/sdk/
├── src/
│   ├── index.ts              # Public API surface
│   ├── sdk.ts                # Main SDK entry point
│   ├── pda.ts                # PDA derivation utilities
│   ├── types.ts              # TypeScript types & interfaces
│   ├── constants.ts          # Program ID, seeds, defaults
│   ├── utils.ts              # Shared helper functions
│   ├── token.ts              # SPL token operations
│   ├── errors.ts             # Custom error classes
│   ├── generated/            # Anchor-generated types
│   │   └── index.ts
│   ├── instructions/         # Instruction builders
│   │   ├── index.ts
│   │   ├── initialize.ts
│   │   ├── create-account.ts
│   │   └── execute.ts
│   └── accounts/             # Account fetchers & parsers
│       ├── index.ts
│       ├── config.ts
│       ├── user.ts
│       └── policy.ts
├── tests/
│   ├── sdk.test.ts
│   ├── pda.test.ts
│   └── fixtures/
│       └── mock-data.ts
├── tsconfig.json
├── tsup.config.ts
├── typedoc.json
├── package.json
└── README.md
```

---

## Core SDK Class

The main entry point. Clean constructor, wallet switching, everything accessible.

```typescript
// src/sdk.ts
import {
  Connection,
  PublicKey,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";
import { Program, Idl, AnchorProvider } from "@coral-xyz/anchor";
import { DEFAULT_COMMITMENT, PROGRAM_ID } from "./constants";
import { deriveConfigPda, deriveUserPda, derivePolicyPda } from "./pda";
import {
  initializeProgram,
  createAccount,
  executeInstruction,
} from "./instructions";
import { getConfigAccount, getUserAccount, getPolicyAccount } from "./accounts";
import { SdkError, SdkErrorCode } from "./errors";

export interface SdkConfig {
  /** RPC connection */
  connection: Connection;
  /** Wallet/signer for transactions */
  wallet: Signer;
  /** Optional program ID override */
  programId?: PublicKey;
  /** Commitment level for RPC calls */
  commitment?: "processed" | "confirmed" | "finalized";
  /** Skip preflight checks (dev only) */
  skipPreflight?: boolean;
}

export class ProgramSdk {
  /** Program ID */
  public readonly programId: PublicKey;

  /** Connection instance */
  public readonly connection: Connection;

  /** Current wallet/signer */
  private _wallet: Signer;

  /** Commitment level */
  public readonly commitment: "processed" | "confirmed" | "finalized";

  /** Skip preflight (dev mode) */
  public readonly skipPreflight: boolean;

  constructor(config: SdkConfig) {
    this.connection = config.connection;
    this._wallet = config.wallet;
    this.programId = config.programId ?? PROGRAM_ID;
    this.commitment = config.commitment ?? DEFAULT_COMMITMENT;
    this.skipPreflight = config.skipPreflight ?? false;
  }

  // ============================================================================
  // WALLET MANAGEMENT
  // ============================================================================

  /** Get current wallet public key */
  get wallet(): PublicKey {
    return this._wallet.publicKey;
  }

  /** Get current signer */
  get signer(): Signer {
    return this._wallet;
  }

  /**
   * Switch to a different wallet/signer
   * Useful for multi-wallet applications
   */
  updateWallet(wallet: Signer): void {
    this._wallet = wallet;
  }

  // ============================================================================
  // PDA DERIVATION
  // ============================================================================

  /** Derive program config PDA */
  configPda() {
    return deriveConfigPda(this.programId);
  }

  /** Derive user PDA */
  userPda(owner: PublicKey) {
    return deriveUserPda(owner, this.programId);
  }

  /** Derive policy PDA */
  policyPda(userPda: PublicKey, policyId: number) {
    return derivePolicyPda(userPda, policyId, this.programId);
  }

  // ============================================================================
  // INSTRUCTION BUILDERS
  // ============================================================================

  /**
   * Initialize program configuration
   * Returns instruction ready for transaction assembly
   */
  async initProgram(
    params: {
      admin?: PublicKey;
      feeRecipient?: PublicKey;
      feeBps?: number;
    } = {}
  ): Promise<TransactionInstruction> {
    const admin = params.admin ?? this.wallet;

    return initializeProgram({
      programId: this.programId,
      admin,
      feeRecipient: params.feeRecipient ?? admin,
      feeBps: params.feeBps ?? 0,
    });
  }

  /**
   * Create a new user account
   */
  async createUser(params: {
    owner?: PublicKey;
    mint: PublicKey;
  }): Promise<TransactionInstruction> {
    const owner = params.owner ?? this.wallet;
    const [userPda] = this.userPda(owner);
    const [configPda] = this.configPda();

    return createAccount.user({
      programId: this.programId,
      owner,
      mint: params.mint,
      userPda,
      configPda,
    });
  }

  /**
   * Create a payment policy
   */
  async createPolicy(params: {
    userPda: PublicKey;
    recipient: PublicKey;
    gateway: PublicKey;
    amount: bigint;
    interval: number;
    startTime?: number;
  }): Promise<TransactionInstruction> {
    // Get policy ID from user account
    const userAccount = await this.getUser(params.userPda);
    if (!userAccount) {
      throw new SdkError(
        SdkErrorCode.AccountNotFound,
        "User account not found"
      );
    }

    const policyId = userAccount.policyCount;
    const [policyPda] = this.policyPda(params.userPda, policyId);

    return createAccount.policy({
      programId: this.programId,
      owner: userAccount.owner,
      userPda: params.userPda,
      policyPda,
      recipient: params.recipient,
      gateway: params.gateway,
      amount: params.amount,
      interval: params.interval,
      startTime: params.startTime ?? Date.now() / 1000,
    });
  }

  /**
   * Execute a payment instruction
   */
  async executePayment(params: {
    policyPda: PublicKey;
    signer: PublicKey;
  }): Promise<TransactionInstruction> {
    return executeInstruction({
      programId: this.programId,
      policyPda: params.policyPda,
      signer: params.signer,
    });
  }

  // ============================================================================
  // CONVENIENCE METHODS (BUILD + SEND)
  // ============================================================================

  /**
   * Initialize program and send transaction
   * Convenience method that handles everything
   */
  async initProgramAndSend(params?: {
    admin?: PublicKey;
    feeRecipient?: PublicKey;
    feeBps?: number;
  }): Promise<string> {
    const ix = await this.initProgram(params);
    const tx = await this.buildTransaction([ix]);
    return this.sendTransaction(tx);
  }

  /**
   * Create user account and send transaction
   */
  async createUserAndSend(params: {
    owner?: PublicKey;
    mint: PublicKey;
  }): Promise<string> {
    const ix = await this.createUser(params);
    const tx = await this.buildTransaction([ix]);
    return this.sendTransaction(tx);
  }

  // ============================================================================
  // ACCOUNT FETCHERS
  // ============================================================================

  /** Fetch program config account */
  async getConfig(): Promise<ConfigAccount | null> {
    const [configPda] = this.configPda();
    return getConfigAccount(this.connection, configPda, this.programId);
  }

  /** Fetch user account by PDA */
  async getUser(userPda: PublicKey): Promise<UserAccount | null> {
    return getUserAccount(this.connection, userPda, this.programId);
  }

  /** Fetch user account by owner address */
  async getUserByOwner(owner: PublicKey): Promise<UserAccount | null> {
    const [userPda] = this.userPda(owner);
    return this.getUser(userPda);
  }

  /** Fetch policy account */
  async getPolicy(policyPda: PublicKey): Promise<PolicyAccount | null> {
    return getPolicyAccount(this.connection, policyPda, this.programId);
  }

  // ============================================================================
  // TRANSACTION UTILITIES
  // ============================================================================

  /**
   * Build a transaction from instructions
   * Handles recent blockhash, fee payer, etc.
   */
  async buildTransaction(
    instructions: TransactionInstruction[],
    signers: Signer[] = []
  ): Promise<Transaction> {
    const { blockhash, lastValidBlockHeight } =
      await this.connection.getLatestBlockhash(this.commitment);

    const tx = new Transaction({
      feePayer: this.wallet,
      blockhash,
      lastValidBlockHeight,
    });

    tx.add(...instructions);

    // Always sign with wallet
    tx.partialSign(this.signer);

    // Additional signers
    for (const signer of signers) {
      tx.partialSign(signer);
    }

    return tx;
  }

  /**
   * Send a transaction
   * Returns signature
   */
  async sendTransaction(transaction: Transaction): Promise<string> {
    const signature = await this.connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: this.skipPreflight,
        preflightCommitment: this.commitment,
      }
    );

    return signature;
  }

  /**
   * Send and confirm transaction
   * Returns signature after confirmation
   */
  async sendAndConfirm(
    instructions: TransactionInstruction[],
    signers: Signer[] = []
  ): Promise<string> {
    const tx = await this.buildTransaction(instructions, signers);
    const signature = await this.sendTransaction(tx);

    const result = await this.connection.confirmTransaction(
      {
        signature,
        blockhash: tx.recentBlockhash!,
        lastValidBlockHeight: tx.lastValidBlockHeight!,
      },
      this.commitment
    );

    if (result.value.err) {
      throw new SdkError(
        SdkErrorCode.TransactionFailed,
        `Transaction failed: ${JSON.stringify(result.value.err)}`
      );
    }

    return signature;
  }
}
```

---

## PDA Utilities

Consistent derivation with bump seeds. Always return both PDA and bump.

```typescript
// src/pda.ts
import { PublicKey, findProgramAddressSync } from "@solana/web3.js";

/**
 * PDA derivation result
 */
export interface PdaResult {
  pda: PublicKey;
  bump: number;
}

/**
 * Seed constants
 * Keep these consistent across program and SDK
 */
export const SEEDS = {
  CONFIG: Buffer.from("config"),
  USER: Buffer.from("user"),
  POLICY: Buffer.from("policy"),
  GATEWAY: Buffer.from("gateway"),
  DELEGATE: Buffer.from("delegate"),
} as const;

/**
 * Derive program config PDA
 * Single PDA per program instance
 */
export function deriveConfigPda(programId: PublicKey): PdaResult {
  const [pda, bump] = findProgramAddressSync([SEEDS.CONFIG], programId);
  return { pda, bump };
}

/**
 * Derive user PDA
 * Unique per owner + mint combination
 */
export function deriveUserPda(
  owner: PublicKey,
  mint: PublicKey,
  programId: PublicKey
): PdaResult {
  const [pda, bump] = findProgramAddressSync(
    [SEEDS.USER, owner.toBuffer(), mint.toBuffer()],
    programId
  );
  return { pda, bump };
}

/**
 * Derive policy PDA
 * Unique per user + policy ID
 */
export function derivePolicyPda(
  userPda: PublicKey,
  policyId: number,
  programId: PublicKey
): PdaResult {
  const policyIdBuffer = Buffer.alloc(8);
  policyIdBuffer.writeBigUInt64LE(BigInt(policyId));

  const [pda, bump] = findProgramAddressSync(
    [SEEDS.POLICY, userPda.toBuffer(), policyIdBuffer],
    programId
  );
  return { pda, bump };
}

/**
 * Derive gateway PDA
 * Unique per authority
 */
export function deriveGatewayPda(
  authority: PublicKey,
  programId: PublicKey
): PdaResult {
  const [pda, bump] = findProgramAddressSync(
    [SEEDS.GATEWAY, authority.toBuffer()],
    programId
  );
  return { pda, bump };
}

/**
 * Derive delegate PDA
 * Used for token delegation approvals
 */
export function deriveDelegatePda(
  userPda: PublicKey,
  recipient: PublicKey,
  gateway: PublicKey,
  programId: PublicKey
): PdaResult {
  const [pda, bump] = findProgramAddressSync(
    [
      SEEDS.DELEGATE,
      userPda.toBuffer(),
      recipient.toBuffer(),
      gateway.toBuffer(),
    ],
    programId
  );
  return { pda, bump };
}

/**
 * Utility: Get multiple PDAs at once
 * Useful for batch operations
 */
export function deriveMultiplePdas(
  seeds: Buffer[][],
  programId: PublicKey
): PdaResult[] {
  return seeds.map((seed) => {
    const [pda, bump] = findProgramAddressSync(seed, programId);
    return { pda, bump };
  });
}
```

---

## Instruction Builders

Parameter objects for clarity. Return instructions ready for assembly.

```typescript
// src/instructions/initialize.ts
import {
  PublicKey,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { serializeInitializeInstruction } from "../generated";
import { deriveConfigPda } from "../pda";
import { SdkError, SdkErrorCode } from "../errors";

export interface InitializeParams {
  programId: PublicKey;
  admin: PublicKey;
  feeRecipient: PublicKey;
  feeBps: number;
}

/**
 * Build initialize instruction
 * Creates the program config account
 */
export function buildInitializeInstruction(
  params: InitializeParams
): TransactionInstruction {
  // Validate inputs
  if (params.feeBps < 0 || params.feeBps > 10000) {
    throw new SdkError(
      SdkErrorCode.InvalidInput,
      "feeBps must be between 0 and 10000"
    );
  }

  // Derive PDAs
  const { pda: configPda, bump } = deriveConfigPda(params.programId);

  // Build accounts array
  const keys = [
    { pubkey: params.admin, isSigner: true, isWritable: true },
    { pubkey: configPda, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  // Build instruction data
  const data = serializeInitializeInstruction({
    feeBps: params.feeBps,
    feeRecipient: params.feeRecipient,
    bump,
  });

  return new TransactionInstruction({
    keys,
    programId: params.programId,
    data,
  });
}
```

```typescript
// src/instructions/create-account.ts
import {
  PublicKey,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { serializeCreateUserInstruction } from "../generated";
import { deriveUserPda, deriveDelegatePda } from "../pda";
import { getAssociatedTokenAddress } from "@solana/spl-token";

export interface CreateUserParams {
  programId: PublicKey;
  owner: PublicKey;
  mint: PublicKey;
  userPda: PublicKey;
  configPda: PublicKey;
}

/**
 * Build create user instruction
 * Creates user account with associated token info
 */
export function buildCreateUserInstruction(
  params: CreateUserParams
): TransactionInstruction {
  const { owner, mint, programId, userPda, configPda } = params;

  // Get associated token account for owner
  const ownerAta = getAssociatedTokenAddressSync(mint, owner);

  // Derive delegate PDA for future approvals
  const { bump: delegateBump } = deriveDelegatePda(
    userPda,
    PublicKey.default, // placeholder
    PublicKey.default, // placeholder
    programId
  );

  const keys = [
    { pubkey: owner, isSigner: true, isWritable: true },
    { pubkey: userPda, isSigner: false, isWritable: true },
    { pubkey: configPda, isSigner: false, isWritable: false },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: ownerAta, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
  ];

  const data = serializeCreateUserInstruction({
    delegateBump,
  });

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}
```

```typescript
// src/instructions/execute.ts
import {
  PublicKey,
  TransactionInstruction,
  SYSVAR_CLOCK_PUBKEY,
} from "@solana/web3.js";
import { serializeExecuteInstruction } from "../generated";

export interface ExecutePaymentParams {
  programId: PublicKey;
  policyPda: PublicKey;
  signer: PublicKey;
}

/**
 * Build execute payment instruction
 * Permissionless - anyone can execute when due
 */
export function buildExecutePaymentInstruction(
  params: ExecutePaymentParams
): TransactionInstruction {
  const { programId, policyPda, signer } = params;

  const keys = [
    { pubkey: policyPda, isSigner: false, isWritable: true },
    { pubkey: signer, isSigner: true, isWritable: false },
    { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
  ];

  const data = serializeExecuteInstruction({});

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}

/**
 * Build multiple execute instructions
 * For batch payment processing
 */
export function buildBatchExecuteInstructions(
  policies: ExecutePaymentParams[]
): TransactionInstruction[] {
  return policies.map(buildExecutePaymentInstruction);
}
```

---

## Account Fetchers

Graceful handling of missing accounts. Proper typing throughout.

```typescript
// src/accounts/config.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { deserializeConfigAccount } from "../generated";
import { ConfigAccount } from "../types";

export interface RawConfigAccount {
  admin: PublicKey;
  feeRecipient: PublicKey;
  feeBps: number;
  bump: number;
  emergencyPause: boolean;
}

/**
 * Fetch and deserialize config account
 * Returns null if account doesn't exist
 */
export async function getConfigAccount(
  connection: Connection,
  configPda: PublicKey,
  programId: PublicKey
): Promise<ConfigAccount | null> {
  try {
    const accountInfo = await connection.getAccountInfo(configPda);

    if (!accountInfo) {
      return null;
    }

    // Validate owner
    if (!accountInfo.owner.equals(programId)) {
      console.warn(
        `Config account owned by ${accountInfo.owner.toBase58()}, expected ${programId.toBase58()}`
      );
      return null;
    }

    // Deserialize
    const raw = deserializeConfigAccount(accountInfo.data);

    return {
      publicKey: configPda,
      admin: raw.admin,
      feeRecipient: raw.feeRecipient,
      feeBps: raw.feeBps,
      bump: raw.bump,
      emergencyPause: raw.emergencyPause,
    };
  } catch (error) {
    console.error("Failed to fetch config account:", error);
    return null;
  }
}

/**
 * Fetch multiple accounts in batch
 */
export async function getMultipleConfigAccounts(
  connection: Connection,
  configPdas: PublicKey[],
  programId: PublicKey
): Promise<(ConfigAccount | null)[]> {
  const accounts = await connection.getMultipleAccountsInfo(configPdas);

  return accounts.map((account, index) => {
    if (!account) return null;
    if (!account.owner.equals(programId)) return null;

    try {
      const raw = deserializeConfigAccount(account.data);
      return {
        publicKey: configPdas[index],
        ...raw,
      };
    } catch {
      return null;
    }
  });
}
```

```typescript
// src/accounts/user.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { deserializeUserAccount } from "../generated";
import { UserAccount, PolicySummary } from "../types";

/**
 * Fetch user account with policy summaries
 */
export async function getUserAccount(
  connection: Connection,
  userPda: PublicKey,
  programId: PublicKey
): Promise<UserAccount | null> {
  const accountInfo = await connection.getAccountInfo(userPda);

  if (!accountInfo || !accountInfo.owner.equals(programId)) {
    return null;
  }

  const raw = deserializeUserAccount(accountInfo.data);

  return {
    publicKey: userPda,
    owner: raw.owner,
    mint: raw.mint,
    policyCount: raw.policyCount,
    totalPaid: raw.totalPaid.toBigInt(),
    createdAt: raw.createdAt.toNumber(),
    bump: raw.bump,
  };
}

/**
 * Fetch user account with all policies
 * Makes additional calls to fetch policy accounts
 */
export async function getUserWithPolicies(
  connection: Connection,
  userPda: PublicKey,
  programId: PublicKey
): Promise<UserAccount & { policies: PolicySummary[] }> {
  const user = await getUserAccount(connection, userPda, programId);

  if (!user) {
    throw new Error("User account not found");
  }

  // Fetch policy PDAs
  const policyPdas = await derivePolicyPdas(
    userPda,
    user.policyCount,
    programId
  );

  // Batch fetch policies
  const policies = await getMultiplePolicyAccounts(
    connection,
    policyPdas,
    programId
  );

  return {
    ...user,
    policies: policies.filter((p): p is PolicySummary => p !== null),
  };
}
```

---

## Types

Export generated types with helper additions.

```typescript
// src/types.ts
import { PublicKey } from "@solana/web3.js";

// Re-export generated types
export type {
  ConfigAccount as ConfigAccountRaw,
  UserAccount as UserAccountRaw,
  PolicyAccount as PolicyAccountRaw,
} from "./generated";

/**
 * Config account with PDA
 */
export interface ConfigAccount {
  publicKey: PublicKey;
  admin: PublicKey;
  feeRecipient: PublicKey;
  feeBps: number;
  bump: number;
  emergencyPause: boolean;
}

/**
 * User account with PDA
 */
export interface UserAccount {
  publicKey: PublicKey;
  owner: PublicKey;
  mint: PublicKey;
  policyCount: number;
  totalPaid: bigint;
  createdAt: number;
  bump: number;
}

/**
 * Policy account with PDA
 */
export interface PolicyAccount {
  publicKey: PublicKey;
  userPda: PublicKey;
  recipient: PublicKey;
  gateway: PublicKey;
  amount: bigint;
  interval: number;
  nextPaymentDue: number;
  totalPaid: bigint;
  paymentsCount: number;
  active: boolean;
  bump: number;
}

/**
 * Policy summary for listings
 */
export interface PolicySummary {
  publicKey: PublicKey;
  recipient: PublicKey;
  amount: bigint;
  interval: number;
  active: boolean;
  nextPaymentDue: number;
}

/**
 * Payment history entry
 */
export interface PaymentRecord {
  signature: string;
  amount: bigint;
  timestamp: number;
  recipient: PublicKey;
}

/**
 * Gateway account
 */
export interface GatewayAccount {
  publicKey: PublicKey;
  authority: PublicKey;
  signer: PublicKey;
  feeBps: number;
  totalProcessed: bigint;
  bump: number;
}

/**
 * Instruction parameters (object-based for clarity)
 */
export type InitParams = {
  admin?: PublicKey;
  feeRecipient?: PublicKey;
  feeBps?: number;
};

export type CreateUserParams = {
  owner?: PublicKey;
  mint: PublicKey;
};

export type CreatePolicyParams = {
  userPda: PublicKey;
  recipient: PublicKey;
  gateway: PublicKey;
  amount: bigint;
  interval: number;
  startTime?: number;
};

export type ExecuteParams = {
  policyPda: PublicKey;
  signer?: PublicKey;
};

/**
 * Transaction result
 */
export interface TransactionResult {
  signature: string;
  slot?: number;
  error?: string;
}

/**
 * SDK options
 */
export interface SdkOptions {
  commitment?: "processed" | "confirmed" | "finalized";
  skipPreflight?: boolean;
  maxRetries?: number;
}
```

---

## Error Handling

Custom error classes with codes. Parse program errors.

```typescript
// src/errors.ts

export enum SdkErrorCode {
  // Account errors
  AccountNotFound = "ACCOUNT_NOT_FOUND",
  AccountDeserializationFailed = "ACCOUNT_DESERIALIZATION_FAILED",
  InvalidAccountOwner = "INVALID_ACCOUNT_OWNER",

  // Transaction errors
  TransactionFailed = "TRANSACTION_FAILED",
  TransactionSimulationFailed = "TRANSACTION_SIMULATION_FAILED",
  SignatureVerificationFailed = "SIGNATURE_VERIFICATION_FAILED",

  // Input validation
  InvalidInput = "INVALID_INPUT",
  InvalidAmount = "INVALID_AMOUNT",
  InvalidAddress = "INVALID_ADDRESS",

  // Program errors
  ProgramError = "PROGRAM_ERROR",
  DelegateNotApproved = "DELEGATE_NOT_APPROVED",
  InsufficientBalance = "INSUFFICIENT_BALANCE",
  PaymentNotDue = "PAYMENT_NOT_DUE",
  EmergencyPause = "EMERGENCY_PAUSE",

  // Network errors
  RpcError = "RPC_ERROR",
  Timeout = "TIMEOUT",
}

export class SdkError extends Error {
  public readonly code: SdkErrorCode;
  public readonly details?: unknown;

  constructor(code: SdkErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "SdkError";
    this.code = code;
    this.details = details;
  }

  /**
   * Create from Anchor error
   */
  static fromAnchorError(error: unknown): SdkError {
    if (typeof error !== "object" || error === null) {
      return new SdkError(SdkErrorCode.ProgramError, "Unknown error");
    }

    const anchorError = error as {
      error?: { errorCode?: { code?: string }; errorMessage?: string };
    };

    const code = anchorError.error?.errorCode?.code;
    const message = anchorError.error?.errorMessage ?? "Anchor error";

    // Map Anchor error codes to SDK codes
    switch (code) {
      case "DelegateNotApproved":
        return new SdkError(SdkErrorCode.DelegateNotApproved, message);
      case "InsufficientBalance":
        return new SdkError(SdkErrorCode.InsufficientBalance, message);
      case "PaymentNotDue":
        return new SdkError(SdkErrorCode.PaymentNotDue, message);
      case "EmergencyPause":
        return new SdkError(SdkErrorCode.EmergencyPause, message);
      default:
        return new SdkError(SdkErrorCode.ProgramError, message, error);
    }
  }

  /**
   * Check if error is specific type
   */
  is(code: SdkErrorCode): boolean {
    return this.code === code;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Parse transaction error from simulation
 */
export function parseSimulationError(logs: string[]): SdkError | null {
  for (const log of logs.reverse()) {
    if (log.includes("failed:")) {
      const match = log.match(/failed: (.+)/);
      if (match) {
        return new SdkError(
          SdkErrorCode.TransactionSimulationFailed,
          match[1],
          { logs }
        );
      }
    }
  }
  return null;
}
```

---

## Token Utilities

SPL token helpers for common operations.

```typescript
// src/token.ts
import {
  Connection,
  PublicKey,
  Signer,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  approve,
  revoke,
  getApproval,
  Account,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";

/**
 * Get or create associated token account
 * Returns ATA address and instruction if needed
 */
export async function getOrCreateATA(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey
): Promise<{
  address: PublicKey;
  instruction: TransactionInstruction | null;
}> {
  const address = await getAssociatedTokenAddress(mint, owner);
  const account = await connection.getAccountInfo(address);

  if (account) {
    return { address, instruction: null };
  }

  const instruction = createAssociatedTokenAccountInstruction(
    payer,
    address,
    owner,
    mint
  );

  return { address, instruction };
}

/**
 * Approve delegate for token spending
 */
export async function approveDelegate(params: {
  connection: Connection;
  tokenAccount: PublicKey;
  delegate: PublicKey;
  amount: bigint;
  owner: Signer;
}): Promise<TransactionInstruction> {
  return approve(
    params.connection,
    params.owner,
    params.tokenAccount,
    params.delegate,
    params.owner,
    params.amount
  );
}

/**
 * Revoke delegate approval
 */
export async function revokeDelegate(params: {
  connection: Connection;
  tokenAccount: PublicKey;
  owner: Signer;
}): Promise<TransactionInstruction> {
  return revoke(
    params.connection,
    params.owner,
    params.tokenAccount,
    params.owner
  );
}

/**
 * Check if delegate is approved for amount
 */
export async function checkDelegateApproval(params: {
  connection: Connection;
  tokenAccount: PublicKey;
  delegate: PublicKey;
  requiredAmount: bigint;
}): Promise<boolean> {
  try {
    const account = await getAccount(params.connection, params.tokenAccount);

    // Check if delegate is set
    if (!account.delegate?.equals(params.delegate)) {
      return false;
    }

    // Check approval amount
    const delegation = await getApproval(
      params.connection,
      params.tokenAccount
    );

    return delegation.amount >= BigInt(params.requiredAmount.toString());
  } catch {
    return false;
  }
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: bigint | BN | number,
  decimals: number
): string {
  const amountBigInt =
    typeof amount === "bigint" ? amount : new BN(amount).toBigInt();

  const divisor = BigInt(10 ** decimals);
  const integerPart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;

  const fractionalStr = fractionalPart
    .toString()
    .padStart(decimals, "0")
    .slice(0, decimals);

  return `${integerPart}.${fractionalStr}`.replace(/\.?0+$/, "");
}

/**
 * Parse token amount to raw units
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  const [integer, fractional = ""] = amount.split(".");
  const paddedFractional = fractional.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(integer + paddedFractional);
}
```

---

## Constants

Program ID, seeds, defaults.

```typescript
// src/constants.ts
import { PublicKey } from "@solana/web3.js";

/**
 * Program ID
 * Override via constructor for different deployments
 */
export const PROGRAM_ID = new PublicKey("YOUR_PROGRAM_ID_HERE");

/**
 * Default commitment level
 */
export const DEFAULT_COMMITMENT = "confirmed" as const;

/**
 * Account sizes (with padding)
 */
export const ACCOUNT_SIZES = {
  CONFIG: 256,
  USER: 512,
  POLICY: 512,
  GATEWAY: 256,
  DELEGATE: 128,
} as const;

/**
 * Fee constants
 */
export const FEES = {
  MAX_BPS: 10000,
  PROTOCOL_FEE_BPS: 100, // 1%
  MIN_INTERVAL: 3600, // 1 hour
} as const;

/**
 * Network endpoints
 */
export const RPC_ENDPOINTS = {
  MAINNET: "https://api.mainnet-beta.solana.com",
  DEVNET: "https://api.devnet.solana.com",
  LOCALNET: "http://localhost:8899",
} as const;
```

---

## Utilities

Shared helper functions.

```typescript
// src/utils.ts
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

/**
 * Validate Solana address
 */
export function isValidPublicKey(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert timestamp to readable date
 */
export function timestampToDate(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Convert BN to bigint safely
 */
export function bnToBigInt(bn: BN): bigint {
  return BigInt(bn.toString());
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts - 1) {
        await sleep(delayMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Compute interval string from seconds
 */
export function formatInterval(seconds: number): string {
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const { label, seconds: s } of intervals) {
    const count = Math.floor(seconds / s);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? "s" : ""}`;
    }
  }

  return `${seconds} seconds`;
}

/**
 * Compact public key display
 */
export function compactAddress(address: PublicKey | string): string {
  const str = typeof address === "string" ? address : address.toBase58();
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}
```

---

## Public Exports

Clean API surface.

```typescript
// src/index.ts

// Main SDK class
export { ProgramSdk } from "./sdk";
export type { SdkConfig, SdkOptions, TransactionResult } from "./sdk";

// Types
export type {
  ConfigAccount,
  UserAccount,
  PolicyAccount,
  PolicySummary,
  GatewayAccount,
  PaymentRecord,
  InitParams,
  CreateUserParams,
  CreatePolicyParams,
  ExecuteParams,
} from "./types";

// PDA utilities
export {
  deriveConfigPda,
  deriveUserPda,
  derivePolicyPda,
  deriveGatewayPda,
  deriveDelegatePda,
  deriveMultiplePdas,
  SEEDS,
} from "./pda";
export type { PdaResult } from "./pda";

// Instruction builders
export {
  buildInitializeInstruction,
  buildCreateUserInstruction,
  buildExecutePaymentInstruction,
  buildBatchExecuteInstructions,
} from "./instructions";

// Account fetchers
export {
  getConfigAccount,
  getUserAccount,
  getUserWithPolicies,
  getPolicyAccount,
  getGatewayAccount,
} from "./accounts";

// Errors
export { SdkError, SdkErrorCode, parseSimulationError } from "./errors";

// Token utilities
export {
  getOrCreateATA,
  approveDelegate,
  revokeDelegate,
  checkDelegateApproval,
  formatTokenAmount,
  parseTokenAmount,
} from "./token";

// Constants
export {
  PROGRAM_ID,
  DEFAULT_COMMITMENT,
  ACCOUNT_SIZES,
  FEES,
  RPC_ENDPOINTS,
} from "./constants";

// Utilities
export {
  isValidPublicKey,
  timestampToDate,
  bnToBigInt,
  sleep,
  retry,
  formatInterval,
  compactAddress,
} from "./utils";
```

---

## Build Configuration

### TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Bundler Config (tsup)

```typescript
// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false, // Keep readable for debugging
  external: ["@solana/web3.js", "@solana/spl-token", "@coral-xyz/anchor"],
  outDir: "dist",
  banner: {
    js: "// @ts-ignore",
  },
});
```

### Package.json

```json
{
  "name": "@org/sdk",
  "version": "0.1.0",
  "description": "TypeScript SDK for Solana program",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "docs": "typedoc src/index.ts",
    "prepublishOnly": "pnpm run build"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.29.0",
    "@solana/spl-token": "^0.4.0",
    "@solana/web3.js": "^1.91.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typedoc": "^0.25.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "peerDependencies": {
    "@coral-xyz/anchor": "^0.29.0",
    "@solana/spl-token": "^0.4.0",
    "@solana/web3.js": "^1.91.0"
  },
  "engines": {
    "node": ">=18"
  },
  "keywords": ["solana", "sdk", "web3", "blockchain"],
  "license": "MIT"
}
```

### TypeDoc Config

```json
// typedoc.json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs",
  "plugin": ["typedoc-plugin-markdown"],
  "readme": "README.md",
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeExternals": true,
  "includeVersion": true,
  "gitRevision": "main"
}
```

---

## Testing Utilities

### Mock Connection

```typescript
// tests/fixtures/mock-connection.ts
import { Connection, PublicKey, AccountInfo } from "@solana/web3.js";

/**
 * Mock connection for testing
 */
export class MockConnection {
  private accounts = new Map<string, AccountInfo<Buffer>>();

  async getAccountInfo(
    publicKey: PublicKey
  ): Promise<AccountInfo<Buffer> | null> {
    const key = publicKey.toBase58();
    return this.accounts.get(key) ?? null;
  }

  async getMultipleAccountsInfo(
    publicKeys: PublicKey[]
  ): Promise<(AccountInfo<Buffer> | null)[]> {
    return publicKeys.map((pk) => this.accounts.get(pk.toBase58()) ?? null);
  }

  setAccount(publicKey: PublicKey, account: AccountInfo<Buffer>): void {
    this.accounts.set(publicKey.toBase58(), account);
  }

  clear(): void {
    this.accounts.clear();
  }
}
```

### Mock Wallet

```typescript
// tests/fixtures/mock-wallet.ts
import { Keypair, Signer } from "@solana/web3.js";

/**
 * Create mock wallet/signer for testing
 */
export function createMockWallet(): Signer {
  return Keypair.generate();
}

/**
 * Create wallet from secret key
 */
export function walletFromSecretKey(secretKey: Uint8Array): Signer {
  return Keypair.fromSecretKey(secretKey);
}
```

### Test Fixtures

```typescript
// tests/fixtures/mock-data.ts
import { PublicKey, Keypair } from "@solana/web3.js";
import { ConfigAccount, UserAccount, PolicyAccount } from "../../src/types";

export const MOCK_PROGRAM_ID = new PublicKey(
  "MockProgram1111111111111111111111111111111"
);

export const mockConfigAccount: ConfigAccount = {
  publicKey: Keypair.generate().publicKey,
  admin: Keypair.generate().publicKey,
  feeRecipient: Keypair.generate().publicKey,
  feeBps: 100,
  bump: 254,
  emergencyPause: false,
};

export const mockUserAccount: UserAccount = {
  publicKey: Keypair.generate().publicKey,
  owner: Keypair.generate().publicKey,
  mint: Keypair.generate().publicKey,
  policyCount: 3,
  totalPaid: BigInt(1000000000),
  createdAt: Date.now() / 1000,
  bump: 253,
};

export const mockPolicyAccount: PolicyAccount = {
  publicKey: Keypair.generate().publicKey,
  userPda: mockUserAccount.publicKey,
  recipient: Keypair.generate().publicKey,
  gateway: Keypair.generate().publicKey,
  amount: BigInt(100000),
  interval: 86400, // daily
  nextPaymentDue: Date.now() / 1000 + 86400,
  totalPaid: BigInt(500000),
  paymentsCount: 5,
  active: true,
  bump: 252,
};
```

---

## Usage Examples

### Basic Usage

```typescript
import { Connection, Keypair } from "@solana/web3.js";
import { ProgramSdk } from "@org/sdk";
import secretKey from "./wallet.json";

// Setup
const connection = new Connection("https://api.devnet.solana.com");
const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

// Initialize SDK
const sdk = new ProgramSdk({
  connection,
  wallet,
});

// Initialize program
await sdk.initProgramAndSend({
  feeBps: 100, // 1%
});

// Create user account
await sdk.createUserAndSend({
  mint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
});

// Create policy
const [userPda] = sdk.userPda(wallet.publicKey);
await sdk.sendAndConfirm([
  await sdk.createPolicy({
    userPda,
    recipient: new PublicKey("RecipientAddress..."),
    gateway: new PublicKey("GatewayAddress..."),
    amount: BigInt(100000), // 0.1 USDC
    interval: 86400, // daily
  }),
]);
```

### Fetching Accounts

```typescript
// Fetch config
const config = await sdk.getConfig();
console.log("Admin:", config?.admin.toBase58());
console.log("Fee:", config?.feeBps, "bps");

// Fetch user by owner
const user = await sdk.getUserByOwner(wallet.publicKey);
console.log("Policies:", user?.policyCount);

// Fetch user with policies
const userWithPolicies = await sdk.getUserWithPolicies(user!.publicKey);
userWithPolicies.policies.forEach((policy) => {
  console.log(`Policy ${policy.publicKey.toBase58()}:`);
  console.log(`  Amount: ${policy.amount}`);
  console.log(`  Active: ${policy.active}`);
});
```

### Advanced: Manual Transaction Building

```typescript
import { Transaction } from "@solana/web3.js";

// Build instructions separately
const initIx = await sdk.initProgram();
const userIx = await sdk.createUser({ mint });

// Add to transaction manually
const tx = new Transaction();
tx.add(initIx);
tx.add(userIx);

// Send with additional signers
const signature = await sdk.sendAndConfirm(
  [initIx, userIx],
  [additionalSigner]
);
```

---

## Checklist

Before shipping, verify:

- [ ] All instructions have typed builders
- [ ] All accounts have fetchers with null handling
- [ ] PDAs derived consistently with program
- [ ] Error classes cover all failure modes
- [ ] Token utilities tested with various decimals
- [ ] Build outputs ESM + CJS
- [ ] TypeScript strict mode passes
- [ ] TypeDoc generated
- [ ] README with examples included
- [ ] Package exports configured correctly
- [ ] Peer dependencies declared

---

## Ship It

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ████████╗██╗  ██╗███████╗                                   ║
║   ╚══██╔══╝██║  ██║██╔════╝                                   ║
║      ██║   ███████║█████╗                                     ║
║      ██║   ██╔══██║██╔══╝                                     ║
║      ██║   ██║  ██║███████╗                                   ║
║      ╚═╝   ╚═╝  ╚═╝╚══════╝                                   ║
║                                                               ║
║   ███████╗ ██████╗ ██╗  ██╗██████╗  ██████╗ ███████╗          ║
║   ██╔════╝██╔═══██╗╚██╗██╔╝██╔══██╗██╔═══██╗██╔════╝          ║
║   █████╗  ██║   ██║ ╚███╔╝ ██████╔╝██║   ██║███████╗          ║
║   ██╔══╝  ██║   ██║ ██╔██╗ ██╔══██╗██║   ██║╚════██║          ║
║   ██║     ╚██████╔╝██╔╝ ██╗██║  ██║╚██████╔╝███████║          ║
║   ╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝          ║
║                                                               ║
║   ██████╗  ██████╗ ██████╗  ██████╗                           ║
║   ██╔════╝ ██╔═══██╗██╔══██╗██╔═══██╗                          ║
║   ██║  ███╗██║   ██║██║  ██║██║   ██║                          ║
║   ██║   ██║██║   ██║██║  ██║██║   ██║                          ║
║   ╚██████╔╝╚██████╔╝██████╔╝╚██████╔╝                          ║
║    ╚═════╝  ╚═════╝ ╚═════╝  ╚═════╝                           ║
║                                                               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Type-safe SDKs make devs happy. Happy devs ship faster.      ║
║                                                               ║
║  Now go build something awesome. 🚀                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```
