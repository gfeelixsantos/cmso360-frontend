"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  FileSignature,
  Save,
  AlertCircle,
  CheckCircle,
  Shield,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Card,
  CardBody,
  CardHeader,
} from "@heroui/react";

import {
  IUserInfo,
  IUserInfoSettings,
  IPscAuthStatus,
} from "@/lib/user/interfaces/IUser";
import { getCurrentUser, logout } from "@/lib/utils";
import {
  getUserSettings,
  saveUserSettings,
} from "@/lib/user/services/user-settings.service";
import { HeaderApp } from "@/components/shared/HeaderApp";
import CmsoLoading from "@/components/shared/CmsoLoading";
import { PSC_PROVIDERS } from "@/lib/constants/psc-providers";
import { ProviderIcon } from "@/components/shared/ProviderIcon";

const defaultPscAuthStatus: IPscAuthStatus = {
  status: "NOT_AUTHENTICATED",
  isActive: false,
  expiresAt: null,
  pscName: null,
};

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [user, setUser] = useState<IUserInfo | null>(null);
  const [settings, setSettings] = useState<IUserInfoSettings | null>(null);
  const [pscAuthStatus, setPscAuthStatus] =
    useState<IPscAuthStatus>(defaultPscAuthStatus);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [formData, setFormData] = useState({
    assinaturaImagemUrl: "",
    assinaDigitalmente: false,
    pscPadrao: "",
    assinaturaProvider: null as "PSC" | "BRYKMS" | null,
    uuidCert: "",
    pin: "",
  });

  useEffect(() => {
    const initPage = async () => {
      const currentUser = getCurrentUser();

      if (!currentUser) {
        router.push("/");

        return;
      }

      setUser(currentUser);

      try {
        const { settings: userSettings, pscAuthStatus: authStatus } =
          await getUserSettings();

        if (userSettings) {
          setSettings(userSettings);
          setFormData({
            assinaturaImagemUrl: userSettings.assinaturaImagemUrl || "",
            assinaDigitalmente: userSettings.assinaDigitalmente || false,
            pscPadrao:
              userSettings.pscPadrao ?? userSettings.provedorPadrao ?? "",
            assinaturaProvider:
              userSettings.assinaturaProvider ??
              (userSettings.uuidCert
                ? "BRYKMS"
                : userSettings.assinaDigitalmente
                  ? "PSC"
                  : null),
            uuidCert: userSettings.uuidCert ?? "",
            pin: "", // PIN não é retornado do backend por segurança
          });
        }

        setPscAuthStatus(authStatus);
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initPage();
  }, [router]);

  const validateForm = (): string | null => {
    if (formData.assinaDigitalmente) {
      if (!formData.assinaturaProvider) {
        return "Quando a assinatura digital está ativa, um provedor de assinatura é obrigatório.";
      }

      if (formData.assinaturaProvider === "BRYKMS") {
        if (!formData.uuidCert.trim()) {
          return "Para o provedor BRy Cloud, o ID Cert (UUID) é obrigatório.";
        }
        if (!formData.pin.trim()) {
          return "Para o provedor BRy Cloud, o PIN do certificado é obrigatório.";
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações no frontend
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      setSaveStatus("error");

      return;
    }

    setIsSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      const result = await saveUserSettings({
        userCodigo: user?.codigo || "",
        assinaturaImagemUrl: formData.assinaturaImagemUrl || undefined,
        assinaDigitalmente: formData.assinaDigitalmente,
        pscPadrao: formData.pscPadrao || null,
        assinaturaProvider: formData.assinaturaProvider || null,
        uuidCert: formData.uuidCert || null,
        pin: formData.pin || null,
      });

      if (result.success) {
        setSaveStatus("success");
        setSettings({
          ...settings!,
          ...formData,
        });
      } else {
        setSaveStatus("error");
        setErrorMessage(result.error || "Erro ao salvar configurações");
      }
    } catch (error) {
      setSaveStatus("error");
      setErrorMessage("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return <CmsoLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <HeaderApp
        onLogout={() => {
          logout();
          router.push("/");
        }}
      >
        <></>
      </HeaderApp>

      <main
        aria-label="Configurações do usuário"
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configurações
          </h1>
          <p className="text-gray-600 mb-8">
            Gerencie suas informações pessoais e preferências do sistema
          </p>

          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <User className="h-5 w-5 text-[#44735e]" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Dados do Usuário
                </h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p className="text-gray-900">{user.nome}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">CPF</p>
                    <p className="text-gray-900">{user.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Perfil</p>
                    <p className="text-gray-900">{user.perfil}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Código</p>
                    <p className="text-gray-900">{user.codigo}</p>
                  </div>
                  {user.conselho && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Conselho Profissional
                      </p>
                      <p className="text-gray-900">
                        {user.conselho} - {user.ufconselho}
                      </p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <FileSignature className="h-5 w-5 text-[#44735e]" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Preferências de Assinatura
                </h2>
              </CardHeader>
              <CardBody>
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Assinar Digitalmente
                      </p>
                      <p className="text-sm text-gray-500">
                        Habilitar assinatura digital nos documentos
                      </p>
                    </div>
                    <Switch
                      color="success"
                      isSelected={formData.assinaDigitalmente}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          assinaDigitalmente: value,
                        })
                      }
                    />
                  </div>

                  <div
                    className={formData.assinaDigitalmente ? "block" : "hidden"}
                  >
                    <Select
                      label="Provedor de Assinatura"
                      placeholder="Selecione"
                      selectedKeys={
                        formData.assinaturaProvider
                          ? [formData.assinaturaProvider]
                          : []
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;

                        setFormData({
                          ...formData,
                          assinaturaProvider:
                            selected === "PSC"
                              ? "PSC"
                              : selected === "BRYKMS"
                                ? "BRYKMS"
                                : null,
                          pscPadrao:
                            selected === "PSC" ? formData.pscPadrao : "",
                          uuidCert:
                            selected === "BRYKMS" ? formData.uuidCert : "",
                          pin: selected === "BRYKMS" ? formData.pin : "",
                        });
                      }}
                    >
                      <SelectItem
                        key="PSC"
                        textValue="PSC - Provedor de Serviço de Certificação"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>PSC - Provedor de Serviço de Certificação</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        key="BRYKMS"
                        textValue="BRy Cloud - Cerificado em nuvem"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>BRy Cloud - Certificado em nuvem</span>
                        </div>
                      </SelectItem>
                    </Select>
                  </div>

                  {/* Configurações PSC */}
                  <div
                    className={
                      formData.assinaDigitalmente &&
                      formData.assinaturaProvider === "PSC"
                        ? "block"
                        : "hidden"
                    }
                  >
                    <Select
                      label="Provedor Padrão"
                      placeholder="Selecione"
                      selectedKeys={
                        formData.pscPadrao ? [formData.pscPadrao] : []
                      }
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;

                        setFormData({ ...formData, pscPadrao: selected });
                      }}
                    >
                      {PSC_PROVIDERS.map((item) => (
                        <SelectItem
                          key={item.psc}
                          textValue={
                            item.psc
                              ? `${item.psc} (${item.provider})`
                              : item.provider
                          }
                        >
                          <div className="flex items-center gap-2">
                            {item.psc && (
                              <ProviderIcon
                                className="flex-shrink-0"
                                name={item.psc}
                                size={24}
                              />
                            )}
                            <span>
                              {item.psc
                                ? `${item.psc} (${item.provider})`
                                : item.provider}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* Configurações BRy Cloud */}
                  <div
                    className={
                      formData.assinaDigitalmente &&
                      formData.assinaturaProvider === "BRYKMS"
                        ? "block"
                        : "hidden"
                    }
                  >
                    <div className="space-y-4">
                      <Input
                        label="UUID do seu certificado no BRy Cloud (ID Cert)"
                        value={formData.uuidCert}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            uuidCert: e.target.value,
                          })
                        }
                      />

                      <Input
                        label="PIN do Certificado"
                        type="password"
                        value={formData.pin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pin: e.target.value,
                          })
                        }
                      />

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>Atenção:</strong> O PIN será criptografado e
                          armazenado com segurança. Não compartilhe suas
                          credenciais com terceiros.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Input
                    label="URL da Imagem para assinatura digitalizada"
                    placeholder="https://exemplo.com/assinatura.png"
                    value={formData.assinaturaImagemUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assinaturaImagemUrl: e.target.value,
                      })
                    }
                  />

                  {errorMessage && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                      <AlertCircle className="h-5 w-5" />
                      <p>{errorMessage}</p>
                    </div>
                  )}

                  {saveStatus === "success" && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                      <CheckCircle className="h-5 w-5" />
                      <p>Configurações salvas com sucesso!</p>
                    </div>
                  )}

                  <Button
                    className="w-full bg-[#44735e]"
                    color="primary"
                    isLoading={isSaving}
                    startContent={!isSaving && <Save className="h-4 w-4" />}
                    type="submit"
                  >
                    {isSaving ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </CardBody>
            </Card>

            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Shield className="h-5 w-5 text-[#44735e]" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Status do Provedor de Assinatura
                </h2>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {pscAuthStatus.isActive ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        Status:{" "}
                        {pscAuthStatus.status === "ACTIVE"
                          ? "Autenticado"
                          : pscAuthStatus.status === "EXPIRED"
                            ? "Expirado"
                            : pscAuthStatus.status === "ERROR"
                              ? "Erro"
                              : "Não Autenticado"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {pscAuthStatus.isActive
                          ? "Sua sessão do provedor está ativa"
                          : "Nenhuma sessão do provedor ativa"}
                      </p>
                    </div>
                  </div>

                  {pscAuthStatus.pscName && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Provedor
                      </p>
                      <p className="text-gray-900">{pscAuthStatus.pscName}</p>
                    </div>
                  )}

                  {pscAuthStatus.expiresAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Expira em
                      </p>
                      <p className="text-gray-900">
                        {new Date(pscAuthStatus.expiresAt).toLocaleString(
                          "pt-BR",
                        )}
                      </p>
                    </div>
                  )}

                  <div className="pt-2 text-sm text-gray-500">
                    {formData.assinaDigitalmente ? (
                      formData.assinaturaProvider === "BRYKMS" ? (
                        formData.uuidCert ? (
                          <p className="text-green-600">
                            Configurações BRy Cloud prontas para uso.
                          </p>
                        ) : (
                          <p className="text-amber-600">
                            Configure as credenciais BRy Cloud para usar a
                            assinatura digital.
                          </p>
                        )
                      ) : pscAuthStatus.isActive ? (
                        <p className="text-green-600">
                          Pronto para assinar documentos digitalmente com PSC.
                        </p>
                      ) : (
                        <p className="text-amber-600">
                          A autenticação do provedor PSC será necessária para
                          assinatura digital.
                        </p>
                      )
                    ) : (
                      <p>
                        Provedor não é necessário pois a assinatura digital está
                        desabilitada.
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
