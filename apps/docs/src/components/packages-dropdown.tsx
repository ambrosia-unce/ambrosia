'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Box, Globe, Shield, Terminal, KeyRound, FileText, Database, Zap } from 'lucide-react';

const modules = [
  { key: 'core', icon: Box, label: 'Core', description: 'DI Container & Pack System', details: 'Token-based dependency injection with singleton, request, and transient scopes. Pack system for modular composition.' },
  { key: 'http', icon: Globe, label: 'HTTP', description: 'Controllers & Pipeline', details: 'Pre-compiled request pipeline with middleware, guards, interceptors, pipes, and filters. Provider-agnostic.' },
  { key: 'validator', icon: Shield, label: 'Validator', description: 'Compile-time Validation', details: 'TypeScript types become runtime validators via Bun preload plugin. Zero overhead, branded types support.' },
  { key: 'cli', icon: Terminal, label: 'CLI', description: 'Scaffolding & Packs', details: 'Project scaffolding, pack management, code generators. 4 architecture templates included.' },
  { key: 'auth', icon: KeyRound, label: 'Auth', description: 'JWT Authentication', details: 'JWT token signing, verification, refresh rotation. Guards, decorators, and RBAC support.' },
  { key: 'logger', icon: FileText, label: 'Logger', description: 'Structured Logging', details: 'JSON and pretty formatters, child loggers, HTTP middleware with timing. Configurable log levels.' },
  { key: 'orm', icon: Database, label: 'ORM', description: 'Drizzle Integration', details: 'Drizzle ORM wrapper with transaction propagation via AsyncLocalStorage. Multi-driver support.' },
  { key: 'websocket', icon: Zap, label: 'WebSocket', description: 'Real-time Gateway', details: 'Decorator-based gateways with rooms, namespaces, and event handlers. Same DI integration.' },
];

export function PackagesDropdown({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  const active = modules[hovered];

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className="inline-flex items-center gap-1 text-sm font-medium text-fd-muted-foreground transition-colors hover:text-fd-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        {locale === 'ru' ? 'Пакеты' : 'Packages'}
        <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex w-[540px] overflow-hidden rounded-xl border border-fd-border/40 bg-fd-popover shadow-2xl shadow-black/40">
            {/* Left: list */}
            <div className="w-[220px] border-r border-fd-border/20 py-2">
              {modules.map((m, i) => {
                const Icon = m.icon;
                return (
                  <Link
                    key={m.key}
                    href={`/${locale}/docs/${m.key}`}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      hovered === i
                        ? 'bg-fd-primary/10 text-fd-primary'
                        : 'text-fd-muted-foreground hover:text-fd-foreground'
                    }`}
                    onMouseEnter={() => setHovered(i)}
                    onClick={() => setOpen(false)}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="font-medium">{m.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right: detail */}
            <div className="flex w-[320px] flex-col justify-center p-6">
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-fd-primary/10">
                <active.icon className="size-5 text-fd-primary" />
              </div>
              <h3 className="text-base font-semibold text-fd-foreground">{active.label}</h3>
              <p className="mt-0.5 text-xs font-medium text-fd-primary/70">{active.description}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-fd-muted-foreground/70">{active.details}</p>
              <Link
                href={`/${locale}/docs/${active.key}`}
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-fd-primary transition-colors hover:text-fd-primary/80"
                onClick={() => setOpen(false)}
              >
                {locale === 'ru' ? 'Открыть документацию' : 'Open docs'} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
