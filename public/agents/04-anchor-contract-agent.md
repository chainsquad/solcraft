# Anchor Contract Development Agent

> Generalized Solana smart contract development using the Anchor framework

---

## Mission

Build secure, well-structured Anchor programs with proper account validation, PDA management, error handling, and comprehensive testing. Focus on modular architecture and gas optimization.

---

## Anchor Program Structure

```
programs/<program-name>/
├── Cargo.toml              # Dependencies and features
├── Xargo.toml              # Cross-compilation config (if needed)
└── src/
    ├── lib.rs              # Program entrypoint and module exports
    ├── state/              # Account structures
    │   ├── mod.rs          # Module exports
    │   └── *.rs            # Individual account definitions
    ├── instructions/       # Instruction handlers
    │   ├── mod.rs          # Module exports
    │   └── *.rs            # Individual instruction handlers
    ├── error.rs            # Custom error codes
    ├── constants.rs        # Program constants
    └── utils.rs            # Helper functions
```

### lib.rs Template

```rust
//! # Program Name
//!
//! Brief description of what this program does.

use anchor_lang::prelude::*;

// Module declarations
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod utils;

// Re-exports for convenience
pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;

// Program ID - replace with your deployed ID
declare_id!("YourProgramId1111111111111111111111111111");

#[program]
pub mod program_name {
    use super::*;

    /// Initialize the program configuration
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    /// Example instruction with arguments
    pub fn create_item(
        ctx: Context<CreateItem>,
        name: String,
        value: u64,
    ) -> Result<()> {
        instructions::create_item::handler(ctx, name, value)
    }
}
```

---

## Account Structures

### Basic Account with InitSpace

```rust
use anchor_lang::prelude::*;

/// User profile account
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    /// Authority who owns this profile
    pub authority: Pubkey,

    /// User's display name
    #[max_len(32)]
    pub name: String,

    /// Profile creation timestamp
    pub created_at: i64,

    /// Last update timestamp
    pub updated_at: i64,

    /// User's score or reputation
    pub score: u64,

    /// PDA bump seed for CPI optimization
    pub bump: u8,

    /// Reserved space for future upgrades
    pub _reserved: [u8; 64],
}
```

### Account with Enums

```rust
/// Account status enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum AccountStatus {
    Active,
    Paused,
    Frozen,
    Closed,
}

/// Payment account with status
#[account]
#[derive(InitSpace)]
pub struct PaymentAccount {
    pub owner: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub interval: i64,        // Payment interval in seconds
    pub next_payment: i64,    // Unix timestamp
    pub status: AccountStatus,
    pub bump: u8,
    pub _padding: [u8; 128],  // Large padding for future fields
}
```

### Account with Collections

```rust
/// Treasury account with multiple recipients
#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub authority: Pubkey,

    /// List of fee recipients with their shares
    #[max_len(10)]
    pub recipients: Vec<FeeRecipient>,

    /// Total basis points (10000 = 100%)
    pub total_bps: u16,

    pub bump: u8,
}

/// Fee recipient structure
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct FeeRecipient {
    pub address: Pubkey,
    pub basis_points: u16,  // Share of fees (100 = 1%)
}
```

### state/mod.rs

```rust
pub mod user_profile;
pub mod payment_account;
pub mod treasury;

pub use user_profile::*;
pub use payment_account::*;
pub use treasury::*;
```

---

## Instruction Handlers

### Basic Instruction Pattern

```rust
// instructions/initialize.rs
use anchor_lang::prelude::*;
use crate::{state::*, constants::*};

/// Accounts for initialization
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// Admin authority (payer and config authority)
    #[account(
        init,
        payer = admin,
        space = 8 + ProgramConfig::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, ProgramConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

/// Initialize the program config
pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.config;

    config.authority = ctx.accounts.admin.key();
    config.bump = ctx.bumps.config;
    config.paused = false;
    config.fee_bps = DEFAULT_FEE_BPS;

    emit!(ProgramInitialized {
        authority: config.authority,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

### Instruction with Arguments

```rust
// instructions/create_item.rs
use anchor_lang::prelude::*;
use crate::{state::*, error::*, constants::*};

#[derive(Accounts)]
#[instruction(name: String, value: u64)]
pub struct CreateItem<'info> {
    /// Item account to create
    #[account(
        init,
        payer = authority,
        space = 8 + Item::INIT_SPACE,
        seeds = [
            ITEM_SEED,
            authority.key().as_ref(),
            &name.as_bytes()
        ],
        bump
    )]
    pub item: Account<'info, Item>,

    /// Authority creating the item
    #[account(
        mut,
        // Optional: check if authority is whitelisted
        // constraint = authority.key() == config.allowed_creator @ CustomError::Unauthorized
    )]
    pub authority: Signer<'info>,

    /// Program config for global settings
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = !config.paused @ CustomError::ProgramPaused
    )]
    pub config: Account<'info, ProgramConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateItem>, name: String, value: u64) -> Result<()> {
    // Validate inputs
    require!(name.len() >= 3, CustomError::NameTooShort);
    require!(name.len() <= 32, CustomError::NameTooLong);
    require!(value > 0, CustomError::InvalidValue);

    let item = &mut ctx.accounts.item;

    item.authority = ctx.accounts.authority.key();
    item.name = name.clone();
    item.value = value;
    item.bump = ctx.bumps.item;
    item.created_at = Clock::get()?.unix_timestamp;

    emit!(ItemCreated {
        authority: item.authority,
        item: item.key(),
        name,
        value,
    });

    Ok(())
}
```

### Complex Instruction with CPI

```rust
// instructions/transfer_item.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, Token, TokenAccount};
use crate::{state::*, error::*, constants::*};

#[derive(Accounts)]
pub struct TransferItem<'info> {
    /// Item being transferred
    #[account(
        mut,
        seeds = [
            ITEM_SEED,
            current_owner.key().as_ref(),
            &item.name.as_bytes()
        ],
        bump = item.bump,
        has_one = current_owner @ CustomError::NotOwner,
        constraint = item.is_transferrable @ CustomError::NotTransferrable
    )]
    pub item: Account<'info, Item>,

    /// Current owner (must sign)
    #[account(mut)]
    pub current_owner: Signer<'info>,

    /// New owner
    /// CHECK: We're only using this as a pubkey reference
    pub new_owner: AccountInfo<'info>,

    /// Optional token payment for transfer
    #[account(
        mut,
        constraint = payment_mint.key() == item.payment_mint @ CustomError::InvalidMint
    )]
    pub payment_account: Option<Account<'info, TokenAccount>>,

    /// Destination for payment
    #[account(
        mut,
        constraint = payment_destination.owner == item.treasury @ CustomError::InvalidDestination
    )]
    pub payment_destination: Option<Account<'info, TokenAccount>>,

    /// Token program for payment transfer
    pub token_program: Program<'info, Token>,

    /// Program config
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, ProgramConfig>,
}

pub fn handler(ctx: Context<TransferItem>) -> Result<()> {
    let item = &mut ctx.accounts.item;

    // Handle optional payment
    if let (Some(payment), Some(destination)) =
        (&ctx.accounts.payment_account, &ctx.accounts.payment_destination)
    {
        let transfer_fee = item.transfer_fee;

        require!(transfer_fee > 0, CustomError::NoPaymentRequired);

        // CPI to transfer tokens
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from: payment.to_account_info(),
            to: destination.to_account_info(),
            authority: ctx.accounts.current_owner.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, transfer_fee)?;
    }

    // Update item ownership
    let old_owner = item.owner;
    item.owner = ctx.accounts.new_owner.key();
    item.transferred_at = Clock::get()?.unix_timestamp;

    emit!(ItemTransferred {
        item: item.key(),
        from: old_owner,
        to: item.owner,
        timestamp: item.transferred_at,
    });

    Ok(())
}
```

### instructions/mod.rs

```rust
pub mod initialize;
pub mod create_item;
pub mod transfer_item;
pub mod update_config;
pub mod close_item;

pub use initialize::*;
pub use create_item::*;
pub use transfer_item::*;
pub use update_config::*;
pub use close_item::*;
```

---

## PDA Derivation

### Consistent Seed Patterns

```rust
// constants.rs
/// Seed for program config PDA
pub const CONFIG_SEED: &[u8] = b"config";

/// Seed for user profile PDA
pub const USER_SEED: &[u8] = b"user";

/// Seed for item PDA
pub const ITEM_SEED: &[u8] = b"item";

/// Seed for vault PDA
pub const VAULT_SEED: &[u8] = b"vault";
```

### PDA Helper Functions

```rust
// utils.rs
use anchor_lang::prelude::*;
use crate::constants::*;

/// Derive program config PDA
pub fn find_config_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[CONFIG_SEED], program_id)
}

/// Derive user profile PDA
pub fn find_user_pda(program_id: &Pubkey, authority: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[USER_SEED, authority.as_ref()],
        program_id,
    )
}

/// Derive item PDA
pub fn find_item_pda(program_id: &Pubkey, owner: &Pubkey, name: &[u8]) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[ITEM_SEED, owner.as_ref(), name],
        program_id,
    )
}

/// Derive vault PDA for a specific mint
pub fn find_vault_pda(program_id: &Pubkey, mint: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[VAULT_SEED, mint.as_ref()],
        program_id,
    )
}

/// Generate signer seeds for CPI
pub fn get_config_signer_seeds(bump: u8) -> Vec<Vec<u8>> {
    vec![
        CONFIG_SEED.to_vec(),
        vec![bump],
    ]
}

/// Generate signer seeds with additional seeds
pub fn get_signer_seeds_with_bump(seeds: &[&[u8]], bump: u8) -> Vec<Vec<u8>> {
    let mut result: Vec<Vec<u8>> = seeds.iter().map(|s| s.to_vec()).collect();
    result.push(vec![bump]);
    result
}
```

### Using Seeds in Instructions

```rust
#[derive(Accounts)]
#[instruction(user_id: u64)]
pub struct CreateUser<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + User::INIT_SPACE,
        seeds = [
            USER_SEED,
            authority.key().as_ref(),
            &user_id.to_le_bytes()
        ],
        bump
    )]
    pub user: Account<'info, User>,

    // ... other accounts
}
```

### CPI with Signer Seeds

```rust
// When making a CPI where a PDA needs to sign
pub fn handler(ctx: Context<SomeInstruction>) -> Result<()> {
    let bump = ctx.accounts.vault.bump;
    let seeds = &[
        VAULT_SEED,
        ctx.accounts.mint.key().as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // CPI where vault PDA is the signer
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        },
        signer_seeds,
    );

    token::transfer(cpi_ctx, amount)?;

    Ok(())
}
```

---

## Security Patterns

### Authority Checks

```rust
// Using has_one constraint
#[account(
    has_one = authority @ CustomError::NotAuthorized
)]
pub item: Account<'info, Item>,

#[account(mut)]
pub authority: Signer<'info>,

// Manual check in handler
pub fn handler(ctx: Context<UpdateItem>) -> Result<()> {
    require!(
        ctx.accounts.item.authority == ctx.accounts.authority.key(),
        CustomError::NotAuthorized
    );
    // ... rest of handler
}
```

### Ownership Verification

```rust
// Verify account ownership
#[account(
    constraint = token_account.owner == user.key() @ CustomError::NotTokenOwner,
    constraint = token_account.mint == expected_mint.key() @ CustomError::WrongMint
)]
pub token_account: Account<'info, TokenAccount>,
```

### Account Validation Constraints

```rust
#[derive(Accounts)]
pub struct SecureOperation<'info> {
    /// Target account must belong to this program
    #[account(
        mut,
        owner = crate::ID @ CustomError::InvalidAccountOwner,
        constraint = target.status == Status::Active @ CustomError::AccountNotActive,
        constraint = !target.is_locked @ CustomError::AccountLocked
    )]
    pub target: Account<'info, TargetAccount>,

    /// Authority must be the owner
    #[account(
        constraint = authority.key() == target.authority @ CustomError::NotAuthorized
    )]
    pub authority: Signer<'info>,

    /// Config must be initialized and not paused
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        constraint = config.is_initialized @ CustomError::NotInitialized,
        constraint = !config.paused @ CustomError::ProgramPaused
    )]
    pub config: Account<'info, ProgramConfig>,
}
```

### Reentrancy Protection

```rust
// Use a reentrancy guard pattern
#[account]
pub struct ReentrancyGuard {
    pub locked: bool,
    pub bump: u8,
}

// In instruction
#[derive(Accounts)]
pub struct ProtectedInstruction<'info> {
    #[account(
        mut,
        seeds = [b"reentrancy"],
        bump,
        constraint = !guard.locked @ CustomError::ReentrancyDetected
    )]
    pub guard: Account<'info, ReentrancyGuard>,
}

pub fn handler(ctx: Context<ProtectedInstruction>) -> Result<()> {
    // Lock before external calls
    ctx.accounts.guard.locked = true;

    // ... perform operations ...

    // Unlock after completion
    ctx.accounts.guard.locked = false;

    Ok(())
}
```

### Proper CPI Signer Handling

```rust
// Always use stored bumps for CPI
pub fn execute_with_pda_signer(ctx: Context<Execute>) -> Result<()> {
    let config = &ctx.accounts.config;

    // Use stored bump, not recalculated
    let seeds = &[
        CONFIG_SEED,
        &[config.bump],
    ];
    let signer = &[&seeds[..]];

    // Create CPI context with signer
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.some_program.to_account_info(),
        some::InstructionAccounts { /* ... */ },
        signer,
    );

    some::instruction(cpi_ctx)?;

    Ok(())
}
```

### Admin-Only Operations

```rust
#[derive(Accounts)]
pub struct AdminInstruction<'info> {
    #[account(
        mut,
        constraint = admin.key() == config.admin @ CustomError::NotAdmin
    )]
    pub admin: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, ProgramConfig>,
}

pub fn pause_program(ctx: Context<AdminInstruction>) -> Result<()> {
    ctx.accounts.config.paused = true;

    emit!(ProgramPaused {
        by: ctx.accounts.admin.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

---

## Error Handling

### Custom Error Enum

```rust
// error.rs
use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    // Authorization errors (100-199)
    #[msg("You are not authorized to perform this action")]
    NotAuthorized,

    #[msg("Only the admin can perform this action")]
    NotAdmin,

    #[msg("Only the owner can perform this action")]
    NotOwner,

    // Validation errors (200-299)
    #[msg("The provided name is too short (minimum 3 characters)")]
    NameTooShort,

    #[msg("The provided name is too long (maximum 32 characters)")]
    NameTooLong,

    #[msg("The provided value must be greater than zero")]
    InvalidValue,

    #[msg("The provided amount exceeds the maximum allowed")]
    AmountExceedsMax,

    #[msg("Invalid mint address provided")]
    InvalidMint,

    // State errors (300-399)
    #[msg("The program is currently paused")]
    ProgramPaused,

    #[msg("The program has not been initialized")]
    NotInitialized,

    #[msg("The account is not in the correct state for this operation")]
    InvalidState,

    #[msg("The account is locked and cannot be modified")]
    AccountLocked,

    #[msg("Insufficient balance for this operation")]
    InsufficientBalance,

    // PDA/Account errors (400-499)
    #[msg("The provided account has an invalid owner")]
    InvalidAccountOwner,

    #[msg("No account found at the provided address")]
    AccountNotFound,

    #[msg("The account has already been initialized")]
    AlreadyInitialized,

    // Arithmetic errors (500-599)
    #[msg("Mathematical overflow occurred")]
    Overflow,

    #[msg("Division by zero is not allowed")]
    DivisionByZero,

    // CPI errors (600-699)
    #[msg("Cross-program invocation failed")]
    CpiFailed,

    #[msg("Token transfer failed")]
    TransferFailed,
}
```

### Using Errors in Instructions

```rust
use crate::error::CustomError;

pub fn handler(ctx: Context<SomeInstruction>, amount: u64) -> Result<()> {
    let account = &mut ctx.accounts.target;

    // Require with custom error
    require!(amount > 0, CustomError::InvalidValue);

    // Require with message (creates generic error)
    require!(account.balance >= amount, "Insufficient balance");

    // Conditional error with additional context
    if account.balance < amount {
        return err!(CustomError::InsufficientBalance);
    }

    // Safe arithmetic with checked operations
    account.balance = account.balance
        .checked_sub(amount)
        .ok_or(CustomError::Overflow)?;

    Ok(())
}
```

### Error Wrapping

```rust
// Wrap external errors with context
pub fn handler(ctx: Context<Transfer>) -> Result<()> {
    let result = token::transfer(
        CpiContext::new(/* ... */),
        amount,
    ).map_err(|e| {
        // Log for debugging
        msg!("Token transfer failed: {:?}", e);
        // Return custom error
        CustomError::TransferFailed
    })?;

    Ok(())
}
```

---

## Event Emission

### Event Definitions

```rust
// state/events.rs (or inline in relevant files)
use anchor_lang::prelude::*;

/// Emitted when program is initialized
#[event]
pub struct ProgramInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
}

/// Emitted when a new item is created
#[event]
pub struct ItemCreated {
    pub authority: Pubkey,
    pub item: Pubkey,
    pub name: String,
    pub value: u64,
}

/// Emitted when an item is transferred
#[event]
pub struct ItemTransferred {
    pub item: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub timestamp: i64,
}

/// Emitted when program config is updated
#[event]
pub struct ConfigUpdated {
    pub by: Pubkey,
    pub field: String,
    pub old_value: String,
    pub new_value: String,
}

/// Emitted on payment execution
#[event]
pub struct PaymentExecuted {
    pub payer: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub timestamp: i64,
}
```

### Emitting Events

```rust
pub fn handler(ctx: Context<CreateItem>, name: String, value: u64) -> Result<()> {
    let item = &mut ctx.accounts.item;

    // ... initialization logic ...

    emit!(ItemCreated {
        authority: ctx.accounts.authority.key(),
        item: item.key(),
        name: name.clone(),
        value,
    });

    Ok(())
}

// Multiple events for complex operations
pub fn execute_payment(ctx: Context<ExecutePayment>) -> Result<()> {
    // ... payment logic ...

    emit!(PaymentStarted {
        payment_id,
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    // ... transfer tokens ...

    emit!(PaymentExecuted {
        payer: ctx.accounts.payer.key(),
        recipient: ctx.accounts.recipient.key(),
        amount,
        fee,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

---

## Testing Strategy

### Test File Structure

```rust
// tests/program_name.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ProgramName } from "../target/types/program_name";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount
} from "@solana/spl-token";
import { assert } from "chai";

describe("program-name", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ProgramName as Program<ProgramName>;
  const wallet = provider.wallet;

  // Helper to derive PDAs
  const findConfigPda = () =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

  const findUserPda = (authority: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("user"), authority.toBuffer()],
      program.programId
    );

  describe("Initialization", () => {
    it("initializes the program config", async () => {
      const [configPda, bump] = findConfigPda();

      await program.methods
        .initialize()
        .accounts({
          config: configPda,
          admin: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const config = await program.account.programConfig.fetch(configPda);

      assert.equal(config.authority.toBase58(), wallet.publicKey.toBase58());
      assert.equal(config.bump, bump);
      assert.isFalse(config.paused);
    });

    it("fails to initialize twice", async () => {
      const [configPda] = findConfigPda();

      try {
        await program.methods
          .initialize()
          .accounts({
            config: configPda,
            admin: wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        assert.fail("Should have thrown error");
      } catch (e) {
        assert.include(e.message, "already in use");
      }
    });
  });

  describe("Item Management", () => {
    let itemPda: PublicKey;
    const itemName = "Test Item";
    const itemValue = new anchor.BN(1000);

    beforeEach(async () => {
      [itemPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("item"),
          wallet.publicKey.toBuffer(),
          Buffer.from(itemName),
        ],
        program.programId
      );
    });

    it("creates a new item", async () => {
      await program.methods
        .createItem(itemName, itemValue)
        .accounts({
          item: itemPda,
          authority: wallet.publicKey,
          config: (await findConfigPda())[0],
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const item = await program.account.item.fetch(itemPda);

      assert.equal(item.name, itemName);
      assert.isTrue(item.value.eq(itemValue));
      assert.equal(item.authority.toBase58(), wallet.publicKey.toBase58());
    });

    it("rejects empty name", async () => {
      try {
        await program.methods
          .createItem("", itemValue)
          .accounts({
            item: itemPda,
            authority: wallet.publicKey,
            config: (await findConfigPda())[0],
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        assert.fail("Should have thrown error");
      } catch (e) {
        assert.include(e.message, "NameTooShort");
      }
    });

    it("rejects zero value", async () => {
      try {
        await program.methods
          .createItem(itemName, new anchor.BN(0))
          .accounts({
            item: itemPda,
            authority: wallet.publicKey,
            config: (await findConfigPda())[0],
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        assert.fail("Should have thrown error");
      } catch (e) {
        assert.include(e.message, "InvalidValue");
      }
    });
  });

  describe("Token Operations", () => {
    let mint: PublicKey;
    let userTokenAccount: PublicKey;
    let vaultTokenAccount: PublicKey;

    beforeEach(async () => {
      // Create mint
      mint = await createMint(
        provider.connection,
        wallet.payer,
        wallet.publicKey,
        null,
        9
      );

      // Create user token account
      userTokenAccount = await createAccount(
        provider.connection,
        wallet.payer,
        mint,
        wallet.publicKey
      );

      // Mint tokens to user
      await mintTo(
        provider.connection,
        wallet.payer,
        mint,
        userTokenAccount,
        wallet.publicKey,
        1_000_000_000 // 1 token
      );
    });

    it("transfers tokens correctly", async () => {
      const transferAmount = new anchor.BN(100_000_000);

      await program.methods
        .transferTokens(transferAmount)
        .accounts({
          from: userTokenAccount,
          to: vaultTokenAccount,
          authority: wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      const userBalance = await getAccount(
        provider.connection,
        userTokenAccount
      );

      assert.equal(
        Number(userBalance.amount),
        1_000_000_000 - 100_000_000
      );
    });
  });

  describe("Edge Cases", () => {
    it("handles maximum name length", async () => {
      const maxName = "a".repeat(32);

      await program.methods
        .createItem(maxName, new anchor.BN(1))
        .accounts({ /* ... */ })
        .rpc();
      // Should succeed
    });

    it("rejects name exceeding maximum length", async () => {
      const tooLongName = "a".repeat(33);

      try {
        await program.methods
          .createItem(tooLongName, new anchor.BN(1))
          .accounts({ /* ... */ })
          .rpc();

        assert.fail("Should have thrown error");
      } catch (e) {
        assert.include(e.message, "NameTooLong");
      }
    });

    it("handles arithmetic overflow", async () => {
      // Setup account with max value
      // ...

      try {
        await program.methods
          .addToValue(new anchor.BN(1)) // Would overflow
          .accounts({ /* ... */ })
          .rpc();

        assert.fail("Should have thrown error");
      } catch (e) {
        assert.include(e.message, "Overflow");
      }
    });
  });
});
```

### Test Utilities

```rust
// tests/utils.ts
import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount
} from "@solana/spl-token";

export class TestEnv {
  provider: anchor.AnchorProvider;
  program: Program;

  constructor(program: Program) {
    this.provider = anchor.AnchorProvider.env();
    this.program = program;
  }

  async createMint(decimals: number = 9): Promise<PublicKey> {
    return createMint(
      this.provider.connection,
      this.provider.wallet.payer,
      this.provider.wallet.publicKey,
      null,
      decimals
    );
  }

  async createTokenAccount(mint: PublicKey): Promise<PublicKey> {
    return createAccount(
      this.provider.connection,
      this.provider.wallet.payer,
      mint,
      this.provider.wallet.publicKey
    );
  }

  async mintTokens(
    mint: PublicKey,
    account: PublicKey,
    amount: number
  ): Promise<void> {
    await mintTo(
      this.provider.connection,
      this.provider.wallet.payer,
      mint,
      account,
      this.provider.wallet.publicKey,
      amount
    );
  }

  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getBalance(account: PublicKey): Promise<bigint> {
    const tokenAccount = await getAccount(
      this.provider.connection,
      account
    );
    return tokenAccount.amount;
  }
}

// Helper for generating PDAs
export function derivePda(
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    seeds.map(s => Buffer.from(s)),
    programId
  );
}
```

---

## Cargo.toml Configuration

### Program Cargo.toml

```toml
[package]
name = "program-name"
version = "0.1.0"
description = "Description of your Anchor program"
edition = "2021"
license = "MIT"
repository = "https://github.com/org/program-name"

[lib]
crate-type = ["cdylib", "lib"]
name = "program_name"

[features]
default = []
# Enable for local testing with verbose logs
local-testing = []
# Enable custom heap size
custom-heap = []
# Enable IDL generation without building
idl-build = ["anchor-lang/idl-build"]

[dependencies]
anchor-lang = { version = "0.31.0", features = ["init-if-needed"] }
anchor-spl = { version = "0.31.0", features = ["metadata"] }

[dev-dependencies]
# For local testing
mollusk-svm = "0.1.0"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
```

### Workspace Cargo.toml

```toml
[workspace]
members = [
    "programs/*",
]

[workspace.dependencies]
anchor-lang = "0.31.0"
anchor-spl = "0.31.0"
```

---

## Best Practices

### Code Organization

1. **One instruction per file** - Keeps handlers focused and testable
2. **Group related accounts** - Put accounts used together in same module
3. **Centralize constants** - All seeds and magic numbers in `constants.rs`
4. **Extract utilities** - Common patterns go in `utils.rs`

### Documentation

```rust
/// Creates a new payment schedule for recurring transfers.
///
/// # Arguments
/// * `amount` - The amount to transfer per payment (in smallest units)
/// * `interval` - Time between payments in seconds
/// * `start_time` - Unix timestamp for first payment
///
/// # Errors
/// Returns [`CustomError::InvalidAmount`] if amount is zero.
/// Returns [`CustomError::InvalidInterval`] if interval is less than 60 seconds.
///
/// # Security
/// - Requires signature of the payer
/// - Payer must have sufficient token balance
/// - PDA seeds ensure uniqueness per payer-recipient pair
pub fn create_schedule(
    ctx: Context<CreateSchedule>,
    amount: u64,
    interval: i64,
    start_time: i64,
) -> Result<()> {
    // Implementation
}
```

### Gas Optimization

```rust
// BAD: Multiple separate updates
account.field1 = value1;
account.field2 = value2;
account.updated_at = Clock::get()?.unix_timestamp;

// GOOD: Single call to Clock
let clock = Clock::get()?;
account.field1 = value1;
account.field2 = value2;
account.updated_at = clock.unix_timestamp;

// GOOD: Use bytes for small values instead of strings
pub enum Status: u8 {
    Active = 0,
    Paused = 1,
    Closed = 2,
}

// AVOID: Large vectors
#[max_len(1000)]
pub items: Vec<Pubkey>,  // Expensive to iterate

// PREFER: Use separate accounts with PDAs
pub struct Item {
    pub owner: Pubkey,
    pub index: u32,
    // ...
}
```

### Upgrade Considerations

```rust
// Always include reserved space
#[account]
#[derive(InitSpace)]
pub struct MyAccount {
    pub field1: u64,
    pub field2: Pubkey,

    // Reserved for future fields - MUST be at end
    #[max_len(64)]
    pub _reserved: Vec<u8>,
}

// Or use fixed padding
#[account]
pub struct MyAccount {
    pub field1: u64,
    pub field2: Pubkey,

    // 128 bytes reserved
    pub _padding: [u8; 128],
}

// Version field for migrations
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub version: u8,  // Increment when structure changes
    pub authority: Pubkey,
    // ... other fields
}
```

### Input Validation

```rust
pub fn handler(
    ctx: Context<SomeInstruction>,
    name: String,
    amount: u64,
    duration: i64,
) -> Result<()> {
    // Validate string length
    require!(
        name.len() >= MIN_NAME_LENGTH && name.len() <= MAX_NAME_LENGTH,
        CustomError::InvalidNameLength
    );

    // Validate numeric bounds
    require!(amount > 0, CustomError::ZeroAmount);
    require!(amount <= MAX_AMOUNT, CustomError::AmountTooLarge);

    // Validate time is in future
    let now = Clock::get()?.unix_timestamp;
    require!(duration > now, CustomError::InvalidDuration);

    // Validate enum values
    require!(
        matches!(ctx.accounts.account.status, Status::Active),
        CustomError::AccountNotActive
    );

    Ok(())
}
```

---

## Quick Reference

### Account Constraints

| Constraint          | Purpose                             |
| ------------------- | ----------------------------------- |
| `init`              | Initialize new account              |
| `mut`               | Account can be modified             |
| `has_one = field`   | Verify account.field == other field |
| `constraint = expr` | Custom validation                   |
| `owner = program`   | Verify account owner                |
| `seeds = [...]`     | PDA derivation seeds                |
| `bump`              | Auto-derive bump                    |
| `payer = account`   | Who pays for init                   |

### Common Patterns

```rust
// Initialize PDA
#[account(
    init,
    payer = payer,
    space = 8 + Account::INIT_SPACE,
    seeds = [SEED, key.as_ref()],
    bump
)]

// Verify existing PDA
#[account(
    seeds = [SEED, key.as_ref()],
    bump = account.bump,
    has_one = authority
)]

// Associated token account
#[account(
    mut,
    constraint = token_account.owner == owner.key(),
    constraint = token_account.mint == mint.key()
)]

// Optional account
#[account(
    seeds = [SEED],
    bump
)]
pub optional: Option<Account<'info, SomeAccount>>,
```

---

## Deliverables Checklist

When building an Anchor program, ensure:

- [ ] Proper directory structure with modular files
- [ ] All accounts use `InitSpace` and include bump storage
- [ ] Instructions have proper `#[derive(Accounts)]` with constraints
- [ ] PDAs use consistent seed patterns
- [ ] Security checks (authority, ownership, state)
- [ ] Custom error enum with descriptive messages
- [ ] Events emitted for important state changes
- [ ] Comprehensive tests (success, failure, edge cases)
- [ ] Cargo.toml properly configured
- [ ] Documentation comments on public functions
- [ ] Reserved space for future upgrades

---

_Ship secure, modular, and gas-efficient Anchor programs._
