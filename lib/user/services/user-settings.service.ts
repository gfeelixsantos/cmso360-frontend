import {
  IUserInfo,
  IUserInfoSettings,
  IPscAuthStatus,
} from "../interfaces/IUser";

import { getCurrentUser } from "@/lib/utils";
import { NEST_USER_SETTINGS_URL } from "@/config/constants";

export async function getUserSettings(): Promise<{
  user: IUserInfo;
  settings: IUserInfoSettings | null;
  pscAuthStatus: IPscAuthStatus;
  error?: string;
}> {
  const user = getCurrentUser();

  if (!user) {
    return {
      user: {} as IUserInfo,
      settings: null,
      pscAuthStatus: {
        status: "NOT_AUTHENTICATED",
        isActive: false,
        expiresAt: null,
        pscName: null,
      },
      error: "Usuário não autenticado",
    };
  }

  try {
    const response = await fetch(`${NEST_USER_SETTINGS_URL}${user.codigo}`);

    if (!response.ok) {
      throw new Error("Erro ao buscar configurações");
    }

    const data = await response.json();

    return {
      user: data.user,
      settings: data.settings,
      pscAuthStatus: data.pscAuthStatus,
    };
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);

    return {
      user: user,
      settings: null,
      pscAuthStatus: {
        status: "ERROR",
        isActive: false,
        expiresAt: null,
        pscName: null,
      },
    };
  }
}

export async function saveUserSettings(
  settings: IUserInfoSettings,
): Promise<{ success: boolean; error?: string }> {
  const user = getCurrentUser();

  if (!user) {
    return {
      success: false,
      error: "Usuário não autenticado",
    };
  }

  try {
    // Converter PIN para base64 se fornecido
    const settingsToSave = {
      ...settings,
      pin: settings.pin ? btoa(settings.pin) : null,
    };

    const response = await fetch(NEST_USER_SETTINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settingsToSave),
    });

    if (!response.ok) {
      const errorData = await response.json();

      throw new Error(errorData.message || "Erro ao salvar configurações");
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
