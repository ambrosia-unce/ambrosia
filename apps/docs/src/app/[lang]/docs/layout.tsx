import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import {ReactNode} from "react";


export default async function Layout({
                                         params,
                                         children,
                                     }: {
    params: Promise<{ lang: string }>;
    children: ReactNode;
}) {
    const { lang } = await params;
  return (
    <DocsLayout
        tree={source.getPageTree(lang)}
        sidebar={{
          enabled: true,
            // tabs: [
            //     {
            //         title: 'Ambrosia core',
            //         description: 'DI Container',
            //         url: '/docs/core',
            //     },
            //     {
            //         title: 'Ambrosia http',
            //         description: 'HTTP Integration DI',
            //         url: '/docs/http',
            //     }
            // ]
        }}
        {...baseOptions(lang)}
    >
      {children}
    </DocsLayout>
  );
}
