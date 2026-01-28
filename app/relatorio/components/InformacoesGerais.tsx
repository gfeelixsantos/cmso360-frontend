import { Button, Chip, Divider, Input } from "@heroui/react";
import {
  Building,
  Calendar,
  FileCheck,
  Pen,
  Save,
  Stethoscope,
  User,
  UserCheck,
  X,
} from "lucide-react";
import React, { useState } from "react";

import { Scheduling } from "@/lib/scheduling/interface/scheduling";
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
                        "pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        }
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
              <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
                <FileCheck size={16} />
                Parecer ASO
              </h4>
              <span className="text-sm text-gray-900">
                {atendimento.PARECERMEDICO?.replace(/_/g, " ") ||
                  "Não informado"}
              </span>
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
