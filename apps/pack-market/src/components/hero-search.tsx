"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/packs?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/packs");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search packs... (e.g. jwt, database, cache)"
        className="h-11 rounded-xl border-border/50 bg-muted/30 pl-11 pr-4 text-sm transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-muted/50"
      />
    </form>
  );
}
