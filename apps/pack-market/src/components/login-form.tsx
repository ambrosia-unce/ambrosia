"use client";

import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Github, Shield } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Sign in to Pack Market
        </h1>
        <p className="max-w-xs text-balance text-[13px] leading-relaxed text-muted-foreground/70">
          Connect your GitHub account to publish and manage packs for the
          Ambrosia framework.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full rounded-xl py-6"
          onClick={() => signIn("github", { callbackUrl: "/" })}
        >
          <Github className="mr-2.5 size-5" />
          Continue with GitHub
        </Button>

        <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2.5">
          <Shield className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
          <p className="text-[11px] leading-relaxed text-muted-foreground/50">
            We only request access to your public profile and public
            repositories. Your code is never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
