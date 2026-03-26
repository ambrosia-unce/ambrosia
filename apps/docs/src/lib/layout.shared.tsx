import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { i18n } from "@/lib/i18n";
import { PackagesDropdown } from "@/components/packages-dropdown";

const navTranslations: Record<string, { packMarket: string }> = {
  ru: { packMarket: "Pack Market" },
  en: { packMarket: "Pack Market" },
};

export function baseOptions(locale: string): BaseLayoutProps {
  const t = navTranslations[locale] ?? navTranslations.en;

  return {
    i18n,
    themeSwitch: {
      enabled: false,
    },
    nav: {
      title: (
        <span className="font-bold tracking-tight">
          <span className="text-gradient">ambrosia</span>
        </span>
      ),
    },
    links: [
      {
        type: 'custom',
        on: 'nav',
        children: <PackagesDropdown locale={locale} />,
      },
      {
        text: t.packMarket,
        url: 'https://packs.ambrosia.dev',
        on: 'nav',
      },
      {
        text: 'GitHub',
        url: 'https://github.com/unmake/ambrosia',
        external: true,
        on: 'nav',
      },
    ],
  };
}
