import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'iknowaguy — Give your AI agents access to human workers',
  description: 'Local-first developer tool that connects AI agents to human workers via MCP server. 17 tools for discovery, assignment, communication, and payments.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
