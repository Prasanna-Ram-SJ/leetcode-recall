"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "./ThemeToggle";
import { BookOpen, RotateCcw, LayoutDashboard, LogOut, Code2 } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  username?: string | null;
}

export function Navbar({ username }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/library", label: "Problem Library", icon: BookOpen },
    { href: "/lists", label: "Recall Lists", icon: RotateCcw },
  ];

  return (
    <header className="border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href={username ? "/dashboard" : "/"}
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black text-base shadow-sm">
            <Code2 className="w-5 h-5" />
          </div>
          <span className="text-slate-900 dark:text-white font-extrabold">
            LeetCode <span className="text-amber-500">Recall</span>
          </span>
        </Link>

        {/* Authenticated Nav */}
        {username && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-amber-500/15 text-amber-900 dark:text-amber-400 font-semibold"
                      : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {username ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-zinc-800">
              <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                @{username}
              </span>
              <button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                aria-label="Sign out"
                title="Sign out"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold px-3.5 py-2 rounded-lg btn-yellow shadow-sm"
            >
              Log in / Sign up
            </Link>
          )}
        </div>
      </div>

      {/* Mobile nav row */}
      {username && (
        <div className="md:hidden flex border-t border-slate-200 dark:border-zinc-800 px-4 py-2 bg-slate-50 dark:bg-zinc-900/50 justify-around text-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md ${
                  isActive
                    ? "font-bold text-amber-600 dark:text-amber-400"
                    : "text-slate-600 dark:text-zinc-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
