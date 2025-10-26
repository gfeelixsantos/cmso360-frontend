import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { NEST_SCHEDULINGS_ALL } from "@/config/constants";



export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/images/favicon.ico",
    shortcut: "favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

async function getInitialAppData() {
  try {
    const response = await fetch(NEST_SCHEDULINGS_ALL, { cache: "no-store" });

    if (!response.ok) {
      console.error("Erro ao buscar dados iniciais:", response.statusText);
      return null;
    }

    const json = await response.json();
    const data = {
      atendimentos: json,
    };

    return data;
  } catch (err) {
    console.error("Erro ao carregar dados iniciais:", err);
    return null;
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const initialData = await getInitialAppData();
  
  return (
    <html suppressHydrationWarning lang="pt-br">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }} initialData={initialData}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
