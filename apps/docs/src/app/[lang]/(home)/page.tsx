import Link from "next/link";
import {
  ArrowRight,
  Box,
  Code2,
  Cpu,
  Globe,
  Layers,
  Lock,
  Package,
  Radio,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import { getLandingT, type LandingTranslations } from "@/lib/landing-i18n";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const t = getLandingT(lang);

  return (
    <main className="flex flex-1 flex-col">
      <Hero t={t} lang={lang} />
      <Features t={t} />
      <CodeExamples t={t} />
      <WhyAmbrosia t={t} />
      <Packages t={t} lang={lang} />
      <GettingStarted t={t} lang={lang} />
      <Footer t={t} lang={lang} />
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero({ t, lang }: { t: LandingTranslations; lang: string }) {
  return (
    <section className="relative overflow-hidden border-b border-fd-border/30">
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-fd-primary/[0.04] via-transparent to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[640px] rounded-full opacity-30"
        style={{
          background:
            "radial-gradient(ellipse, oklch(0.72 0.14 200 / 20%) 0%, transparent 70%)",
        }}
      />

      <div className="container relative mx-auto px-6 pb-20 pt-24 sm:pb-28 sm:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-fd-border/40 bg-fd-card/30 px-4 py-1.5 text-[12px] text-fd-muted-foreground backdrop-blur-sm">
            <Zap className="size-3.5 text-fd-primary" />
            {t.badge}
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-gradient">{t.heroTitle1}</span>
            <br />
            <span className="text-fd-foreground">{t.heroTitle2}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-fd-muted-foreground/70 sm:text-lg">
            {t.heroDescription}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/${lang}/docs`}
              className="inline-flex items-center gap-2 rounded-xl bg-fd-primary px-6 py-3 text-[14px] font-semibold text-fd-primary-foreground transition-all hover:opacity-90 glow-sm"
            >
              {t.getStarted}
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://packs.ambrosia.dev"
              className="inline-flex items-center gap-2 rounded-xl border border-fd-border/40 bg-fd-card/30 px-6 py-3 text-[14px] font-medium text-fd-foreground backdrop-blur transition-all hover:bg-fd-card/60"
            >
              {t.browsePacks}
              <Package className="size-4" />
            </a>
          </div>

          {/* Hero code snippet */}
          <div className="mx-auto mt-16 max-w-xl">
            <div className="overflow-hidden rounded-xl border border-fd-border/40 bg-fd-card/40 backdrop-blur">
              <div className="flex items-center gap-2 border-b border-fd-border/20 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="ml-2 font-mono text-[11px] text-fd-muted-foreground/40">
                  user.controller.ts
                </span>
              </div>
              <pre className="overflow-x-auto p-5 text-left text-sm leading-relaxed font-mono">
                <code>
                  <Line><Kw>@Controller</Kw><Punc>(</Punc><Str>&quot;/users&quot;</Str><Punc>)</Punc></Line>
                  <Line><Kw>class</Kw> <Type>UserController</Type> <Punc>{"{"}</Punc></Line>
                  <Line indent={2}><Kw>constructor</Kw><Punc>(</Punc><Kw>private</Kw> <Ident>userService</Ident><Punc>:</Punc> <Type>UserService</Type><Punc>)</Punc> <Punc>{"{}"}</Punc></Line>
                  <Line />
                  <Line indent={2}><Kw>@Http.Get</Kw><Punc>(</Punc><Str>&quot;/&quot;</Str><Punc>)</Punc></Line>
                  <Line indent={2}><Fn>getAll</Fn><Punc>() {"{"}</Punc></Line>
                  <Line indent={4}><Kw>return</Kw> <Kw>this</Kw><Punc>.</Punc><Ident>userService</Ident><Punc>.</Punc><Fn>findAll</Fn><Punc>();</Punc></Line>
                  <Line indent={2}><Punc>{"}"}</Punc></Line>
                  <Line><Punc>{"}"}</Punc></Line>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features Grid                                                      */
/* ------------------------------------------------------------------ */

function Features({ t }: { t: LandingTranslations }) {
  const features = [
    { icon: Box, ...t.features.di },
    { icon: Globe, ...t.features.http },
    { icon: Radio, ...t.features.ws },
    { icon: Shield, ...t.features.validation },
    { icon: Terminal, ...t.features.cli },
    { icon: Package, ...t.features.packs },
  ];

  return (
    <section className="border-b border-fd-border/30" id="features">
      <div className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.featuresTitle}</h2>
          <p className="mt-3 text-[14px] text-fd-muted-foreground/60">{t.featuresDescription}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group flex flex-col rounded-xl border border-fd-border/30 bg-fd-card/20 p-5 transition-all duration-200 hover:border-fd-primary/20 hover:bg-fd-card/40"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-fd-primary/10">
                <f.icon className="size-4 text-fd-primary" />
              </div>
              <h3 className="text-[14px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-fd-muted-foreground/50">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Code Examples                                                      */
/* ------------------------------------------------------------------ */

type Token = { t: string; v: string };
type CodeLine = { tokens: Token[] };

const codeExamples: { tab: string; filename: string; lines: CodeLine[] }[] = [
  {
    tab: "DI & Packs",
    filename: "app.pack.ts",
    lines: [
      { tokens: [{ t: "kw", v: "import" }, { t: "p", v: " { " }, { t: "type", v: "definePack" }, { t: "p", v: " } " }, { t: "kw", v: "from" }, { t: "s", v: ' "@ambrosia/core"' }] },
      { tokens: [] },
      { tokens: [{ t: "kw", v: "export const" }, { t: "id", v: " AppPack" }, { t: "p", v: " = " }, { t: "fn", v: "definePack" }, { t: "p", v: "({" }] },
      { tokens: [{ t: "id", v: "  providers" }, { t: "p", v: ": [" }, { t: "type", v: "UserService" }, { t: "p", v: ", " }, { t: "type", v: "AuthService" }, { t: "p", v: "]," }] },
      { tokens: [{ t: "id", v: "  exports" }, { t: "p", v: ": [" }, { t: "type", v: "UserService" }, { t: "p", v: "]," }] },
      { tokens: [{ t: "id", v: "  imports" }, { t: "p", v: ": [" }, { t: "type", v: "DatabasePack" }, { t: "p", v: "]," }] },
      { tokens: [{ t: "p", v: "})" }] },
    ],
  },
  {
    tab: "Guards & Auth",
    filename: "auth.guard.ts",
    lines: [
      { tokens: [{ t: "kw", v: "@Injectable" }, { t: "p", v: "()" }] },
      { tokens: [{ t: "kw", v: "class" }, { t: "type", v: " AuthGuard" }, { t: "kw", v: " implements" }, { t: "type", v: " Guard" }, { t: "p", v: " {" }] },
      { tokens: [{ t: "kw", v: "  constructor" }, { t: "p", v: "(" }, { t: "kw", v: "private" }, { t: "id", v: " jwt" }, { t: "p", v: ": " }, { t: "type", v: "JwtService" }, { t: "p", v: ") {}" }] },
      { tokens: [] },
      { tokens: [{ t: "fn", v: "  canActivate" }, { t: "p", v: "(" }, { t: "id", v: "ctx" }, { t: "p", v: ": " }, { t: "type", v: "ExecutionContext" }, { t: "p", v: ") {" }] },
      { tokens: [{ t: "kw", v: "    const" }, { t: "id", v: " token" }, { t: "p", v: " = " }, { t: "id", v: "ctx" }, { t: "p", v: "." }, { t: "fn", v: "getHeader" }, { t: "p", v: "(" }, { t: "s", v: '"Authorization"' }, { t: "p", v: ")" }] },
      { tokens: [{ t: "kw", v: "    return" }, { t: "kw", v: " this" }, { t: "p", v: "." }, { t: "id", v: "jwt" }, { t: "p", v: "." }, { t: "fn", v: "verify" }, { t: "p", v: "(" }, { t: "id", v: "token" }, { t: "p", v: ")" }] },
      { tokens: [{ t: "p", v: "  }" }] },
      { tokens: [{ t: "p", v: "}" }] },
    ],
  },
  {
    tab: "Validation",
    filename: "create-user.dto.ts",
    lines: [
      { tokens: [{ t: "kw", v: "import" }, { t: "p", v: " { " }, { t: "type", v: "assert" }, { t: "p", v: ", " }, { t: "type", v: "Email" }, { t: "p", v: " } " }, { t: "kw", v: "from" }, { t: "s", v: ' "@ambrosia/validator"' }] },
      { tokens: [] },
      { tokens: [{ t: "kw", v: "interface" }, { t: "type", v: " CreateUserDto" }, { t: "p", v: " {" }] },
      { tokens: [{ t: "id", v: "  name" }, { t: "p", v: ": " }, { t: "type", v: "string" }] },
      { tokens: [{ t: "id", v: "  email" }, { t: "p", v: ": " }, { t: "type", v: "Email" }] },
      { tokens: [{ t: "p", v: "}" }] },
      { tokens: [] },
      { tokens: [{ t: "c", v: "// Compiled to optimized validation at build time" }] },
      { tokens: [{ t: "kw", v: "const" }, { t: "id", v: " user" }, { t: "p", v: " = " }, { t: "fn", v: "assert" }, { t: "p", v: "<" }, { t: "type", v: "CreateUserDto" }, { t: "p", v: ">(" }, { t: "id", v: "body" }, { t: "p", v: ")" }] },
    ],
  },
];

function CodeExamples({ t }: { t: LandingTranslations }) {
  return (
    <section className="border-b border-fd-border/30 bg-grid-pattern" id="examples">
      <div className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.codeTitle}</h2>
          <p className="mt-3 text-[14px] text-fd-muted-foreground/60">{t.codeDescription}</p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-4">
          {codeExamples.map((ex) => (
            <div key={ex.tab} className="overflow-hidden rounded-xl border border-fd-border/30 bg-fd-card/40 backdrop-blur">
              <div className="flex items-center gap-3 border-b border-fd-border/20 px-5 py-3">
                <Code2 className="size-4 text-fd-primary" />
                <span className="text-sm font-medium text-fd-foreground">{ex.tab}</span>
                <span className="ml-auto font-mono text-[11px] text-fd-muted-foreground/40">{ex.filename}</span>
              </div>
              <pre className="overflow-x-auto p-5 text-sm leading-relaxed font-mono">
                <code>
                  {ex.lines.map((line, i) => (
                    <div key={i}>
                      {line.tokens.length === 0
                        ? "\n"
                        : line.tokens.map((tok, j) => (
                            <span key={j} className={tokenClass(tok.t)}>{tok.v}</span>
                          ))}
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Why Ambrosia                                                       */
/* ------------------------------------------------------------------ */

function WhyAmbrosia({ t }: { t: LandingTranslations }) {
  const reasons = [
    { icon: Cpu, ...t.why.bun },
    { icon: Zap, ...t.why.pipelines },
    { icon: Layers, ...t.why.zeroOverhead },
    { icon: Package, ...t.why.ecosystem },
  ];

  return (
    <section className="border-b border-fd-border/30" id="why">
      <div className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.whyTitle}</h2>
          <p className="mt-3 text-[14px] text-fd-muted-foreground/60">{t.whyDescription}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
          {reasons.map((r) => (
            <div key={r.title} className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-fd-primary/10">
                <r.icon className="size-5 text-fd-primary" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold">{r.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-fd-muted-foreground/50">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Packages                                                           */
/* ------------------------------------------------------------------ */

function Packages({ t, lang }: { t: LandingTranslations; lang: string }) {
  return (
    <section className="border-b border-fd-border/30">
      <div className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.packagesTitle}</h2>
          <p className="mt-3 text-[14px] text-fd-muted-foreground/60">{t.packagesDescription}</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
          <PackageCard name="@ambrosia/core" description={t.packages.core} href={`/${lang}/docs/core`} icon={Cpu} />
          <PackageCard name="@ambrosia/http" description={t.packages.http} href={`/${lang}/docs/http`} icon={Globe} />
          <PackageCard name="@ambrosia/validator" description={t.packages.validator} href={`/${lang}/docs/validator`} icon={Lock} />
          <PackageCard name="@ambrosia/cli" description={t.packages.cli} href={`/${lang}/docs/cli`} icon={Terminal} />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Getting Started                                                    */
/* ------------------------------------------------------------------ */

function GettingStarted({ t, lang }: { t: LandingTranslations; lang: string }) {
  return (
    <section className="border-b border-fd-border/30" id="quickstart">
      <div className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-fd-primary/10">
              <Terminal className="size-5 text-fd-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{t.quickstartTitle}</h2>
          <p className="mt-3 text-[14px] text-fd-muted-foreground/60">{t.quickstartDescription}</p>

          <div className="mx-auto mt-8 max-w-sm space-y-2.5">
            <StepCommand step={1} command="bun add -g @ambrosia/cli" />
            <StepCommand step={2} command="ambrosia new my-app" />
            <StepCommand step={3} command="cd my-app && bun run dev" />
          </div>

          <div className="mt-10">
            <Link
              href={`/${lang}/docs`}
              className="inline-flex items-center gap-2 rounded-xl bg-fd-primary px-6 py-3 text-[14px] font-semibold text-fd-primary-foreground transition-all hover:opacity-90"
            >
              {t.readDocs}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer({ t, lang }: { t: LandingTranslations; lang: string }) {
  const footerLinks = [
    { label: t.footer.docs, href: `/${lang}/docs` },
    { label: t.footer.packMarket, href: "https://packs.ambrosia.dev" },
    { label: "GitHub", href: "https://github.com/ambrosia-unce/ambrosia" },
    { label: "Discord", href: "https://discord.gg/ambrosia" },
  ];

  return (
    <footer className="py-10">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gradient">ambrosia</span>
            <span className="rounded-md border border-fd-border/40 bg-fd-card/30 px-2 py-0.5 font-mono text-[11px] text-fd-muted-foreground/40">
              Built with Bun
            </span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-fd-muted-foreground/40">
            {footerLinks.map((link) => (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-fd-foreground">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 text-center text-[11px] text-fd-muted-foreground/30">
          MIT License &middot; &copy; {new Date().getFullYear()} Ambrosia
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Syntax helpers                                                     */
/* ------------------------------------------------------------------ */

function tokenClass(t: string): string {
  switch (t) {
    case "kw": return "text-[oklch(0.72_0.14_200)]";
    case "type": return "text-[oklch(0.78_0.15_80)]";
    case "s": return "text-[oklch(0.75_0.16_150)]";
    case "fn": return "text-[oklch(0.78_0.12_260)]";
    case "id": return "text-fd-foreground";
    case "p": return "text-fd-muted-foreground";
    case "c": return "text-fd-muted-foreground/60 italic";
    default: return "text-fd-foreground";
  }
}

function Line({ children, indent = 0 }: { children?: React.ReactNode; indent?: number }) {
  return <div>{indent > 0 && <span>{" ".repeat(indent)}</span>}{children}</div>;
}
function Kw({ children }: { children: React.ReactNode }) { return <span className="text-[oklch(0.72_0.14_200)]">{children}</span>; }
function Type({ children }: { children: React.ReactNode }) { return <span className="text-[oklch(0.78_0.15_80)]">{children}</span>; }
function Str({ children }: { children: React.ReactNode }) { return <span className="text-[oklch(0.75_0.16_150)]">{children}</span>; }
function Fn({ children }: { children: React.ReactNode }) { return <span className="text-[oklch(0.78_0.12_260)]">{children}</span>; }
function Ident({ children }: { children: React.ReactNode }) { return <span className="text-fd-foreground">{children}</span>; }
function Punc({ children }: { children: React.ReactNode }) { return <span className="text-fd-muted-foreground">{children}</span>; }

function PackageCard({ name, description, href, icon: Icon }: { name: string; description: string; href: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link href={href} className="group block">
      <div className="flex h-full items-start gap-4 rounded-xl border border-fd-border/30 bg-fd-card/20 p-5 transition-all duration-200 hover:border-fd-primary/20 hover:bg-fd-card/40">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-primary/10">
          <Icon className="size-4.5 text-fd-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-mono text-[13px] font-semibold transition-colors group-hover:text-fd-primary">{name}</h3>
          <p className="mt-1 text-[12px] leading-relaxed text-fd-muted-foreground/50">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function StepCommand({ step, command }: { step: number; command: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-fd-primary/10 text-[11px] font-bold text-fd-primary">{step}</span>
      <div className="flex flex-1 items-center gap-2 rounded-xl border border-fd-border/40 bg-fd-muted/20 px-4 py-2.5 font-mono text-[13px]">
        <span className="select-none text-fd-primary/50">$</span>
        <code className="flex-1 select-all text-fd-foreground/80">{command}</code>
      </div>
    </div>
  );
}
