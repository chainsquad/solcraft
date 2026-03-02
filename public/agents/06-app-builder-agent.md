# App Builder Agent

**Purpose:** Build React applications with Solana SDK and web3.js integration

**Scope:** Generalized patterns for any Solana dApp - not project-specific

---

## 📁 App Structure

```
apps/app/
├── src/
│   ├── main.tsx              # Entry point with providers
│   ├── app.tsx               # Root component
│   ├── components/
│   │   ├── ui/              # Base UI components (button, input, modal, toast)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   └── toast.tsx
│   │   └── features/        # Feature-specific components
│   │       ├── wallet-connect.tsx
│   │       ├── balance-display.tsx
│   │       └── transaction-handler.tsx
│   ├── lib/
│   │   ├── solana.ts        # Solana connection, wallet adapter
│   │   ├── sdk.ts           # SDK initialization
│   │   └── utils.ts         # Helper functions
│   ├── hooks/               # Custom React hooks
│   │   ├── use-balance.ts
│   │   ├── use-token-account.ts
│   │   ├── use-program-account.ts
│   │   └── use-transaction.ts
│   ├── contexts/            # React contexts
│   │   └── sdk-context.tsx
│   ├── pages/               # Page components (if using router)
│   │   ├── home.tsx
│   │   └── dashboard.tsx
│   ├── index.css            # Global styles (Tailwind)
│   └── vite-env.d.ts        # Type declarations
├── public/
│   └── favicon.ico
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## 🔗 Solana Integration

### 1. Wallet Adapter Setup

**Install Dependencies:**

```bash
pnpm add @solana/web3.js \
         @solana/wallet-adapter-base \
         @solana/wallet-adapter-react \
         @solana/wallet-adapter-react-ui \
         @solana/wallet-adapter-wallets \
         @solana/spl-token
```

**lib/solana.ts:**

```typescript
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl, Cluster } from "@solana/web3.js";
import { useMemo } from "react";
import type { ReactNode } from "react";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface SolanaProviderProps {
  children: ReactNode;
  network?: Cluster;
  rpcUrl?: string;
}

export function SolanaProvider({
  children,
  network = "devnet",
  rpcUrl,
}: SolanaProviderProps) {
  // Use custom RPC URL if provided, otherwise use cluster API
  const endpoint = useMemo(
    () => rpcUrl || clusterApiUrl(network),
    [network, rpcUrl]
  );

  // Configure supported wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      // Add more wallets as needed:
      // new CoinbaseWalletAdapter(),
      // new LedgerWalletAdapter(),
      // new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// Network configuration helper
export function getNetworkConfig(network: Cluster) {
  const configs = {
    localhost: {
      rpcUrl: "http://localhost:8899",
      wsUrl: "ws://localhost:8900",
      label: "Localnet",
    },
    devnet: {
      rpcUrl: clusterApiUrl("devnet"),
      wsUrl: clusterApiUrl("devnet").replace("https://", "wss://"),
      label: "Devnet",
    },
    testnet: {
      rpcUrl: clusterApiUrl("testnet"),
      wsUrl: clusterApiUrl("testnet").replace("https://", "wss://"),
      label: "Testnet",
    },
    "mainnet-beta": {
      rpcUrl: clusterApiUrl("mainnet-beta"),
      wsUrl: clusterApiUrl("mainnet-beta").replace("https://", "wss://"),
      label: "Mainnet",
    },
  };

  return configs[network];
}
```

### 2. Entry Point with Providers

**src/main.tsx:**

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import { SolanaProvider } from "./lib/solana";
import { SDKProvider } from "./contexts/sdk-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "./components/ui/toast";
import "./index.css";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000, // 5 seconds
      refetchOnWindowFocus: false,
    },
  },
});

// Get network from environment
const network = (import.meta.env.VITE_SOLANA_NETWORK || "devnet") as Cluster;
const rpcUrl = import.meta.env.VITE_RPC_URL;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SolanaProvider network={network} rpcUrl={rpcUrl}>
        <SDKProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SDKProvider>
      </SolanaProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
```

### 3. Network Switching Component

**components/features/network-switcher.tsx:**

```typescript
import { useConnection } from "@solana/wallet-adapter-react";
import { useState } from "react";

const NETWORKS = [
  { name: "Localnet", cluster: "localhost" as const },
  { name: "Devnet", cluster: "devnet" as const },
  { name: "Testnet", cluster: "testnet" as const },
  { name: "Mainnet", cluster: "mainnet-beta" as const },
];

export function NetworkSwitcher() {
  const { connection } = useConnection();
  const [selectedNetwork, setSelectedNetwork] = useState("devnet");

  const handleNetworkChange = async (cluster: string) => {
    setSelectedNetwork(cluster);
    // In production, you'd reinitialize the connection
    // For now, this shows the pattern
    console.log(`Switch to ${cluster}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Network:</span>
      <select
        value={selectedNetwork}
        onChange={(e) => handleNetworkChange(e.target.value)}
        className="px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-gray-800"
      >
        {NETWORKS.map((network) => (
          <option key={network.cluster} value={network.cluster}>
            {network.name}
          </option>
        ))}
      </select>
      <div className="w-2 h-2 rounded-full bg-green-500" title="Connected" />
    </div>
  );
}
```

---

## 🛠️ SDK Integration

### 1. SDK Context Provider

**contexts/sdk-context.tsx:**

```typescript
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { Connection } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import type { ReactNode } from "react";

// Generic SDK type - replace with your actual SDK
interface SDK {
  connection: Connection;
  wallet: AnchorWallet;
  // Add SDK-specific methods here
  // getAccount(pubkey: PublicKey): Promise<Account>;
  // executeInstruction(args: any): Promise<string>;
}

interface SDKContextValue {
  sdk: SDK | null;
  isLoading: boolean;
  error: Error | null;
}

const SDKContext = createContext<SDKContextValue>({
  sdk: null,
  isLoading: true,
  error: null,
});

export function useSDK() {
  const context = useContext(SDKContext);
  if (!context) {
    throw new Error("useSDK must be used within SDKProvider");
  }
  return context;
}

interface SDKProviderProps {
  children: ReactNode;
}

export function SDKProvider({ children }: SDKProviderProps) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [sdk, setSDK] = useState<SDK | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (wallet) {
      setIsLoading(true);
      try {
        // Initialize your SDK here
        const sdkInstance: SDK = {
          connection,
          wallet,
          // Add SDK initialization
        };
        setSDK(sdkInstance);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("SDK init failed"));
      } finally {
        setIsLoading(false);
      }
    } else {
      setSDK(null);
      setIsLoading(false);
    }
  }, [connection, wallet]);

  const value = useMemo(
    () => ({
      sdk,
      isLoading,
      error,
    }),
    [sdk, isLoading, error]
  );

  return <SDKContext.Provider value={value}>{children}</SDKContext.Provider>;
}
```

### 2. SDK Initialization Factory

**lib/sdk.ts:**

```typescript
import { Connection, PublicKey, Commitment } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

// SDK Configuration
export interface SDKConfig {
  programId: PublicKey;
  commitment?: Commitment;
  prefetchAccounts?: boolean;
}

// Generic SDK class - customize for your program
export class ProgramSDK {
  private connection: Connection;
  private wallet: AnchorWallet;
  private config: SDKConfig;

  constructor(connection: Connection, wallet: AnchorWallet, config: SDKConfig) {
    this.connection = connection;
    this.wallet = wallet;
    this.config = config;
  }

  // Get connection
  getConnection(): Connection {
    return this.connection;
  }

  // Get wallet public key
  getPublicKey(): PublicKey {
    return this.wallet.publicKey;
  }

  // Example: Fetch account data
  async getAccount(pubkey: PublicKey) {
    const accountInfo = await this.connection.getAccountInfo(
      pubkey,
      this.config.commitment
    );

    if (!accountInfo) {
      throw new Error("Account not found");
    }

    // Deserialize account data based on your program
    return accountInfo;
  }

  // Example: Build and send transaction
  async sendTransaction(
    instruction: any, // Replace with actual instruction type
    signers?: any[]
  ): Promise<string> {
    // Implement transaction building and sending
    // This is a placeholder - customize for your program
    const signature = "";
    return signature;
  }
}

// Factory function for SDK creation
export function createSDK(
  connection: Connection,
  wallet: AnchorWallet,
  config?: Partial<SDKConfig>
): ProgramSDK {
  const defaultConfig: SDKConfig = {
    programId: new PublicKey("YOUR_PROGRAM_ID"), // Replace
    commitment: "confirmed",
    prefetchAccounts: false,
    ...config,
  };

  return new ProgramSDK(connection, wallet, defaultConfig);
}
```

---

## 🧩 Common Components

### 1. Wallet Connection Button

**components/features/wallet-connect.tsx:**

```typescript
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "../ui/button";

export function WalletConnect() {
  const { publicKey, disconnect, connecting, disconnecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnect = () => {
    setVisible(true);
  };

  if (connecting || disconnecting) {
    return (
      <Button disabled>
        <span className="animate-pulse">
          {connecting ? "Connecting..." : "Disconnecting..."}
        </span>
      </Button>
    );
  }

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
          <span className="text-sm font-mono">
            {publicKey.toBase58().slice(0, 4)}...
            {publicKey.toBase58().slice(-4)}
          </span>
        </div>
        <Button variant="outline" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return <Button onClick={handleConnect}>Connect Wallet</Button>;
}
```

### 2. Balance Display

**components/features/balance-display.tsx:**

```typescript
import { useBalance } from "../../hooks/use-balance";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface BalanceDisplayProps {
  tokenMint?: string; // Optional SPL token mint
  showUsd?: boolean;
}

export function BalanceDisplay({
  tokenMint,
  showUsd = false,
}: BalanceDisplayProps) {
  const { publicKey } = useWallet();
  const { balance, isLoading, error } = useBalance(publicKey, tokenMint);

  if (!publicKey) {
    return <div className="text-gray-500">Connect wallet to view balance</div>;
  }

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-6 w-20 rounded" />;
  }

  if (error) {
    return <div className="text-red-500">Error loading balance</div>;
  }

  const displayBalance = tokenMint
    ? balance?.toString()
    : (balance?.toNumber() || 0) / LAMPORTS_PER_SOL;

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">{displayBalance.toFixed(4)}</span>
      <span className="text-gray-500">{tokenMint ? "Token" : "SOL"}</span>
      {showUsd && (
        <span className="text-sm text-gray-400">
          ≈ ${(displayBalance * 0).toFixed(2)} {/* Add price fetching */}
        </span>
      )}
    </div>
  );
}
```

### 3. Transaction Handler

**components/features/transaction-handler.tsx:**

```typescript
import { useState } from "react";
import { useTransaction } from "../../hooks/use-transaction";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

interface TransactionHandlerProps {
  buildTransaction: () => Promise<any>; // Returns instruction
  onSuccess?: (signature: string) => void;
  onError?: (error: Error) => void;
  buttonText?: string;
  buttonVariant?: "primary" | "outline" | "ghost";
}

export function TransactionHandler({
  buildTransaction,
  onSuccess,
  onError,
  buttonText = "Submit",
  buttonVariant = "primary",
}: TransactionHandlerProps) {
  const { execute, isLoading } = useTransaction();
  const { toast } = useToast();
  const [signature, setSignature] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setSignature(null);
      const instruction = await buildTransaction();
      const sig = await execute(instruction);

      setSignature(sig);
      toast({
        title: "Transaction Successful",
        description: `Signature: ${sig.slice(0, 8)}...${sig.slice(-8)}`,
        type: "success",
      });

      onSuccess?.(sig);
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      toast({
        title: "Transaction Failed",
        description: err.message,
        type: "error",
      });
      onError?.(err);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant={buttonVariant}
        onClick={handleSubmit}
        disabled={isLoading}
        loading={isLoading}
      >
        {isLoading ? "Processing..." : buttonText}
      </Button>

      {signature && (
        <div className="text-sm text-gray-500">
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            View Transaction →
          </a>
        </div>
      )}
    </div>
  );
}
```

### 4. Form Components

**components/features/token-input.tsx:**

```typescript
import { useState, useEffect } from "react";
import { PublicKey } from "@solana/web3.js";
import { Input } from "../ui/input";

interface TokenInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
  placeholder?: string;
  maxBalance?: number;
}

export function TokenInput({
  value,
  onChange,
  label = "Amount",
  placeholder = "0.00",
  maxBalance,
}: TokenInputProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (inputValue: string) => {
    setError(null);

    // Validate numeric input
    const numValue = parseFloat(inputValue);
    if (inputValue && isNaN(numValue)) {
      setError("Please enter a valid number");
      onChange(inputValue, false);
      return;
    }

    // Check for negative values
    if (numValue < 0) {
      setError("Amount must be positive");
      onChange(inputValue, false);
      return;
    }

    // Check against max balance
    if (maxBalance !== undefined && numValue > maxBalance) {
      setError(`Insufficient balance (max: ${maxBalance})`);
      onChange(inputValue, false);
      return;
    }

    onChange(inputValue, true);
  };

  const handleMax = () => {
    if (maxBalance !== undefined) {
      onChange(maxBalance.toString(), true);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        {maxBalance !== undefined && (
          <button
            onClick={handleMax}
            className="text-xs text-blue-500 hover:text-blue-600"
          >
            Max: {maxBalance.toFixed(4)}
          </button>
        )}
      </div>
      <Input
        type="number"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        error={error}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// Address Input Component
interface AddressInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
  placeholder?: string;
}

export function AddressInput({
  value,
  onChange,
  label = "Recipient Address",
  placeholder = "Enter Solana address",
}: AddressInputProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (inputValue: string) => {
    setError(null);

    if (!inputValue) {
      onChange(inputValue, false);
      return;
    }

    try {
      new PublicKey(inputValue);
      onChange(inputValue, true);
    } catch {
      setError("Invalid Solana address");
      onChange(inputValue, false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <Input
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        error={error}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
```

---

## 🪝 Custom Hooks

### 1. useBalance Hook

**hooks/use-balance.ts:**

```typescript
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import type { PublicKey as PublicKeyType } from "@solana/web3.js";

export function useBalance(
  publicKey: PublicKeyType | null,
  tokenMint?: string
) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["balance", publicKey?.toBase58(), tokenMint],
    queryFn: async () => {
      if (!publicKey) return null;

      if (tokenMint) {
        // Fetch SPL token balance
        const mint = new PublicKey(tokenMint);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { mint }
        );

        if (tokenAccounts.value.length === 0) {
          return 0;
        }

        const balance =
          tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
        return parseFloat(balance.uiAmountString || "0");
      } else {
        // Fetch SOL balance
        const balance = await connection.getBalance(publicKey);
        return balance / LAMPORTS_PER_SOL;
      }
    },
    enabled: !!publicKey,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}
```

### 2. useTokenAccount Hook

**hooks/use-token-account.ts:**

```typescript
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";

export function useTokenAccount(
  owner: PublicKey | null,
  mint: PublicKey | string | null
) {
  const { connection } = useConnection();

  return useQuery({
    queryKey: ["tokenAccount", owner?.toBase58(), mint?.toString()],
    queryFn: async () => {
      if (!owner || !mint) return null;

      const mintPubkey = typeof mint === "string" ? new PublicKey(mint) : mint;

      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        owner,
        { mint: mintPubkey }
      );

      if (tokenAccounts.value.length === 0) {
        return null;
      }

      return {
        pubkey: tokenAccounts.value[0].pubkey,
        account: tokenAccounts.value[0].account,
        amount: tokenAccounts.value[0].account.data.parsed.info.tokenAmount,
      };
    },
    enabled: !!owner && !!mint,
    refetchInterval: 10000,
  });
}
```

### 3. useProgramAccount Hook

**hooks/use-program-account.ts:**

```typescript
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface UseProgramAccountOptions<T> {
  pubkey: PublicKey | string | null;
  deserialize: (data: Buffer) => T;
  commitment?: "processed" | "confirmed" | "finalized";
  subscribe?: boolean;
}

export function useProgramAccount<T>({
  pubkey,
  deserialize,
  commitment = "confirmed",
  subscribe = true,
}: UseProgramAccountOptions<T>) {
  const { connection } = useConnection();
  const queryClient = useQueryClient();

  const queryKey = ["programAccount", pubkey?.toString()];

  // Fetch account data
  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!pubkey) return null;

      const pubkeyObj =
        typeof pubkey === "string" ? new PublicKey(pubkey) : pubkey;
      const accountInfo = await connection.getAccountInfo(
        pubkeyObj,
        commitment
      );

      if (!accountInfo) {
        return null;
      }

      return deserialize(accountInfo.data);
    },
    enabled: !!pubkey,
    staleTime: 5000,
  });

  // Subscribe to account changes
  useEffect(() => {
    if (!subscribe || !pubkey) return;

    const pubkeyObj =
      typeof pubkey === "string" ? new PublicKey(pubkey) : pubkey;

    const subscriptionId = connection.onAccountChange(
      pubkeyObj,
      (accountInfo) => {
        const data = deserialize(accountInfo.data);
        queryClient.setQueryData(queryKey, data);
      },
      { commitment }
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [
    connection,
    pubkey,
    subscribe,
    commitment,
    queryKey,
    queryClient,
    deserialize,
  ]);

  return query;
}
```

### 4. useTransaction Hook

**hooks/use-transaction.ts:**

```typescript
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, TransactionInstruction, Signer } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { useState, useCallback } from "react";

type TransactionStatus =
  | "idle"
  | "building"
  | "signing"
  | "sending"
  | "confirming"
  | "success"
  | "error";

export function useTransaction() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [signature, setSignature] = useState<string | null>(null);

  const execute = useCallback(
    async (
      instructionOrTransaction: TransactionInstruction | Transaction,
      signers: Signer[] = []
    ) => {
      if (!publicKey) {
        throw new Error("Wallet not connected");
      }

      try {
        setStatus("building");
        setError(null);
        setSignature(null);

        let transaction: Transaction;

        if (instructionOrTransaction instanceof Transaction) {
          transaction = instructionOrTransaction;
        } else {
          transaction = new Transaction();
          transaction.add(instructionOrTransaction);
        }

        // Get recent blockhash
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        setStatus("signing");

        // Send transaction
        const sig = await sendTransaction(transaction, connection, { signers });
        setSignature(sig);

        setStatus("confirming");

        // Confirm transaction
        const confirmation = await connection.confirmTransaction(
          {
            signature: sig,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error(
            `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
          );
        }

        setStatus("success");
        return sig;
      } catch (err) {
        setStatus("error");
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        throw error;
      }
    },
    [connection, publicKey, sendTransaction]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setSignature(null);
  }, []);

  return {
    execute,
    reset,
    status,
    error,
    signature,
    isLoading: ["building", "signing", "sending", "confirming"].includes(
      status
    ),
  };
}
```

---

## 🗃️ State Management

### Option 1: React Query (Server State)

**Already shown in hooks above - use for:**

- Account data
- Balances
- RPC queries
- Any data that needs caching/refetching

**Configuration:**

```typescript
// main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### Option 2: Zustand (Client State)

**stores/wallet-store.ts:**

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
  recentAddresses: string[];
  preferredNetwork: string;
  addRecentAddress: (address: string) => void;
  setPreferredNetwork: (network: string) => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      recentAddresses: [],
      preferredNetwork: "devnet",

      addRecentAddress: (address) =>
        set((state) => ({
          recentAddresses: [
            address,
            ...state.recentAddresses.filter((a) => a !== address),
          ].slice(0, 5), // Keep last 5
        })),

      setPreferredNetwork: (network) => set({ preferredNetwork: network }),
    }),
    {
      name: "wallet-storage",
    }
  )
);
```

**stores/ui-store.ts:**

```typescript
import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  selectedToken: string | null;
  toggleSidebar: () => void;
  setSelectedToken: (token: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  selectedToken: null,

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setSelectedToken: (token) => set({ selectedToken: token }),
}));
```

### Option 3: Jotai (Atomic State)

**atoms/transaction.ts:**

```typescript
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Persistent atoms
export const networkAtom = atomWithStorage("network", "devnet");
export const slippageAtom = atomWithStorage("slippage", 0.5);

// Transient atoms
export const amountAtom = atom<string>("");
export const recipientAtom = atom<string>("");

// Derived atoms
export const isValidAmountAtom = atom((get) => {
  const amount = get(amountAtom);
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
});

// Usage in component
function TransactionForm() {
  const [amount, setAmount] = useAtom(amountAtom);
  const [recipient, setRecipient] = useAtom(recipientAtom);
  const isValid = useAtomValue(isValidAmountAtom);

  // ...
}
```

---

## 🎨 Styling Options

### 1. Tailwind CSS (Recommended)

**tailwind.config.js:**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Solana gradient colors
        solana: {
          purple: "#9945FF",
          green: "#14F195",
          teal: "#00FFA3",
        },
      },
      animation: {
        gradient: "gradient 3s ease infinite",
      },
      keyframes: {
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
```

**index.css:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-gradient-to-r from-solana-purple to-solana-green 
           text-white font-medium rounded-lg hover:opacity-90 
           transition-opacity disabled:opacity-50;
  }

  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 dark:bg-gray-900;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-700 rounded-full;
}
```

### 2. shadcn/ui Components

**Installation:**

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input toast
```

**Usage:**

```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

// Components are pre-styled and accessible
<Button variant="outline" size="lg">
  Click me
</Button>;
```

### 3. Dark Mode

**components/features/theme-toggle.tsx:**

```typescript
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setIsDark(prefersDark);
  }, []);

  const toggle = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {isDark ? "🌙" : "☀️"}
    </button>
  );
}
```

---

## 🔄 Transaction Flow

### Complete Transaction Flow Example

**components/features/transfer-form.tsx:**

```typescript
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { TokenInput, AddressInput } from "./token-input";
import { TransactionHandler } from "./transaction-handler";
import { useBalance } from "../../hooks/use-balance";

export function TransferForm() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { data: balance } = useBalance(publicKey);

  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isAmountValid, setIsAmountValid] = useState(false);
  const [isRecipientValid, setIsRecipientValid] = useState(false);

  const buildTransaction = async () => {
    if (!publicKey || !isAmountValid || !isRecipientValid) {
      throw new Error("Invalid inputs");
    }

    const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
    const recipientPubkey = new PublicKey(recipient);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubkey,
        lamports,
      })
    );

    return transaction;
  };

  const handleSuccess = (signature: string) => {
    console.log("Transfer successful:", signature);
    setAmount("");
    setRecipient("");
  };

  return (
    <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold">Transfer SOL</h2>

      <div className="space-y-4">
        <TokenInput
          value={amount}
          onChange={(value, isValid) => {
            setAmount(value);
            setIsAmountValid(isValid);
          }}
          label="Amount"
          maxBalance={balance || 0}
        />

        <AddressInput
          value={recipient}
          onChange={(value, isValid) => {
            setRecipient(value);
            setIsRecipientValid(isValid);
          }}
          label="Recipient"
        />

        <TransactionHandler
          buildTransaction={buildTransaction}
          onSuccess={handleSuccess}
          buttonText="Transfer"
          buttonVariant="primary"
        />
      </div>
    </div>
  );
}
```

### Transaction Status Component

**components/features/transaction-status.tsx:**

```typescript
import { useTransaction } from "../../hooks/use-transaction";

export function TransactionStatus() {
  const { status, signature, error } = useTransaction();

  const statusConfig = {
    idle: { text: "", color: "text-gray-500", icon: "" },
    building: {
      text: "Building transaction...",
      color: "text-blue-500",
      icon: "🔨",
    },
    signing: {
      text: "Awaiting signature...",
      color: "text-yellow-500",
      icon: "✍️",
    },
    sending: {
      text: "Sending to network...",
      color: "text-blue-500",
      icon: "📤",
    },
    confirming: { text: "Confirming...", color: "text-blue-500", icon: "⏳" },
    success: {
      text: "Transaction confirmed!",
      color: "text-green-500",
      icon: "✅",
    },
    error: { text: "Transaction failed", color: "text-red-500", icon: "❌" },
  };

  const config = statusConfig[status];

  return (
    <div className="space-y-2">
      {status !== "idle" && (
        <div className={`flex items-center gap-2 ${config.color}`}>
          <span>{config.icon}</span>
          <span>{config.text}</span>
        </div>
      )}

      {signature && (
        <div className="text-sm">
          <span className="text-gray-500">Signature: </span>
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline font-mono"
          >
            {signature.slice(0, 8)}...{signature.slice(-8)}
          </a>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## ⚠️ Error Handling

### Error Boundary

**components/error-boundary.tsx:**

```typescript
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-red-500">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### Error Messages Utility

**lib/errors.ts:**

```typescript
interface ErrorMapping {
  [key: string]: string;
}

const SOLANA_ERRORS: ErrorMapping = {
  // Wallet errors
  "Wallet not connected": "Please connect your wallet to continue.",
  "Wallet disconnect": "Wallet was disconnected. Please reconnect.",

  // Balance errors
  "insufficient funds": "Insufficient balance for this transaction.",
  "Insufficient balance": "You don't have enough SOL or tokens.",

  // Transaction errors
  "failed to send transaction": "Transaction failed to send. Please try again.",
  "Transaction simulation failed":
    "Transaction would fail. Check inputs and try again.",
  "blockhash not found": "Network congestion. Please try again.",
  "custom program error: 0x1": "Insufficient funds for transaction.",

  // Network errors
  "Network request failed": "Network error. Check your connection.",
  ETIMEDOUT: "Request timed out. Please try again.",
  ECONNREFUSED: "Unable to connect to RPC. Try a different endpoint.",

  // Generic errors
  "User rejected the request": "Transaction was cancelled.",
  unknown: "An unexpected error occurred. Please try again.",
};

export function parseError(error: Error | string): string {
  const errorMessage = typeof error === "string" ? error : error.message;

  // Check for known error patterns
  for (const [pattern, message] of Object.entries(SOLANA_ERRORS)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // Return generic message for unknown errors
  return SOLANA_ERRORS.unknown;
}

// Transaction error with more context
export class TransactionError extends Error {
  constructor(message: string, public code?: string, public logs?: string[]) {
    super(message);
    this.name = "TransactionError";
  }
}

export function parseTransactionError(error: any): TransactionError {
  // Parse Anchor errors
  if (error?.error?.errorCode) {
    return new TransactionError(
      error.error.errorMessage || "Transaction failed",
      error.error.errorCode.code,
      error.logs
    );
  }

  // Parse simulation errors
  if (error?.message?.includes("simulation failed")) {
    const logs = error.logs || [];
    return new TransactionError(
      "Transaction simulation failed",
      "SIMULATION_FAILED",
      logs
    );
  }

  // Generic transaction error
  return new TransactionError(parseError(error), "UNKNOWN", error?.logs);
}
```

### Error Handling Hook

**hooks/use-error-handler.ts:**

```typescript
import { useCallback } from "react";
import { useToast } from "../components/ui/toast";
import { parseError, parseTransactionError } from "../lib/errors";

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback(
    (error: Error | unknown, context?: string) => {
      const err = error instanceof Error ? error : new Error(String(error));
      const message = parseError(err);

      console.error(`Error${context ? ` in ${context}` : ""}:`, err);

      toast({
        title: "Error",
        description: message,
        type: "error",
      });

      return message;
    },
    [toast]
  );

  const handleTransactionError = useCallback(
    (error: Error | unknown) => {
      const txError = parseTransactionError(error);

      console.error("Transaction error:", {
        message: txError.message,
        code: txError.code,
        logs: txError.logs,
      });

      toast({
        title: "Transaction Failed",
        description: txError.message,
        type: "error",
      });

      return txError;
    },
    [toast]
  );

  return {
    handleError,
    handleTransactionError,
  };
}
```

---

## ⚙️ Build Configuration

### 1. Vite Setup (Recommended)

**package.json:**

```json
{
  "name": "solana-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@solana/web3.js": "^1.89.0",
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-react-ui": "^0.9.35",
    "@solana/wallet-adapter-wallets": "^0.19.26",
    "@solana/spl-token": "^0.3.9",
    "@tanstack/react-query": "^5.17.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.7",
    "jotai": "^2.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.18.0",
    "@typescript-eslint/parser": "^6.18.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

**vite.config.ts:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Required for buffer in browser
    "process.env": {},
    global: "globalThis",
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          solana: ["@solana/web3.js", "@solana/spl-token"],
          wallet: [
            "@solana/wallet-adapter-base",
            "@solana/wallet-adapter-react",
            "@solana/wallet-adapter-react-ui",
            "@solana/wallet-adapter-wallets",
          ],
        },
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
});
```

### 2. Environment Variables

**.env.example:**

```bash
# Solana Network Configuration
VITE_SOLANA_NETWORK=devnet
VITE_RPC_URL=https://api.devnet.solana.com

# Program IDs
VITE_PROGRAM_ID=YOUR_PROGRAM_ID_HERE

# Optional: Custom RPC endpoints
VITE_MAINNET_RPC_URL=https://api.mainnet-beta.solana.com
VITE_DEVNET_RPC_URL=https://api.devnet.solana.com
VITE_LOCALNET_RPC_URL=http://localhost:8899
```

**lib/env.ts:**

```typescript
// Type-safe environment variables
interface EnvConfig {
  network: string;
  rpcUrl: string;
  programId: string;
}

export function getEnvConfig(): EnvConfig {
  const network = import.meta.env.VITE_SOLANA_NETWORK || "devnet";

  // Priority: custom RPC URL > network-specific RPC > default
  const rpcUrl =
    import.meta.env.VITE_RPC_URL ||
    (network === "mainnet-beta" && import.meta.env.VITE_MAINNET_RPC_URL) ||
    (network === "devnet" && import.meta.env.VITE_DEVNET_RPC_URL) ||
    (network === "localhost" && import.meta.env.VITE_LOCALNET_RPC_URL) ||
    `https://api.${network}.solana.com`;

  return {
    network,
    rpcUrl,
    programId: import.meta.env.VITE_PROGRAM_ID || "",
  };
}
```

### 3. TypeScript Configuration

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**tsconfig.node.json:**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### 4. ESLint Configuration

**.eslintrc.cjs:**

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};
```

### 5. Next.js Alternative

**For SSR/SSG requirements:**

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Handle Solana web3.js in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

---

## 🎯 Best Practices

### 1. Optimize Re-renders

```typescript
// ❌ Bad: Creates new function on every render
function Component() {
  const handleClick = () => {
    /* ... */
  };
  return <Button onClick={handleClick}>Click</Button>;
}

// ✅ Good: Stable function reference
function Component() {
  const handleClick = useCallback(() => {
    // ...
  }, [dependencies]);

  return <Button onClick={handleClick}>Click</Button>;
}

// ✅ Good: Memoize expensive computations
function Component({ data }) {
  const processedData = useMemo(() => {
    return data.map((item) => expensiveTransform(item));
  }, [data]);

  return <List data={processedData} />;
}

// ✅ Good: Memoize components
const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  // Only re-renders if data changes
  return <div>{/* ... */}</div>;
});
```

### 2. Debounce Frequent Updates

```typescript
import { useMemo, useCallback } from "react";
import { debounce } from "lodash-es";

function SearchInput() {
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        // Perform search
        console.log("Searching:", query);
      }, 300),
    []
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(e.target.value);
    },
    [debouncedSearch]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return <input onChange={handleChange} />;
}
```

### 3. Cache RPC Responses

```typescript
// Use React Query for caching
export function useAccountData(pubkey: PublicKey | null) {
  return useQuery({
    queryKey: ["account", pubkey?.toBase58()],
    queryFn: () => fetchAccountData(pubkey!),
    enabled: !!pubkey,
    staleTime: 5000, // Cache for 5 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });
}

// Or implement custom cache
const accountCache = new Map<string, { data: any; timestamp: number }>();

export function getCachedAccount(pubkey: string, maxAge = 5000) {
  const cached = accountCache.get(pubkey);
  if (cached && Date.now() - cached.timestamp < maxAge) {
    return cached.data;
  }
  return null;
}

export function setCachedAccount(pubkey: string, data: any) {
  accountCache.set(pubkey, { data, timestamp: Date.now() });
}
```

### 4. Handle Wallet Disconnection

```typescript
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";

function App() {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (!connected) {
      // Clear sensitive data
      queryClient.clear();
      // Reset state
      resetStores();
      // Show reconnect prompt
      showReconnectModal();
    }
  }, [connected]);

  // ...
}

// Store cleanup on disconnect
function useWalletDisconnectCleanup() {
  const { connected } = useWallet();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!connected) {
      // Clear all cached data
      queryClient.clear();

      // Reset Zustand stores
      useWalletStore.getState().reset();
      useUIStore.getState().reset();
    }
  }, [connected, queryClient]);
}
```

### 5. Test with Multiple Wallets

```typescript
// components/features/wallet-test.tsx
import { useWallet } from "@solana/wallet-adapter-react";

export function WalletTest() {
  const { wallet, publicKey, connected } = useWallet();

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3>Wallet Status</h3>
      <ul className="mt-2 space-y-1 text-sm">
        <li>Wallet: {wallet?.adapter.name || "None"}</li>
        <li>Connected: {connected ? "Yes" : "No"}</li>
        <li>Public Key: {publicKey?.toBase58() || "N/A"}</li>
      </ul>

      {connected && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-600">Test these operations:</p>
          <ul className="text-xs space-y-1">
            <li>✓ View balance</li>
            <li>✓ Send transaction</li>
            <li>✓ Sign message</li>
            <li>✓ Disconnect & reconnect</li>
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 6. Performance Monitoring

```typescript
// lib/performance.ts
export function measurePerformance(name: string) {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
      return duration;
    },
  };
}

// Usage in transaction
async function executeTransaction() {
  const perf = measurePerformance("transaction");

  try {
    const signature = await sendTransaction(transaction, connection);
    perf.end();
    return signature;
  } catch (error) {
    perf.end();
    throw error;
  }
}
```

### 7. Accessibility

```typescript
// ✅ Good: Accessible button
<button
  onClick={handleClick}
  aria-label="Connect wallet"
  aria-busy={isLoading}
  disabled={isLoading}
  className="..."
>
  {isLoading ? 'Connecting...' : 'Connect Wallet'}
</button>

// ✅ Good: Accessible form
<form onSubmit={handleSubmit}>
  <label htmlFor="amount-input" className="sr-only">
    Amount
  </label>
  <input
    id="amount-input"
    type="number"
    value={amount}
    onChange={handleChange}
    aria-describedby="amount-error"
  />
  {error && (
    <p id="amount-error" role="alert" className="text-red-500">
      {error}
    </p>
  )}
</form>
```

### 8. Security Checklist

- ✅ Never store private keys in localStorage
- ✅ Validate all user inputs
- ✅ Sanitize displayed addresses
- ✅ Use environment variables for sensitive config
- ✅ Implement rate limiting for RPC calls
- ✅ Verify transaction signatures
- ✅ Check account ownership before operations

---

## 📦 Complete Example App

### App Component

**src/app.tsx:**

```typescript
import { WalletConnect } from "./components/features/wallet-connect";
import { BalanceDisplay } from "./components/features/balance-display";
import { TransferForm } from "./components/features/transfer-form";
import { NetworkSwitcher } from "./components/features/network-switcher";
import { ThemeToggle } from "./components/features/theme-toggle";
import { useWallet } from "@solana/wallet-adapter-react";

export function App() {
  const { publicKey } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Solana dApp
          </h1>
          <div className="flex items-center gap-4">
            <NetworkSwitcher />
            <ThemeToggle />
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {publicKey ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Balance Card */}
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Your Balance</h2>
              <BalanceDisplay showUsd />
            </div>

            {/* Transfer Form */}
            <div className="card">
              <TransferForm />
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              Welcome to Solana dApp
            </h2>
            <p className="mt-2 text-gray-500">
              Connect your wallet to get started
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          Built with ❤️ using React + Solana
        </div>
      </footer>
    </div>
  );
}
```

---

## 🚀 Getting Started Checklist

- [ ] Initialize Vite React project with TypeScript
- [ ] Install Solana dependencies (web3.js, wallet adapter)
- [ ] Configure Tailwind CSS
- [ ] Setup wallet adapter providers
- [ ] Create SDK context and hooks
- [ ] Implement common components (wallet connect, balance display)
- [ ] Add transaction handling with error states
- [ ] Setup state management (React Query + Zustand/Jotai)
- [ ] Configure environment variables
- [ ] Implement dark mode
- [ ] Add error boundaries
- [ ] Test with multiple wallets
- [ ] Optimize performance (memoization, debouncing)
- [ ] Add accessibility features
- [ ] Configure build process

---

## 📚 Resources

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Wallet Adapter Documentation](https://github.com/anza-xyz/wallet-adapter)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Solana Cookbook](https://solanacookbook.com/)

---

**This agent builds production-ready React dApps with Solana integration. Customize the patterns for your specific program needs.**
