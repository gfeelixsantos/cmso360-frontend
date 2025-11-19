"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import { fetchBodyJson, formatCPF, setCurrentUser } from "@/lib/utils";
import { IUserInfo } from "@/lib/user/interfaces/IUser";
import { ApiResponse } from "@/shared/responses/ApiResponse";
import CMSO360Animation from "../shared/CMSO360Animation";

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
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onPaste={onPaste}
        disabled={disabled}
        required={required}
        aria-label={label}
        autoComplete={autoComplete}
        name={name}
        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl 
        focus:ring-2 focus:ring-[#104e35] focus:border-[#104e35] 
        disabled:bg-gray-100 disabled:cursor-not-allowed 
        transition-all duration-200"
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
    type="submit"
    disabled={isLoading || disabled}
    className="w-full py-3 px-4 bg-[#104e35] text-white font-semibold rounded-xl 
    hover:bg-[#0d3d29] 
    focus:ring-2 focus:ring-[#104e35] focus:outline-none 
    disabled:opacity-50 disabled:cursor-not-allowed 
    flex items-center justify-center gap-2 
    transition-all duration-300 shadow-md hover:shadow-lg"
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
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

// -------------------------------------------------------------
// COMPONENTE PRINCIPAL
// -------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();

  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
        { cpf, password }
      );

      if (userLogged.data) {
        setCurrentUser(userLogged.data);

        // pequena espera pro "Conectando..." aparecer
        setTimeout(() => router.push("/dashboard"), 400);
        return;
      }

      throw new Error(userLogged.message || "Falha no login");
    } catch (err: any) {
      setError(err?.message || "Erro ao conectar");
    } finally {
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

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------

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
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Título */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Acesso ao Sistema</h2>
              <p className="text-gray-600 mt-2">Use suas credenciais corporativas</p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ERROR */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </motion.div>
              )}

              {/* CPF */}
              <InputField
                label="CPF"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCPFChange}
                onPaste={handleCPFPaste}
                startIcon={<User className="h-4 w-4" />}
                disabled={isLoading}
                autoComplete="username"
                name="username"
                required
              />

              {/* SENHA */}
              <InputField
                label="Senha"
                placeholder="Digite sua senha"
                autoComplete="current-password"
                name="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                startIcon={<Lock className="h-4 w-4" />}
                endIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                disabled={isLoading}
                required
              />

              {/* BOTÃO LOGIN */}
              <SubmitButton isLoading={isLoading} />
            </form>

            {/* REGISTER LINK */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{" "}
                <a
                  href="/registro"
                  className="text-[#104e35] font-semibold hover:text-[#0d3d29] hover:underline transition-colors"
                >
                  Registre-se aqui
                </a>
              </p>
            </div>

            {/* FOOTER */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
              Centro Médico de Saúde Ocupacional {new Date().getFullYear()}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
