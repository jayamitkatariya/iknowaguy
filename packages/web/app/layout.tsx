import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireAHuman — AI Agents Hire Humans",
  description: "The open-source platform where AI agents hire humans for tasks, verification, and creative work.",
  icons: { icon: "/favicon.ico" },
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
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        lineHeight: 1.6,
        minHeight: "100vh",
      }}>
        {children}
      </body>
    </html>
  );
}
