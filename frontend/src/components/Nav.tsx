"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Documents" },
  { href: "/analytics", label: "Analytics" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="border-b border-border px-6 py-3 flex items-center justify-between">
      <Link href="/" className="font-semibold tracking-tight">Mnemosyne</Link>
      <div className="flex gap-1">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors
              ${path === link.href ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
