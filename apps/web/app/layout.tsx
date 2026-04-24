import type { Metadata } from "next";
import { AppProviders } from "../src/components/providers";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Petadot",
  description: "Petadot rebuild workspace"
};

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  const content =
    process.env.NEXT_PHASE === "phase-production-build"
      ? children
      : <AppProviders>{children}</AppProviders>;

  return (
    <html lang="en">
      <body>{content}</body>
    </html>
  );
}
