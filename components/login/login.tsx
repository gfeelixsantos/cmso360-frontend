"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Lock } from "lucide-react";

import CMSO360Animation from "../shared/CMSO360Animation";
import packageInfo from "@/package.json";

import { fetchBodyJson, formatCPF, setCurrentUser } from "@/lib/utils";
import { IUserInfo } from "@/lib/user/interfaces/IUser";
import { ApiResponse } from "@/shared/responses/ApiResponse";

// -------------------------------------------------------------
// SUBCOMPONENTES ESTÁVEIS (fora do componente principal)
// -------------------------------------------------------------

interface InputFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  type?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  name?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onPaste,
  type = "text",
  startIcon,
  endIcon,
  disabled,
  required,
  autoComplete,
  name,
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      {startIcon && (
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          {startIcon}
        </span>
      )}

      <input
        aria-label={label}
        autoComplete={autoComplete}
        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl
        focus:ring-2 focus:ring-[#104e35] focus:border-[#104e35]
        disabled:bg-gray-100 disabled:cursor-not-allowed
        transition-all duration-200"
        disabled={disabled}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
        onChange={onChange}
        onPaste={onPaste}
      />

      {endIcon && (
        <span className="absolute inset-y-0 right-0 flex items-center pr-3">
          {endIcon}
        </span>
      )}
    </div>
  </div>
);

interface SubmitButtonProps {
  isLoading: boolean;
  disabled?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ isLoading, disabled }) => (
  <button
    className="w-full py-3 px-4 bg-[#104e35] text-white font-semibold rounded-xl
    hover:bg-[#0d3d29]
    focus:ring-2 focus:ring-[#104e35] focus:outline-none
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center justify-center gap-2
    transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
    disabled={isLoading || disabled}
    type="submit"
  >
    {isLoading ? (
      <>
        <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        Conectando...
      </>
    ) : (
      <>
        Acessar Sistema
        <ArrowRight className="h-5 w-5" />
      </>
    )}
  </button>
);

// Ícone separado
const ArrowRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M14 5l7 7m0 0l-7 7m7-7H3"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
    />
  </svg>
);

// -------------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------------

type RecoveryStep = "initial" | "validate" | "reset";

export default function LoginPage() {
  const router = useRouter();

  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [recoveryStep, setRecoveryStep] = useState<RecoveryStep>("initial");
  const [recoveryCpf, setRecoveryCpf] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);

    if (formatted.length <= 14) setCpf(formatted);
  };

  const handleCPFPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    const formatted = formatCPF(text);

    if (formatted.length <= 14) setCpf(formatted);
  };

  const handleLogin = async () => {
    try {
      const userLogged = await fetchBodyJson<ApiResponse<IUserInfo>>(
        "/api/auth",
        "POST",
        { cpf, password },
      );

      if (userLogged.data) {
        setCurrentUser(userLogged.data);
        // Não resetar isLoading aqui - deixar o botão em loading até a navegação
        router.push("/dashboard");

        return;
      }

      throw new Error(userLogged.message || "Falha no login");
    } catch (err: any) {
      setError(err?.message || "Erro ao conectar");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawCpf = cpf.replace(/\D/g, "");

    if (rawCpf.length !== 11) {
      setError("CPF Inválido. Deve conter 11 dígitos.");

      return;
    }

    setIsLoading(true);
    setError("");

    await handleLogin();
  };

  const handleRecoveryCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);

    if (formatted.length <= 14) setRecoveryCpf(formatted);
  };

  const handleRecoveryCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecoveryCode(e.target.value);
  };

  const handleRecoveryValidate = async () => {
    const rawCpf = recoveryCpf.replace(/\D/g, "");

    if (rawCpf.length !== 11) {
      setError("CPF Inválido. Deve conter 11 dígitos.");

      return;
    }

    if (!recoveryCode) {
      setError("Código de recuperação é obrigatório.");

      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetchBodyJson<ApiResponse<{ valid: boolean }>>(
        "/api/auth/recovery/validate",
        "POST",
        { cpf: rawCpf, codigo_recuperacao: recoveryCode },
      );

      if (response.data?.valid) {
        setRecoveryStep("reset");
        setError("");
      } else {
        setError(response.message || "Código de recuperação inválido.");
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao validar código.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoveryReset = async () => {
    const rawCpf = recoveryCpf.replace(/\D/g, "");

    if (!newPassword) {
      setError("Nova senha é obrigatória.");

      return;
    }

    if (newPassword.length < 3) {
      setError("Senha deve ter pelo menos 3 caracteres.");

      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem.");

      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetchBodyJson<ApiResponse<{ success: boolean }>>(
        "/api/auth/recovery/reset",
        "POST",
        { cpf: rawCpf, nova_senha: newPassword },
      );

      if (response.data?.success) {
        setSuccessMessage("Senha alterada com sucesso! Você pode fazer login.");
        setRecoveryStep("initial");
        setRecoveryCpf("");
        setRecoveryCode("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(response.message || "Erro ao redefinir senha.");
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao redefinir senha.");
    } finally {
      setIsLoading(false);
    }
  };

  const startRecovery = () => {
    setRecoveryStep("validate");
    setError("");
    setSuccessMessage("");
    setRecoveryCpf("");
    setRecoveryCode("");
  };

  const backToLogin = () => {
    setRecoveryStep("initial");
    setError("");
    setSuccessMessage("");
    setRecoveryCpf("");
    setRecoveryCode("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------

  const renderTitle = () => {
    if (recoveryStep === "validate") {
      return {
        title: "Recuperação de Senha",
        subtitle: "Informe seu CPF e código de recuperação",
      };
    }
    if (recoveryStep === "reset") {
      return {
        title: "Nova Senha",
        subtitle: "Digite sua nova senha",
      };
    }

    return {
      title: "Acesso ao Sistema",
      subtitle: "Use suas credenciais corporativas",
    };
  };

  const { title, subtitle } = renderTitle();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row rounded-2xl shadow-xl overflow-hidden bg-white border border-gray-200">
        {/* COL ESQUERDA - ANIMAÇÃO */}
        <div className="md:w-2/5 bg-white p-8 flex flex-col justify-center border-r border-gray-200">
          <CMSO360Animation />
        </div>

        {/* COL DIREITA - FORM */}
        <div className="md:w-3/5 p-8 flex flex-col justify-center">
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            initial={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.5 }}
          >
            {/* Título */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
              <p className="text-gray-600 mt-2">{subtitle}</p>
            </div>

            {/* MENSAGENS */}
            {error && (
              <motion.div
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200 flex items-center mb-4"
                initial={{ opacity: 0, height: 0 }}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    fillRule="evenodd"
                  />
                </svg>
                {error}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 text-sm text-green-700 bg-green-100 rounded-lg border border-green-200 flex items-center mb-4"
                initial={{ opacity: 0, height: 0 }}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
                {successMessage}
              </motion.div>
            )}

            {/* FORMULÁRIO DE LOGIN */}
            {recoveryStep === "initial" && (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <InputField
                  required
                  autoComplete="username"
                  disabled={isLoading}
                  label="CPF"
                  name="username"
                  placeholder="000.000.000-00"
                  startIcon={<User className="h-4 w-4" />}
                  value={cpf}
                  onChange={handleCPFChange}
                  onPaste={handleCPFPaste}
                />

                <InputField
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  endIcon={
                    <button
                      aria-label={
                        showPassword ? "Esconder senha" : "Mostrar senha"
                      }
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isLoading}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  label="Senha"
                  name="current-password"
                  placeholder="Digite sua senha"
                  startIcon={<Lock className="h-4 w-4" />}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <SubmitButton isLoading={isLoading} />
              </form>
            )}

            {/* FORMULÁRIO DE VALIDAÇÃO */}
            {recoveryStep === "validate" && (
              <div className="space-y-6">
                <InputField
                  required
                  label="CPF"
                  placeholder="000.000.000-00"
                  startIcon={<User className="h-4 w-4" />}
                  value={recoveryCpf}
                  onChange={handleRecoveryCPFChange}
                />

                <InputField
                  required
                  label="Código de Recuperação"
                  placeholder="Código invertido + 2 últimos dígitos do CPF"
                  value={recoveryCode}
                  onChange={handleRecoveryCodeChange}
                />

                <button
                  className="w-full py-3 px-4 bg-[#104e35] text-white font-semibold rounded-xl
                  hover:bg-[#0d3d29] focus:ring-2 focus:ring-[#104e35] focus:outline-none
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                  transition-all duration-300 shadow-md hover:shadow-lg"
                  disabled={isLoading}
                  onClick={handleRecoveryValidate}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      Validar Código
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    className="text-sm text-gray-600 hover:text-[#104e35] transition-colors"
                    type="button"
                    onClick={backToLogin}
                  >
                    Voltar ao login
                  </button>
                </div>
              </div>
            )}

            {/* FORMULÁRIO DE NOVA SENHA */}
            {recoveryStep === "reset" && (
              <div className="space-y-6">
                <InputField
                  required
                  endIcon={
                    <button
                      aria-label={
                        showNewPassword ? "Esconder senha" : "Mostrar senha"
                      }
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  label="Nova Senha"
                  placeholder="Mínimo 3 caracteres"
                  startIcon={<Lock className="h-4 w-4" />}
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <InputField
                  required
                  endIcon={
                    <button
                      aria-label={
                        showConfirmPassword ? "Esconder senha" : "Mostrar senha"
                      }
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  label="Confirmar Senha"
                  placeholder="Repita a nova senha"
                  startIcon={<Lock className="h-4 w-4" />}
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button
                  className="w-full py-3 px-4 bg-[#104e35] text-white font-semibold rounded-xl
                  hover:bg-[#0d3d29] focus:ring-2 focus:ring-[#104e35] focus:outline-none
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                  transition-all duration-300 shadow-md hover:shadow-lg"
                  disabled={isLoading}
                  onClick={handleRecoveryReset}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      Alterar Senha
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    className="text-sm text-gray-600 hover:text-[#104e35] transition-colors"
                    type="button"
                    onClick={backToLogin}
                  >
                    Voltar ao login
                  </button>
                </div>
              </div>
            )}

            {/* LINKS */}
            {recoveryStep === "initial" && (
              <>
                <div className="mt-6 text-center">
                  <button
                    className="text-sm text-[#104e35] font-semibold hover:text-[#0d3d29] hover:underline transition-colors"
                    type="button"
                    onClick={startRecovery}
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Não tem uma conta?{" "}
                    <a
                      className="text-[#104e35] font-semibold hover:text-[#0d3d29] hover:underline transition-colors"
                      href="/registro"
                    >
                      Registre-se aqui
                    </a>
                  </p>
                </div>
              </>
            )}

            {/* FOOTER */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 space-y-1">
              <div>Centro Médico de Saúde Ocupacional {new Date().getFullYear()}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
