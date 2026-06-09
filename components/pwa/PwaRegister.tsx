"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        // Verificar atualização imediatamente ao registrar
        await registration.update();

        // Quando novo SW assume controle, recarrega silenciosamente
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("[PWA] Novo Service Worker ativado - recarregando");
          window.location.reload();
        });
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error);
      }
    };

    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);
      return () => {
        window.removeEventListener("load", registerServiceWorker);
      };
    }
  }, []);

  return null;
}
