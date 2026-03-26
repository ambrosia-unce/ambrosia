import {RootProvider} from 'fumadocs-ui/provider/next';
import {defineI18nUI} from 'fumadocs-ui/i18n';
import {i18n} from '@/lib/i18n';

const { provider } = defineI18nUI(i18n, {
    translations: {
        en: {
            displayName: 'English',
        },
        ru: {
            displayName: 'Русский',
            search: 'Поиск',
        },
    },
});

export default async function RootLayout(
    {
                                             params,
                                             children,
                                         }: {
    params: Promise<{ lang: string }>;
    children: React.ReactNode;
}
) {
    const lang = (await params).lang;

    return (
        <html lang={lang}>
        <body>
        <RootProvider
            i18n={provider(lang)}
        >
            {children}
        </RootProvider>
        </body>
        </html>
    );
}