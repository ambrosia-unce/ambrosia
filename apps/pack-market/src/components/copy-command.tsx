"use client";

import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyCommand({
  command,
  className,
}: {
  command: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 font-mono text-xs transition-colors hover:border-border sm:px-4 sm:py-2.5 sm:text-sm",
        className,
      )}
    >
      <span className="text-primary/60 select-none">$</span>
      <code className="flex-1 select-all text-foreground/90">{command}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-green-400" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
