import { useEffect, useRef } from "react";

import { NEST_NOTIFICATION_URL } from "@/config/constants";
import { urlBase64ToUint8Array } from "@/lib/utils";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_NOTIFICATION_PUBLICKEY!;

interface UsePushNotificationOptions {
  enabled: boolean;
  unidade: string;
  contexto?: Record<string, string>;
}

export function usePushNotification({
  enabled,
  unidade,
  contexto = {},
}: UsePushNotificationOptions) {
  const subscribedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !unidade || subscribedRef.current) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const subscribe = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        await fetch(NEST_NOTIFICATION_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unidade,
            subscription,
            ...contexto,
          }),
        });

        subscribedRef.current = true;
        console.log("[Push] Subscrito com sucesso:", { unidade, ...contexto });
      } catch (err) {
        console.error("[Push] Erro ao subscrever:", err);
      }
    };

    subscribe();
  }, [enabled, unidade, contexto]);
}