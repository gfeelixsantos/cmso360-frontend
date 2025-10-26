"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ToastProvider } from "@heroui/react";
import { NEST_SCHEDULINGS_ALL } from "@/config/constants";
import { AppData, AppDataProvider } from "./context/AppDataContext";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  initialData: AppData | null;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}


export function Providers({ children, themeProps, initialData }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ToastProvider />
      <NextThemesProvider {...themeProps}>
        <AppDataProvider initialData={initialData}>
          {children}
        </AppDataProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
