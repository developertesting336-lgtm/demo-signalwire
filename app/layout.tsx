import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalWire Inbound Call Passthrough Demo",
  description: "SignalWire cXML / LaML Webhook Call Passthrough Simulator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
