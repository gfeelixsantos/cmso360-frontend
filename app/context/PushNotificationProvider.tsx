"use client";

import { useCallback, useEffect, useRef } from "react";
import { getCurrentUser, urlBase64ToUint8Array } from "@/lib/utils";
import { NEST_NOTIFICATION_URL } from "@/config/constants";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_NOTIFICATION_PUBLICKEY || "";

export function PushNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const subscribedRef = useRef(false);
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  const subscribeToPush = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const user = getCurrentUser();
    if (!user) return;

    if (subscribedRef.current) return;

    try {
      const reg =
        swRegistrationRef.current || (await navigator.serviceWorker.ready);

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch(NEST_NOTIFICATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unidade: "ged_servicos",
          subscription: sub.toJSON(),
        }),
      });

      subscribedRef.current = true;
    } catch (err) {
      console.error("[PushNotification] Falha ao assinar push:", err);
    }
  }, []);

  const trySubscribe = useCallback(async () => {
    if (subscribedRef.current) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await subscribeToPush();
    }
  }, [subscribeToPush]);

  // Registra SW no mount (não precisa de user gesture)
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

    const init = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        swRegistrationRef.current = reg;
      } catch (err) {
        console.error("[PushNotification] Falha ao registrar SW:", err);
      }
    };

    init();
  }, []);

  // Tenta assinar push automaticamente + no primeiro click do usuário
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return;

    // Tenta imediatamente (funciona em Chrome HTTPS)
    trySubscribe();

    // Fallback: tenta no primeiro click do usuário (Firefox, etc)
    const handleInteraction = () => {
      trySubscribe();
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("keydown", handleInteraction);

    // Tenta a cada 2s por até 30s para quando user logar
    const interval = setInterval(async () => {
      if (subscribedRef.current) {
        clearInterval(interval);
        return;
      }
      await subscribeToPush();
    }, 2000);

    setTimeout(() => clearInterval(interval), 30_000);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
      clearInterval(interval);
    };
  }, [trySubscribe, subscribeToPush]);

  return <>{children}</>;
}
