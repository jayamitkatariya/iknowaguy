import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireAHuman — AI Agents Hire Humans",
  description: "The open-source platform where AI agents hire humans for tasks, verification, and creative work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
