import './globals.css';

export const metadata = {
  title: 'iknowaguy — Give your AI agents access to human workers',
  description: 'Local-first developer tool that gives AI agents access to human workers via MCP server.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}