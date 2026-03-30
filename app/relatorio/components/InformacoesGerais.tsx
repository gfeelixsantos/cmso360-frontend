import { Chip, Divider, Input, Tooltip } from "@heroui/react";
import {
  Building,
  Calendar,
  Stethoscope,
  User,
  UserCheck,
  ShieldCheck,
  FileText,
  Mail,
  Clock3,
  IdCard,
  AlertTriangle,
} from "lucide-react";
import React, { useState } from "react";

import {
  MongoDateLike,
  Scheduling,
} from "@/lib/scheduling/interface/scheduling";
import {
  getAsoStatusLabel,
  getSignatureStatusLabel,
  normalizeAsoStatus,
} from "@/lib/scheduling/status.helper";
import { formatCPF, getStatusColor } from "@/lib/utils";

// ============================================
// COMPONENTE: InformacoesGerais
// ============================================

export interface EditModeState {
  isEditing: boolean;
  editedData: Partial<Scheduling>;
}

const parseMongoDate = (value?: MongoDateLike): Date | null => {
  if (!value) return null;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? null : value;
  const dateValue = typeof value === "string" ? value : value.$date;
  const date = new Date(dateValue);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value?: MongoDateLike): string => {
  const parsedDate = parseMongoDate(value);

  if (!parsedDate) return "Nao informado";

  return parsedDate.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

const getAsoStatusColor = (status?: string | null) => {
  const normalizedStatus = normalizeAsoStatus(status);

  if (normalizedStatus === "LIBERADO") return "success";
  if (normalizedStatus === "FALHA") return "danger";
  if (normalizedStatus === "ASSINADO") return "primary";

  return "warning";
};

const InformacoesGerais: React.FC<{
  atendimento: Scheduling;
  editMode: EditModeState;
  onEditModeChange: (mode: EditModeState) => void;
  onSave: (data: Partial<Scheduling>) => Promise<void>;
}> = ({ atendimento, editMode, onEditModeChange, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = (field: keyof Scheduling, value: string) => {
    onEditModeChange({
      ...editMode,
      editedData: {
        ...editMode.editedData,
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(editMode.editedData);
      onEditModeChange({ isEditing: false, editedData: {} });
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onEditModeChange({ isEditing: false, editedData: {} });
  };

  const renderField = (
    field: keyof Scheduling,
    label: string,
    value: string,
  ) => {
    if (
      editMode.isEditing &&
      [
        "NOME",
        "CPFFUNCIONARIO",
        "DATANASCIMENTO",
        "MATRICULAFUNCIONARIO",
      ].includes(field)
    ) {
      return (
        <Input
          className="max-w-xs text-sm"
          placeholder={label}
          size="sm"
          value={(editMode.editedData[field] as string) || value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      );
    }

    return <span className="text-gray-900">{value || "Não informado"}</span>;
  };

  const hasAsoData = Boolean(
    atendimento.PARECERMEDICO || atendimento.MEDICO || atendimento.ASOINFO,
  );
  const parecerAso =
    atendimento.PARECERMEDICO?.replace(/_/g, " ") || "Não informado";
  const asoStatus = atendimento.ASOINFO?.status || atendimento.ASOSTATUS;
  const profissionalAso =
    atendimento.ASOINFO?.professional?.nome || atendimento.MEDICO;
  const statusAssinatura = atendimento.ASOINFO?.signature?.status;
  const providerAssinatura = atendimento.ASOINFO?.signature?.provider;
  const observacoesParecer = atendimento.ASOINFO?.observacoesParecer?.length
    ? atendimento.ASOINFO.observacoesParecer
    : atendimento.ASOINFO?.signature?.observacoesParecer || [];
  const hasAsoError = Boolean(
    atendimento.ASOINFO?.signature?.error || atendimento.ASOINFO?.error,
  );
  const conselhoProfissional = [
    atendimento.ASOINFO?.professional?.conselho,
    atendimento.ASOINFO?.professional?.ufconselho,
  ]
    .filter(Boolean)
    .join("/");

  return (
    <div className="space-y-6">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
              <User size={16} />
              Dados do Paciente
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Nome
                </label>
                {renderField("NOME", "Nome", atendimento.NOME.toUpperCase())}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  CPF
                </label>
                {renderField(
                  "CPFFUNCIONARIO",
                  "CPF",
                  formatCPF(atendimento.CPFFUNCIONARIO),
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Data Nascimento
                </label>
                {renderField(
                  "DATANASCIMENTO",
                  "Data Nascimento",
                  atendimento?.DATANASCIMENTO ?? "",
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Telefone
                </label>
                {renderField(
                  "TELEFONE",
                  "Telefone de Contato",
                  atendimento?.TELEFONE ?? "",
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Matrícula
                </label>
                {renderField(
                  "MATRICULAFUNCIONARIO",
                  "Registro eSocial",
                  atendimento?.MATRICULAFUNCIONARIO ?? "",
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
              <Building size={16} />
              Dados da Empresa
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Empresa
                </label>
                <span className="text-gray-900">
                  {atendimento.NOMEEMPRESA || "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  CNPJ/CPF
                </label>
                <span className="text-gray-900">
                  {atendimento.CNPJEMPRESA ||
                    atendimento.CPFEMPRESA ||
                    "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Cargo
                </label>
                <span className="text-gray-900">
                  {atendimento.NOMECARGO || "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Setor
                </label>
                <span className="text-gray-900">
                  {atendimento.NOMESETOR || "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Unidade
                </label>
                <span className="text-gray-900">
                  {atendimento.NOMEUNIDADE || "Não informado"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
              <Calendar size={16} />
              Agendamento
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Data e Hora
                </label>
                <span className="text-gray-900">
                  {atendimento.TICKET
                    ? new Date(atendimento.TICKET?.emissao).toLocaleString(
                        "pt-BR",
                        {
                          timeZone: "America/Sao_Paulo",
                        },
                      )
                    : `${atendimento.DATAAGENDAMENTO}, ${atendimento.HORARIO}`}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Tipo Exame
                </label>
                <span className="text-gray-900">
                  {atendimento.TIPOEXAMENOME || "Não informado"}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 block mb-1">
                  Unidade de Atendimento
                </label>
                <span className="text-gray-900">
                  {atendimento.UNIDADEATENDIMENTO || "Não informado"}
                </span>
              </div>
              {atendimento.TICKET?.prefixo && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Senha
                  </label>
                  <span className="text-gray-900">
                    {`${atendimento.TICKET?.prefixo}${atendimento.TICKET?.numero}` ||
                      "Não informado"}
                  </span>
                  <span className="text-gray-900">
                    {atendimento.TICKET?.preferencialTipo}
                  </span>
                </div>
              )}
              {atendimento.TICKET?.atendente && (
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Atendente
                  </label>
                  <span className="text-gray-900">
                    {atendimento.TICKET?.atendente || "Não informado"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <Divider className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
              <UserCheck size={16} />
              Status do Atendimento
            </h4>
            <Chip
              className="text-white"
              color={getStatusColor(atendimento.ATENDIMENTOSTATUS)}
              size="lg"
            >
              {atendimento.ATENDIMENTOSTATUS.replace(/_/g, " ")
                .toLowerCase()
                .replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Chip>
          </div>

          {hasAsoData && (
            <div className="md:col-span-2 space-y-3">
              <div className="border border-gray-200 rounded-xl bg-gradient-to-br from-white to-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm text-gray-600">
                      Parecer ASO
                    </h4>
                    <p className="text-lg font-bold text-gray-900">
                      {parecerAso}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1.5">
                      <Stethoscope className="text-[#44735e]" size={14} />
                      Liberado por{" "}
                      <span className="font-semibold text-gray-800">
                        {profissionalAso || "Não informado"}
                      </span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {(atendimento.ASOINFO?.url ||
                      atendimento.ASOINFO?.asoUrl) && (
                      <Tooltip
                        closeDelay={0}
                        content="Visualizar ASO"
                        delay={0}
                      >
                        <a
                          className="text-[#44735e] hover:bg-green-50 p-1.5 rounded-full transition-colors"
                          href={
                            atendimento.ASOINFO?.url ||
                            atendimento.ASOINFO?.asoUrl
                          }
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <FileText size={16} />
                        </a>
                      </Tooltip>
                    )}
                    {(atendimento.ASOINFO?.validacao ||
                      atendimento.ASOINFO?.validacaoUrl) && (
                      <Tooltip
                        closeDelay={0}
                        content="Relatório de Validação"
                        delay={0}
                      >
                        <a
                          className="text-[#44735e] hover:bg-green-50 p-1.5 rounded-full transition-colors"
                          href={
                            atendimento.ASOINFO?.validacao ||
                            atendimento.ASOINFO?.validacaoUrl
                          }
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <ShieldCheck size={16} />
                        </a>
                      </Tooltip>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                  <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      Status ASO
                    </p>
                    <div className="mt-1">
                      <Chip
                        className="font-medium h-5"
                        color={getAsoStatusColor(asoStatus)}
                        size="sm"
                        variant="flat"
                      >
                        {getAsoStatusLabel(asoStatus) || "Não informado"}
                      </Chip>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      Assinatura
                    </p>
                    <div className="mt-1 flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-800">
                        {providerAssinatura || "Não informado"}
                      </span>
                      {statusAssinatura && (
                        <Chip
                          className="w-fit h-5"
                          color="primary"
                          size="sm"
                          variant="flat"
                        >
                          {getSignatureStatusLabel(statusAssinatura)}
                        </Chip>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      Email
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Mail className="text-gray-500" size={13} />
                      <Chip
                        className="h-5"
                        color={
                          atendimento.ASOINFO?.emailSent ? "success" : "warning"
                        }
                        size="sm"
                        variant="flat"
                      >
                        {atendimento.ASOINFO?.emailSent
                          ? "Enviado"
                          : "Pendente"}
                      </Chip>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      Atualização
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-700">
                      <Clock3 className="text-gray-500" size={13} />
                      <span>
                        {formatDateTime(atendimento.ASOINFO?.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      Assinado em
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-700">
                      <Clock3 className="text-gray-500" size={13} />
                      <span>
                        {formatDateTime(
                          atendimento.ASOINFO?.signature?.signedAt,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white px-3 py-2">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                      Código/Conselho
                    </p>
                    <div className="mt-1 text-xs font-medium text-gray-700 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <IdCard className="text-gray-500" size={13} />
                        {atendimento.ASOINFO?.codigoProfissional ||
                          "Não informado"}
                      </p>
                      <p>{conselhoProfissional || "Não informado"}</p>
                    </div>
                  </div>
                </div>

                {observacoesParecer.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-1">
                      Observações do parecer
                    </p>
                    <p className="text-xs text-amber-900">
                      {observacoesParecer.join(" | ")}
                    </p>
                  </div>
                )}

                {hasAsoError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                    <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <AlertTriangle size={12} />
                      Erro no fluxo ASO
                    </p>
                    <p className="text-xs text-red-900 font-medium">
                      {atendimento.ASOINFO?.signature?.error ||
                        atendimento.ASOINFO?.error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {(atendimento.OBSERVACOES ||
          atendimento.ANOTACOES ||
          atendimento.RECOMENDACAOMEDICA) && (
          <>
            <Divider className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {atendimento.OBSERVACOES && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">
                    Observações do Agendamento
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-900 whitespace-pre-wrap">
                      {atendimento.OBSERVACOES}
                    </p>
                  </div>
                </div>
              )}

              {atendimento.ANOTACOES && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">
                    Anotações da Equipe
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-900 whitespace-pre-wrap">
                      {atendimento.ANOTACOES}
                    </p>
                  </div>
                </div>
              )}

              {atendimento.RECOMENDACAOMEDICA && (
                <div className="md:col-span-2 space-y-3">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">
                    Recomendação Médica
                  </h4>
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-sm text-red-900 font-bold whitespace-pre-wrap">
                      {atendimento.RECOMENDACAOMEDICA}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Divider className="my-6" />
    </div>
  );
};

export default React.memo(InformacoesGerais);
