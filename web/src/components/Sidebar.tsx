"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Novo anúncio" },
  { href: "/produtos", label: "Meus produtos" },
  { href: "/prompts", label: "Prompts" },
];

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="px-5 py-6">
        <p className="text-lg font-bold text-zinc-900">Anúncio Fácil</p>
        <p className="text-xs text-zinc-500">AliExpress → OLX/Marketplace</p>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <a
        href="/api/logout"
        className="mt-auto px-5 py-4 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
      >
        Sair
      </a>
    </aside>
  );
}
