"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getStoredUser, logout } from "@/lib/api";
import {
  Sparkles,
  LayoutDashboard,
  FileEdit,
  LogIn,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/");
  };

  const links = [
    { href: "/", label: "Analyze", icon: Sparkles },
    { href: "/generate", label: "Generate CV", icon: FileEdit },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <nav className="glass-strong sticky top-4 mx-4 md:mx-8 mt-4 px-6 py-3 flex items-center justify-between z-50">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-lg tracking-tight">
          Smart CV
        </span>
        <span className="hidden sm:inline text-xs text-white/40 ml-1">
          by Archer Infotech
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`nav-link flex items-center gap-2 ${
              pathname === l.href ? "active" : ""
            }`}
          >
            <l.icon className="w-4 h-4" />
            {l.label}
          </Link>
        ))}
        <div className="w-px h-6 bg-white/10 mx-2" />
        {user ? (
          <button onClick={handleLogout} className="nav-link flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        ) : (
          <Link href="/auth/login" className="nav-link flex items-center gap-2">
            <LogIn className="w-4 h-4" /> Login
          </Link>
        )}
      </div>

      {/* Mobile toggle */}
      <button className="md:hidden text-white/70" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 mx-0 glass-strong p-4 flex flex-col gap-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`nav-link flex items-center gap-2 ${
                pathname === l.href ? "active" : ""
              }`}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="nav-link flex items-center gap-2 text-left">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          ) : (
            <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="nav-link flex items-center gap-2">
              <LogIn className="w-4 h-4" /> Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
