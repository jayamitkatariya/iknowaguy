import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iknowaguy — Agent Portal",
  description: "Manage your human workforce and bounties on iknowaguy.",
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
