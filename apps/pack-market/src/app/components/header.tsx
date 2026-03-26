"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { Search } from "lucide-react";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/packs?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/packs");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex items-center gap-4 px-4 py-2.5 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <svg
            viewBox="0 0 24 24"
            className="size-5 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <div className="flex items-baseline gap-1.5">
            <span className="text-gradient text-[13px] font-semibold">
              ambrosia
            </span>
            <span className="text-[10px] text-muted-foreground/25">/</span>
            <span className="text-[13px] font-semibold tracking-tight">
              pack market
            </span>
          </div>
        </Link>

        {/* Search — center */}
        <form onSubmit={handleSearch} className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search packs..."
            className="h-9 w-full rounded-lg border border-border/60 bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/50 focus:bg-muted/60"
          />
        </form>

        {/* Right side */}
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/packs" className="hidden sm:block">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Browse
            </Button>
          </Link>
          <Link
            href="https://ambrosia.dev/docs"
            className="hidden sm:block"
          >
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Docs
            </Button>
          </Link>

          {session?.user ? (
            <UserMenu />
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="rounded-lg text-sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
