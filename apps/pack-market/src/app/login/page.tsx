import Link from "next/link";
import { Package, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left panel — decorative */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        {/* Background layers */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-primary/[0.03]" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary/[0.08] blur-[80px]" />
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/[0.06] blur-[60px]" />

        {/* Content */}
        <div className="relative flex flex-1 flex-col justify-center px-12">
          <div className="max-w-sm">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/30 bg-card/20 px-3 py-1.5 text-[11px] text-muted-foreground/60">
              <Sparkles className="size-3 text-primary" />
              Open source pack ecosystem
            </div>

            <h2 className="text-gradient text-3xl font-extrabold tracking-tight">
              Build faster with community packs
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground/50">
              Discover pre-built integrations for databases, auth, caching,
              messaging, and more. Publish your own packs and share them with the
              community.
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-3">
              {[
                "One-command install with ambrosia add",
                "Source-level distribution — no black boxes",
                "Publish directly from GitHub repos",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2.5 text-[12px] text-muted-foreground/40"
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <span className="size-1.5 rounded-full bg-primary" />
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="relative px-12 py-6">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground/30">
            <span className="text-gradient font-semibold">Ambrosia</span>
            Pack Market
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-col p-8 md:p-12">
        <div className="flex justify-center gap-2.5 md:justify-start">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Package className="size-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight">Ambrosia</span>
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Pack
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
