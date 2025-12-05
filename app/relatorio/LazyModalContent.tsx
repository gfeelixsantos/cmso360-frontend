// app/relatorios/LazyModalContent.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  Divider,
  Spinner,
  Input,
} from "@heroui/react";
import {
  FileText,
  Upload,
  CheckCircle,
  Eye,
  Clock,
  AlertCircle,
  User,
  Edit,
  RefreshCw,
  Printer,
  Save,
  X,
  Building,
  Calendar,
  UserCheck,
} from "lucide-react";

import {
  ExamRegister,
  Scheduling,
} from "@/lib/scheduling/interface/scheduling";
import {
  NEST_SCHEDULINGS_UPDATE,
  NEST_SCHEDULINGS_EXAM_UPDATE,
  NEST_SOC_CADASTROPESSOAS,
  NEST_RELATORIO_FUNCIONARIO,
  NEST_SCHEDULINGS_UPDATE_EXAM_RESULT,
} from "@/config/constants";
import {
  mapCadastroPessoasToUserInfo,
  formatCPF,
  getStatusColor,
} from "@/lib/utils";
import { ICadastroPessoas } from "@/lib/soc/interfaces/ICadastroPessoas";

interface LazyModalContentProps {
  atendimento: Scheduling;
  onClose: () => void;
  onUpdateScheduling?: (updated: Scheduling) => void;
}

interface EditModeState {
  isEditing: boolean;
  editedData: Partial<Scheduling>;
}

// Função para calcular tempo de espera
const calculateWaitTime = (
  ticketTime: string | null | undefined,
  currentTime: Date = new Date(),
) => {
  if (!ticketTime) return null;

  try {
    const ticketDate = new Date(ticketTime);
    const diffMs = currentTime.getTime() - ticketDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} min`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      return `${hours}h ${minutes}min`;
    }
  } catch {
    return null;
  }
};

const InformacoesGerais: React.FC<{
  atendimento: Scheduling;
  editMode: EditModeState;
  onEditModeChange: (mode: EditModeState) => void;
  onSave: (data: Partial<Scheduling>) => Promise<void>;
}> = ({ atendimento, editMode, onEditModeChange, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleEditToggle = () => {
    if (editMode.isEditing) {
      onEditModeChange({ isEditing: false, editedData: {} });
    } else {
      onEditModeChange({
        isEditing: true,
        editedData: {
          NOME: atendimento.NOME,
          CPFFUNCIONARIO: atendimento.CPFFUNCIONARIO,
          DATANASCIMENTO: atendimento.DATANASCIMENTO,
          MATRICULAFUNCIONARIO: atendimento.MATRICULAFUNCIONARIO,
        },
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editMode.editedData);
      onEditModeChange({ isEditing: false, editedData: {} });
    } catch (error) {
      console.error("Erro ao salvar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof Scheduling, value: string) => {
    onEditModeChange({
      ...editMode,
      editedData: {
        ...editMode.editedData,
        [field]: value,
      },
    });
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
        <div className="flex items-center gap-2">
          <Input
            className="max-w-xs text-sm"
            placeholder={label}
            size="sm"
            value={(editMode.editedData[field] as string) || value}
            onChange={(e) => handleFieldChange(field, e.target.value)}
          />
        </div>
      );
    }

    return <span className="text-gray-900">{value || "Não informado"}</span>;
  };

  return (
    <div className="space-y-6">
      <div>

        {/* Informações principais alinhadas à esquerda */}
        <div className="space-y-6 text-left">
          {/* Dados do Paciente */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  {renderField("NOME", "Nome", atendimento.NOME)}
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
                    Matrícula
                  </label>
                  {renderField(
                    "MATRICULAFUNCIONARIO",
                    "Matrícula",
                    atendimento.MATRICULAFUNCIONARIO || "Não informado",
                  )}
                </div>
              </div>
            </div>

            {/* Dados da Empresa */}
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
                    CNPJ
                  </label>
                  <span className="text-gray-900">
                    {atendimento.CNPJEMPRESA || "Não informado"}
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
              </div>
            </div>

            {/* Agendamento */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Calendar size={16} />
                Agendamento
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Data
                  </label>
                  <span className="text-gray-900">
                    {atendimento.DATAAGENDAMENTO || "Não informado"}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Horário
                  </label>
                  <span className="text-gray-900">
                    {atendimento.HORARIO || "Não informado"}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 block mb-1">
                    Unidade
                  </label>
                  <span className="text-gray-900">
                    {atendimento.UNIDADEATENDIMENTO || "Não informado"}
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
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Status */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-600 mb-2 flex items-center gap-2">
                <UserCheck size={16} />
                Status
              </h4>
              <Chip
                className="text-left"
                color={getStatusColor(atendimento.ATENDIMENTOSTATUS)}
                size="lg"
              >
                {atendimento.ATENDIMENTOSTATUS.replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Chip>
            </div>

            {/* Informações Adicionais */}
            {atendimento.OBSERVACOES && (
              <div className="space-y-3 md:col-span-2">
                <h4 className="font-medium text-sm text-gray-600 mb-2">
                  Observações
                </h4>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                  {atendimento.OBSERVACOES}
                </p>
              </div>
            )}

            {/* Código interno */}
            {atendimento.CODIGOINTERNOEMPRESA && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-600 mb-2">
                  Atendimento
                </h4>
                <span className="text-sm text-gray-900">
                  {atendimento.CODIGOINTERNOEMPRESA}
                </span>
              </div>
            )}
          </div>

          {/* Mais Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Médico */}
            {atendimento.MEDICO && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-600 mb-2">
                  Médico
                </h4>
                <span className="text-sm text-gray-900">
                  {atendimento.MEDICO}
                </span>
              </div>
            )}

            {/* Parecer médico */}
            {atendimento.MEDICO && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-600 mb-2">
                  Parecer ASO
                </h4>
                <span className="text-sm text-gray-900">
                  {atendimento.PARECERMEDICO}
                </span>
              </div>
            )}

            {/* Recomendação Médica */}
            {atendimento.RECOMENDACAOMEDICA && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-600 mb-2">
                  Recomendação Médica
                </h4>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                  {atendimento.RECOMENDACAOMEDICA}
                </p>
              </div>
            )}
          </div>

          {/* Anotações */}
          {atendimento.ANOTACOES && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-600 mb-2">
                Anotações
              </h4>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border">
                {atendimento.ANOTACOES}
              </p>
            </div>
          )}
        </div>
      </div>
      <Divider />
    </div>
  );
};

InformacoesGerais.displayName = "InformacoesGerais";

const ExamesTable: React.FC<{
  exames: ExamRegister[];
  atendimento: Scheduling;
  onUpdateScheduling?: (updated: Scheduling) => void;
}> = ({ exames, atendimento, onUpdateScheduling }) => {
  const [localExames, setLocalExames] = useState<ExamRegister[]>(exames || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploadingExams, setUploadingExams] = useState<Record<string, boolean>>(
    {},
  );
  const [successExams, setSuccessExams] = useState<Record<string, boolean>>({});
  const [errorExams, setErrorExams] = useState<Record<string, string>>({});
  const [reemitindoExams, setReemitindoExams] = useState<
    Record<string, boolean>
  >({});
  const [filesUpload, setFilesUpload] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setLocalExames(exames || []);
  }, [exames]);

  // Função para upload de documentos
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;

    if (files && atendimento) {
      const arrFiles = Array.from(files);

      setFilesUpload((prev) => [...prev, ...arrFiles]);
    }
  };

  const handleRemoveFile = (fileName: string) => {
    setFilesUpload((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleSubmitFiles = async () => {
    if (filesUpload.length === 0 || !atendimento) return;

    setIsUploading(true);
    try {
      const formData = new FormData();

      formData.append("scheduling", JSON.stringify(atendimento));

      filesUpload.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(NEST_SCHEDULINGS_UPDATE, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setFilesUpload([]);
        // Recarregar dados para atualizar o atendimento
        const updatedResponse = await fetch(
          `${NEST_RELATORIO_FUNCIONARIO}/${atendimento._id}`,
        );

        if (updatedResponse.ok) {
          const updatedAtendimento = await updatedResponse.json();

          if (onUpdateScheduling) {
            onUpdateScheduling(updatedAtendimento);
          }
        }
      } else {
        console.error("Erro ao fazer upload dos arquivos");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Filtra exames baseado no termo de busca
  const filteredExames = useMemo(() => {
    if (!searchTerm) return localExames;

    return localExames.filter(
      (exame) =>
        exame.nomeExame.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exame.codigoExame.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exame.grupo?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [localExames, searchTerm]);

  const getExamStatusColor = (status: string) => {
    switch (status) {
      case "FINALIZADO":
        return "success";
      case "PENDENTE":
        return "warning";
      case "AGUARDANDO_RESULTADO":
        return "secondary";
      default:
        return "default";
    }
  };

  const getExamStatusIcon = (status: string) => {
    switch (status) {
      case "FINALIZADO":
        return <CheckCircle size={14} />;
      case "PENDENTE":
        return <Clock size={14} />;
      case "AGUARDANDO_RESULTADO":
        return <AlertCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const handleFileChange = (
    examKey: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      setSelectedFiles((prev) => ({ ...prev, [examKey]: file }));
      setSuccessExams((prev) => ({ ...prev, [examKey]: false }));
      setErrorExams((prev) => ({ ...prev, [examKey]: "" }));
    }
  };

  const handleUploadExam = async (exame: ExamRegister) => {
    const examKey = exame.sequencialResultadoExame || exame.codigoExame;
    const file = selectedFiles[examKey];

    if (!file) {
      setErrorExams((prev) => ({
        ...prev,
        [examKey]: "Selecione um arquivo PDF.",
      }));

      return;
    }

    setUploadingExams((prev) => ({ ...prev, [examKey]: true }));
    setErrorExams((prev) => ({ ...prev, [examKey]: "" }));
    setSuccessExams((prev) => ({ ...prev, [examKey]: false }));

    try {
      const formData = new FormData();

      formData.append("schedulingid", atendimento._id);
      formData.append("grupo", exame.grupo || "");
      formData.append("codigoExame", exame.codigoExame);
      formData.append("files", file);

      const resp = await fetch(
        `${NEST_SCHEDULINGS_UPDATE_EXAM_RESULT}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!resp.ok) {
        const text = await resp.text().catch(() => "Erro no servidor");

        throw new Error(text || "Erro no upload");
      }

      const updatedScheduling: Scheduling = await resp.json();

      if (updatedScheduling && updatedScheduling.EXAMES) {
        setLocalExames(updatedScheduling.EXAMES);
        setSelectedFiles((prev) => {
          const newFiles = { ...prev };

          delete newFiles[examKey];

          return newFiles;
        });
      }

      setSuccessExams((prev) => ({ ...prev, [examKey]: true }));
      if (onUpdateScheduling) onUpdateScheduling(updatedScheduling);
    } catch (err: any) {
      console.error("Erro upload exame", examKey, err);
      setErrorExams((prev) => ({
        ...prev,
        [examKey]: err?.message || "Falha no upload",
      }));
    } finally {
      setUploadingExams((prev) => ({ ...prev, [examKey]: false }));
    }
  };

  const handleReemitirExame = async (exame: ExamRegister) => {
    const examKey = exame.sequencialResultadoExame || exame.codigoExame;

    setReemitindoExams((prev) => ({ ...prev, [examKey]: true }));

    try {
      const responseCadastroPessoas = await fetch(NEST_SOC_CADASTROPESSOAS);

      if (responseCadastroPessoas.ok) {
        const cadastroPessoas: ICadastroPessoas[] =
          await responseCadastroPessoas.json();

        const socUser = cadastroPessoas?.find(
          (p) => p.CODIGO == exame.codigoProfissional,
        );

        if (!socUser) {
          return console.error("profissional não encontrado...");
        }

        const userInfo = mapCadastroPessoasToUserInfo(socUser);

        const response = await fetch(`${NEST_SCHEDULINGS_EXAM_UPDATE}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funcionarioId: atendimento._id,
            codigoExame: [exame.codigoExame],
            formulario: exame.formulario,
            sala: exame.sala || "",
            profissional: userInfo,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao reemitir exame");
        }

        const result = await response.json();

        console.log("Exame reemitido com sucesso:", result);

        setSuccessExams((prev) => ({ ...prev, [examKey]: true }));
        setTimeout(() => {
          setSuccessExams((prev) => ({ ...prev, [examKey]: false }));
        }, 3000);
      }
    } catch (error) {
      console.error("Erro ao reemitir exame:", error);
      setErrorExams((prev) => ({
        ...prev,
        [examKey]: "Erro ao reemitir exame",
      }));
      setTimeout(() => {
        setErrorExams((prev) => ({ ...prev, [examKey]: "" }));
      }, 3000);
    } finally {
      setReemitindoExams((prev) => ({ ...prev, [examKey]: false }));
    }
  };

  const handleViewMedicalRecord = () => {
    const prontuarioUrl = `/prontuario/${atendimento._id}`;

    window.open(prontuarioUrl, "_blank", "noopener,noreferrer");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (!localExames.length) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum exame encontrado
        </h3>
        <p className="text-gray-500">
          Não há exames cadastrados para este atendimento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header da Tabela */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Exames Realizados
          </h3>
                {/* Estatísticas */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>
            Finalizados:{" "}
            {localExames.filter((e) => e.status === "FINALIZADO").length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <span>
            Pendentes:{" "}
            {localExames.filter((e) => e.status === "PENDENTE").length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full" />
          <span>Com resultado: {localExames.filter((e) => e.url).length}</span>
        </div>
      </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            className="w-full sm:w-64"
            placeholder="Buscar exames..."
            size="sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Exames */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table
          removeWrapper
          aria-label="Tabela de exames"
          classNames={{
            base: "min-w-full",
            th: "bg-gray-50 text-gray-700 font-semibold text-sm border-b px-4 py-3",
            td: "border-b border-gray-100 px-4 py-3",
            tr: "hover:bg-gray-50 transition-colors",
          }}
        >
          <TableHeader>
            <TableColumn className="w-20">EXAME</TableColumn>
            <TableColumn className="w-2/24">STATUS</TableColumn>
            <TableColumn className="w-4/24">RESULTADO</TableColumn>
            <TableColumn className="w-5/24 text-center">AÇÕES</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredExames.map((exame, index) => {
              const examKey =
                exame.sequencialResultadoExame ||
                exame.codigoExame ||
                index.toString();
              const hasFileSelected = !!selectedFiles[examKey];
              const isUploading = uploadingExams[examKey];
              const isSuccess = successExams[examKey];
              const isReemitindo = reemitindoExams[examKey];
              const error = errorExams[examKey];
              const waitTime = calculateWaitTime(
                atendimento.TICKET?.emissao.toString(),
              );

              return (
                <TableRow key={examKey}>
                  {/* Coluna Exame */}
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900 text-sm">
                        {exame.nomeExame}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(exame.dataExame)} - {exame.profissional}
                      </div>
                      <div className="text-xs text-gray-600">
                        {exame.sala != ""
                          ? new Date(exame.dataExame).toLocaleTimeString(
                              "pt-BR",
                            )
                          : ""}{" "}
                        {exame.sala}
                      </div>
                      {waitTime && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                          {/* <Clock size={12} />
                          <span>Espera: {waitTime}</span> */}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Coluna Status */}
                  <TableCell>
                    <Chip
                      classNames={{
                        base: "px-2 py-1",
                        content: "text-xs font-medium",
                      }}
                      color={getExamStatusColor(exame.status)}
                      size="sm"
                      startContent={getExamStatusIcon(exame.status)}
                      variant="flat"
                    >
                      {exame.status}
                    </Chip>
                  </TableCell>

                  {/* Coluna Resultado */}
                  <TableCell>
                    {exame.url ? (
                      <div className="flex items-center gap-2">
                        <FileText className="text-green-600" size={16} />
                        <span className="text-sm text-green-600 font-medium">
                          Disponível
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Não enviado</span>
                    )}
                  </TableCell>

                  {/* Coluna Ações */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {/* Botão Reemitir */}
                      {/* <Button
                        className="text-purple-600 hover:text-purple-700 text-xs"
                        color="secondary"
                        isLoading={isReemitindo}
                        size="sm"
                        startContent={!isReemitindo && <Printer size={14} />}
                        variant="light"
                        onPress={() => handleReemitirExame(exame)}
                      >
                        {isReemitindo ? "Reemitindo..." : "Reemitir"}
                      </Button> */}

                      {exame.url && (
                        <Tooltip content="Visualizar">
                          <Button
                            className="text-blue-600 hover:text-blue-700"
                            size="sm"
                            variant="light"
                            onPress={() => window.open(exame.url, "_blank")}
                          >
                            <Eye size={16} />
                            Visualizar
                          </Button>
                        </Tooltip>
                      )}

                      <div className="flex items-center gap-2">
                        {/* Input file oculto */}
                        <input
                          accept="application/pdf"
                          className="hidden"
                          id={`file-${examKey}`}
                          multiple={true}
                          type="file"
                          onChange={(e) => handleFileChange(examKey, e)}
                        />

                        {/* Botão selecionar arquivo */}
                        <label
                          className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-colors truncate ${
                            hasFileSelected
                              ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                              : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          }`}
                          htmlFor={`file-${examKey}`}
                        >
                          <Upload size={12} />
                          {hasFileSelected
                            ? "Arquivo Selecionado"
                            : "Selecionar PDF"}
                        </label>

                        {/* Botão enviar */}
                        <Button
                          className="text-xs h-8 min-w-20"
                          color="primary"
                          disabled={!hasFileSelected || isUploading}
                          size="sm"
                          startContent={
                            isUploading ? (
                              <Spinner size="sm" />
                            ) : (
                              <Upload size={12} />
                            )
                          }
                          onPress={() => handleUploadExam(exame)}
                        >
                          {isUploading ? "Enviando..." : "Enviar"}
                        </Button>
                      </div>
                    </div>

                    {/* Mensagens de feedback */}
                    {hasFileSelected && selectedFiles[examKey] && (
                      <div className="mt-2 text-xs text-gray-600">
                        Arquivo: {selectedFiles[examKey].name}
                      </div>
                    )}

                    {isSuccess && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle size={12} />
                        <span>Enviado com sucesso!</span>
                      </div>
                    )}

                    {error && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-red-600">
                        <AlertCircle size={12} />
                        <span>{error}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
            {/* Upload de Documentos */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-medium text-gray-900 mb-3">Upload de Documentos</h4>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`cursor-pointer inline-flex items-center px-4 py-2 rounded-lg border transition-colors ${
                isUploading 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed border-gray-300' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500'
              }`}
            >
              <Upload size={16} className="mr-2" />
              Selecionar Documentos {filesUpload.length > 0 ? `(${filesUpload.length})` : ""}
            </label>
          </div>
          
          {filesUpload.length > 0 && (
            <Button
              color="success"
              onPress={handleSubmitFiles}
              isLoading={isUploading}
              className="text-white"
            >
              Enviar Arquivos
            </Button>
          )}
        </div>

        {filesUpload.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-gray-600">Arquivos selecionados:</p>
            <div className="flex flex-wrap gap-2">
              {filesUpload.map(file => (
                <Chip
                  key={file.name}
                  size="sm"
                  onClose={() => handleRemoveFile(file.name)}
                  variant="flat"
                  color="primary"
                  className="text-xs"
                >
                  {file.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ExamesTable.displayName = "ExamesTable";

const LazyModalContent: React.FC<LazyModalContentProps> = ({
  atendimento,
  onClose,
  onUpdateScheduling,
}) => {
  const [editMode, setEditMode] = useState<EditModeState>({
    isEditing: false,
    editedData: {},
  });

  const handleSaveEmployeeData = async (data: Partial<Scheduling>) => {
    try {
      const response = await fetch(`/update/document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          atendimentoId: atendimento._id,
          updates: data,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar dados do funcionário");
      }

      const updatedAtendimento = await response.json();

      if (onUpdateScheduling) {
        onUpdateScheduling(updatedAtendimento);
      }

      return updatedAtendimento;
    } catch (error) {
      console.error("Erro ao salvar dados do funcionário:", error);
      throw error;
    }
  };

  const handleViewMedicalRecord = () => {
    const prontuarioUrl = `/prontuario/${atendimento._id}`;

    window.open(prontuarioUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h2 className="text-xl font-bold">Detalhes do Atendimento</h2>
            <p className="text-sm text-gray-600 mt-1">
              {atendimento.NOME} - {atendimento.NOMEEMPRESA}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Visualizar prontuário completo">
              <Button
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                color="primary"
                size="md"
                startContent={<User size={16} />}
                variant="light"
                onPress={handleViewMedicalRecord}
              >
                Visualizar Prontuário
              </Button>
            </Tooltip>
                    <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {editMode.isEditing ? (
              <>
                <Tooltip content="Cancelar edição">
                  <Button
                    isIconOnly
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    color="danger"
                    size="md"
                    variant="light"
                    // onPress={handleEditToggle}
                  >
                    <X size={16} />
                  </Button>
                </Tooltip>
                <Tooltip content="Salvar alterações">
                  <Button
                    isIconOnly
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    color="success"
                    // isLoading={isSaving}
                    size="md"
                    variant="light"
                    // onPress={handleSave}
                  >
                    <Save size={16} />
                  </Button>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip content="Sincronizar dados">
                  <Button
                    isIconOnly
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                    color="secondary"
                    size="sm"
                    variant="light"
                    onPress={() => console.log("Sincronizar dados")}
                  >
                    <RefreshCw size={16} />
                  </Button>
                </Tooltip>
                <Tooltip content="Editar dados do paciente">
                  <Button
                    isIconOnly
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    color="primary"
                    size="sm"
                    variant="light"
                    // onPress={handleEditToggle}
                  >
                    <Edit size={16} />
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <InformacoesGerais
          atendimento={atendimento}
          editMode={editMode}
          onEditModeChange={setEditMode}
          onSave={handleSaveEmployeeData}
        />
        <div>
          <ExamesTable
            atendimento={atendimento}
            exames={atendimento.EXAMES}
            onUpdateScheduling={onUpdateScheduling}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="light" onPress={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </>
  );
};

LazyModalContent.displayName = "LazyModalContent";
export default LazyModalContent;
