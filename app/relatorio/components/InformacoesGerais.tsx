import { Chip, Divider, Input, Tooltip } from "@heroui/react";
import {
  Building,
  Calendar,
  Stethoscope,
  User,
  UserCheck,
  ShieldCheck,
  FileText,
} from "lucide-react";
import React, { useState } from "react";

import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import {
  getAsoStatusLabel,
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

          {atendimento.MEDICO && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm text-gray-600">
                  Parecer ASO
                </h4>
                <div className="flex gap-2">
                  {(atendimento.ASOINFO?.url ||
                    atendimento.ASOINFO?.asoUrl) && (
                    <Tooltip closeDelay={0} content="Visualizar ASO" delay={0}>
                      <a
                        className="text-[#44735e] hover:bg-green-50 p-1.5 rounded-full transition-colors"
                        href={
                          atendimento.ASOINFO.url || atendimento.ASOINFO.asoUrl
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
                          atendimento.ASOINFO.validacao ||
                          atendimento.ASOINFO.validacaoUrl
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
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {atendimento.PARECERMEDICO?.replace(/_/g, " ") ||
                    "Não informado"}
                </span>

                {atendimento.ASOINFO && (
                  <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-gray-100">
                    {atendimento.ASOINFO.status && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          Status:
                        </span>
                        <Chip
                          className="font-medium h-5"
                          color={
                            normalizeAsoStatus(atendimento.ASOINFO.status) ===
                            "LIBERADO"
                              ? "success"
                              : normalizeAsoStatus(
                                    atendimento.ASOINFO.status,
                                  ) === "FALHA"
                                ? "danger"
                                : "warning"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {getAsoStatusLabel(atendimento.ASOINFO.status)}
                        </Chip>
                      </div>
                    )}

                    {atendimento.ASOINFO.signature?.provider && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          Assinatura:
                        </span>
                        <span className="text-xs font-semibold text-gray-600">
                          {atendimento.ASOINFO.signature.provider}
                        </span>
                      </div>
                    )}


                    {atendimento.ASOINFO.updatedAt && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          Atualização:
                        </span>
                        <span className="text-xs font-semibold text-gray-600">
                          {typeof atendimento.ASOINFO.updatedAt === "string"
                            ? new Date(
                                atendimento.ASOINFO.updatedAt,
                              ).toLocaleString("pt-BR")
                            : new Date(
                                atendimento.ASOINFO.updatedAt.$date,
                              ).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    )}

                    {(atendimento.ASOINFO.signature?.error || atendimento.ASOINFO.error) && (
                      <div className="flex items-start gap-2 max-w-xs">
                        <span className="text-[10px] font-bold text-red-400 uppercase whitespace-nowrap">
                          Erro:
                        </span>
                        <span className="text-[10px] text-red-600 font-medium">
                          {atendimento.ASOINFO.signature?.error || atendimento.ASOINFO.error}
                        </span>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </div>
          )}

          {atendimento.MEDICO && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Stethoscope size={16} />
                Liberado por
              </h4>
              <span className="text-sm text-gray-900">
                {atendimento.MEDICO || "Não informado"}
              </span>
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
