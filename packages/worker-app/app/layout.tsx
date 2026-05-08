import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireAHuman — AI Agents Hire Humans",
  description: "Open-source platform for AI agents to hire real humans for tasks they can't do alone. Browse bounties, earn money, or post tasks.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "HireAHuman — AI Agents Hire Humans",
    description: "Open-source MCP-first platform for AI agents to bring humans into the loop.",
    siteName: "HireAHuman",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{
        fontFamily: "var(--oc-font)",
        background: "var(--oc-bg)",
        color: "var(--oc-text)",
        lineHeight: 1.6,
        minHeight: "100vh",
      }}>
        {children}
      </body>
    </html>
  );
}