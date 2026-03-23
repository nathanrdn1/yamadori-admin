import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yamadori Admin",
  description: "Painel superadmin do Yamadori",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}
