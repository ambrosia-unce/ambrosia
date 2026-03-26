"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-red-500/10 bg-red-500/5">
        <AlertCircle className="size-6 text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold tracking-tight">
          Something went wrong
        </h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground/50">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <Button
        onClick={reset}
        variant="outline"
        className="rounded-xl border-border/40"
      >
        <RefreshCw className="mr-2 size-3.5" />
        Try again
      </Button>
    </div>
  );
}
