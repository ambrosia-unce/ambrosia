const translations = {
  ru: {
    badge: "Создан с нуля для Bun",
    heroTitle1: "Bun-фреймворк",
    heroTitle2: "для современных бэкендов",
    heroDescription:
      "Декораторный DI, провайдер-агностичный HTTP, compile-time валидация и экосистема паков. Создан с нуля для Bun.",
    getStarted: "Начать",
    browsePacks: "Паки",
    featuresTitle: "Всё что нужно",
    featuresDescription:
      "Полный набор инструментов для production бэкендов на Bun.",
    codeTitle: "Чистый, выразительный API",
    codeDescription:
      "Меньше boilerplate. Каждая фича построена на декораторах и типобезопасна.",
    whyTitle: "Почему Ambrosia?",
    whyDescription: "Создан специально для экосистемы Bun. Не ещё один порт с Node.",
    packagesTitle: "Модульный по дизайну",
    packagesDescription:
      "Используйте только то, что нужно. Каждый пакет независим.",
    quickstartTitle: "Старт за секунды",
    quickstartDescription:
      "Одна команда для создания production-ready проекта.",
    readDocs: "Читать документацию",
    features: {
      di: { title: "Dependency Injection", description: "Токен-based DI с 3 скоупами: singleton, request, transient. Pack-система для модульной композиции." },
      http: { title: "HTTP Layer", description: "Пре-компилированный pipeline: middleware → guards → interceptors → pipes → handler. Провайдер-агностичный." },
      ws: { title: "WebSocket", description: "Декораторные гейтвеи с комнатами, пространствами имён и обработчиками событий. Та же DI интеграция." },
      validation: { title: "Compile-time валидация", description: "TypeScript типы становятся runtime-валидаторами. Zero overhead через Bun preload плагин." },
      cli: { title: "CLI и генераторы", description: "ambrosia new, генераторы, 4 архитектурных шаблона. Управление паками встроено." },
      packs: { title: "Экосистема паков", description: "Паки в стиле shadcn/ui: ищите, устанавливайте, публикуйте. Код ваш." },
    },
    why: {
      bun: { title: "Создан для Bun", description: "Не портирован с Node.js. Каждый API, шаг сборки и runtime-допущение — Bun-native." },
      pipelines: { title: "Пре-компилированные пайплайны", description: "Pipeline обработчиков компилируется при старте. Никакого overhead на каждый запрос." },
      zeroOverhead: { title: "Zero-overhead валидация", description: "TypeScript типы компилируются в оптимизированные валидаторы через Bun preload плагин." },
      ecosystem: { title: "Экосистема паков", description: "Устанавливайте что нужно, владейте кодом. Как shadcn/ui, но для бэкенд-модулей." },
    },
    packages: {
      core: "DI контейнер, pack-система, плагины, управление жизненным циклом.",
      http: "Контроллеры, guards, interceptors, pipes, filters, middleware, SSE, OpenAPI.",
      validator: "Compile-time валидация типов через TypeScript transformer плагин.",
      cli: "CLI для генерации. Создание проектов, генерация паков, управление registry.",
    },
    footer: { docs: "Документация", packMarket: "Pack Market" },
  },
  en: {
    badge: "Built from the ground up for Bun",
    heroTitle1: "The Bun Framework",
    heroTitle2: "for Modern Backends",
    heroDescription:
      "Decorator-based DI, provider-agnostic HTTP, compile-time validation, and a pack ecosystem. Built from the ground up for Bun.",
    getStarted: "Get Started",
    browsePacks: "Browse Packs",
    featuresTitle: "Everything you need",
    featuresDescription:
      "A complete toolkit for building production backends on Bun.",
    codeTitle: "Clean, expressive APIs",
    codeDescription:
      "Write less boilerplate. Every feature is decorator-driven and type-safe.",
    whyTitle: "Why Ambrosia?",
    whyDescription: "Purpose-built for the Bun ecosystem. Not another Node port.",
    packagesTitle: "Modular by design",
    packagesDescription:
      "Use only what you need. Each package is independent and well-scoped.",
    quickstartTitle: "Get started in seconds",
    quickstartDescription:
      "One command to scaffold a production-ready project.",
    readDocs: "Read the documentation",
    features: {
      di: { title: "Dependency Injection", description: "Token-based DI with 3 scopes: singleton, request, transient. Pack system for modular composition." },
      http: { title: "HTTP Layer", description: "Pre-compiled request pipeline: middleware → guards → interceptors → pipes → handler. Provider-agnostic." },
      ws: { title: "WebSocket", description: "Decorator-based gateways with rooms, namespaces, and event handlers. Same DI integration." },
      validation: { title: "Compile-time Validation", description: "TypeScript types become runtime validators. Zero overhead via Bun preload plugin." },
      cli: { title: "CLI & Scaffolding", description: "ambrosia new, generators, 4 architecture templates. Pack management built-in." },
      packs: { title: "Pack Ecosystem", description: "shadcn-style packs: browse, install, publish. Own your code." },
    },
    why: {
      bun: { title: "Built for Bun", description: "Not ported from Node.js. Every API, build step, and runtime assumption is Bun-native." },
      pipelines: { title: "Pre-compiled Pipelines", description: "Route handler pipelines are compiled at startup. No per-request resolution overhead." },
      zeroOverhead: { title: "Zero-overhead Validation", description: "TypeScript types compile to optimized validators via a Bun preload plugin. No runtime schema parsing." },
      ecosystem: { title: "Pack Ecosystem", description: "Install what you need, own the code. Like shadcn/ui but for backend modules." },
    },
    packages: {
      core: "DI container, pack system, plugin architecture, lifecycle management.",
      http: "Controllers, guards, interceptors, pipes, filters, middleware, SSE, OpenAPI.",
      validator: "Compile-time type validation via TypeScript transformer plugin.",
      cli: "Scaffolding CLI. Create projects, generate packs, manage registry.",
    },
    footer: { docs: "Docs", packMarket: "Pack Market" },
  },
} as const;

export type LandingTranslations = typeof translations.en;

export function getLandingT(lang: string): LandingTranslations {
  return translations[lang as keyof typeof translations] ?? translations.en;
}
