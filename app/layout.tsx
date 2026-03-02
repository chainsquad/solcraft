import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Solana AI Developer - Blockchain-AI Agent for Solana Development",
  description: "Specialized AI agent for Solana/Web3 development. Deep expertise in Anchor, smart contracts, and blockchain security. Simple, fast, autonomous.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${robotoMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
