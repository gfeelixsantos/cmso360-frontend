"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tab, Tabs } from "@heroui/react";
import { FolderOpen, Layers } from "lucide-react";

import { HeaderApp } from "@/components/shared/HeaderApp";
import { FileExplorer } from "@/components/shared/FileExplorer";
import { getCurrentUser, logout } from "@/lib/utils";
import { usePushNotification } from "@/hooks/usePushNotification";

import { QueueMonitor } from "./components/QueueMonitor";

export default function ServicosPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("arquivos");

  usePushNotification({
    enabled: selectedTab === "arquivos",
    unidade: "ged_servicos",
    contexto: { contexto: "ged", pagina: "servicos" },
  });

  useEffect(() => {
    if (!getCurrentUser()) {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-default-50">
      <HeaderApp onLogout={logout}>
        <h1 className="text-lg font-semibold">Serviços</h1>
      </HeaderApp>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-2">
          <h2 className="text-xl font-semibold text-gray-900">Serviços</h2>
        </div>

        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          variant="underlined"
          color="primary"
          size="lg"
          className="w-full"
        >
          <Tab
            key="arquivos"
            title={
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Explorador de Arquivos
              </div>
            }
          >
            <div className="mt-4">
              <FileExplorer />
            </div>
          </Tab>

          <Tab
            key="filas"
            title={
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Filas & Serviços
              </div>
            }
          >
            <div className="mt-4">
              <QueueMonitor />
            </div>
          </Tab>

        </Tabs>
      </main>
    </div>
  );
}
