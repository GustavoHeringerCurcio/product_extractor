import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Anúncio Fácil — do AliExpress ao OLX/Marketplace",
  description:
    "Transforme prints do AliExpress em título, descrição e preço prontos para o seu anúncio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full">
        <Sidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
