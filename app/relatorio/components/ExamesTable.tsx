import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Eye,
  MoreVertical,
  Pen,
  Trash,
  Printer,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import ExamEditModal from "./ExamEditModal";
import ExamUploadModal from "./ExamUploadModal";
import DeleteAttachmentModal from "./DeleteAttachmentModal";
import { SelectedFile } from "./SelectedFilesList";

import { adjustForBrazilTime } from "@/lib/utils";
import {
  ExamRegister,
  Scheduling,
} from "@/lib/scheduling/interface/scheduling";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";
import { NEST_RELATORIO_FUNCIONARIO, NEST_SCHEDULINGS_EXAM_REISSUE } from "@/config/constants";
import { IUserInfo, useUser } from "@/hooks/useUser";

// ============================================
// COMPONENTE: ExamesTable
// ============================================

interface UploadExamModalState {
  isOpen: boolean;
  exame: ExamRegister | null;
  selectedFiles: SelectedFile[];
  isUploading: boolean;
  error: string;
  success: boolean;
}

const ExamesTable: React.FC<{
  exames: ExamRegister[];
  atendimento: Scheduling;
  userApp: IUserInfo | null;
  onUpdateScheduling?: (updated: Scheduling) => void;
}> = ({ exames, atendimento, userApp, onUpdateScheduling }) => {
  const [localExames, setLocalExames] = useState<ExamRegister[]>(exames || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadExamModal, setUploadExamModal] = useState<UploadExamModalState>({
    isOpen: false,
    exame: null,
    selectedFiles: [],
    isUploading: false,
    error: "",
    success: false,
  });
  const [deleteAttachmentModal, setDeleteAttachmentModal] = useState<{
    isOpen: boolean;
    examId: string;
    examName: string;
    examGrupo: string;
  }>({ isOpen: false, examId: "", examName: "", examGrupo: "" });
  const [editExamModal, setEditExamModal] = useState<{
    isOpen: boolean;
    exam: ExamRegister | null;
  }>({ isOpen: false, exam: null });

  const [reemitindoExams, setReemitindoExams] = useState<boolean>(false)

  // Função para buscar exames atualizados do backend
  const fetchUpdatedExames = async () => {
    try {
      const response = await fetch(
        `${NEST_RELATORIO_FUNCIONARIO}${atendimento._id}`,
      );

      if (response.ok) {
        const updatedAtendimento = await response.json();
        const updatedExams = updatedAtendimento.EXAMES || [];

        // Atualiza o estado local
        setLocalExames(updatedExams);

        // Notifica o componente pai se necessário
        if (onUpdateScheduling) {
          onUpdateScheduling(updatedAtendimento);
        }

        console.log("Exames atualizados via refetch:", updatedExams.length);
      }
    } catch (error) {
      console.error("Erro ao buscar exames atualizados:", error);
    }
  };

  useEffect(() => {
    setLocalExames(exames || []);
  }, [exames]);

  const handleUploadSuccess = (updatedScheduling: Scheduling) => {
    setLocalExames(updatedScheduling.EXAMES || []);
    if (onUpdateScheduling) {
      onUpdateScheduling(updatedScheduling);
    }
  };

  const handleDeleteSuccess = (updatedScheduling?: Scheduling) => {
    // Fecha o modal de confirmação
    setDeleteAttachmentModal({
      isOpen: false,
      examId: "",
      examName: "",
      examGrupo: "",
    });

    if (updatedScheduling) {
      // Atualiza o estado local com os dados recebidos do backend
      setLocalExames(updatedScheduling.EXAMES || []);

      // Atualiza o componente pai se necessário
      if (onUpdateScheduling) {
        onUpdateScheduling(updatedScheduling);
      }
    } else {
      // Se não recebeu os dados atualizados, faz uma nova requisição para buscar
      fetchUpdatedExames();
    }
  };

  // Handle para reemitir exame
   const handleReemitirExame = async (exame: ExamRegister) => {
    setReemitindoExams(true);

    try {
        const response = await fetch(`${NEST_SCHEDULINGS_EXAM_REISSUE}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funcionarioId: atendimento._id,
            codigoExame: exame.codigoExame,
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao reemitir exame");
        }

        const result: Scheduling = await response.json();
        
        if(result){
          alert("Reemissão enviada para processamento, atualize a página para visualizar o resultado.")
        } else {
          throw new Error("Atualização não concluída.")
        }
      
    } catch (error) {
      console.error("Erro ao reemitir exame:", error);
      alert(error)
    } finally {
      // fim de atualizacao
      setReemitindoExams(false)
    }
  };

  // Handler para quando o modal de edição é fechado
  const handleEditModalClose = () => {
    setEditExamModal({ isOpen: false, exam: null });

    // Faz refetch dos exames após fechar o modal
    // Usamos setTimeout para garantir que o backend já processou a atualização
    setTimeout(() => {
      fetchUpdatedExames();
    }, 1500);
  };

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
      case ExamStatus.FINALIZADO:
        return "success";
      case ExamStatus.PENDENTE:
        return "warning";
      case ExamStatus.AGUARDANDO_RESULTADO:
        return "secondary";
      default:
        return "default";
    }
  };

  const getExamStatusIcon = (status: string) => {
    switch (status) {
      case ExamStatus.FINALIZADO:
        return <CheckCircle size={14} />;
      case ExamStatus.PENDENTE:
        return <Clock size={14} />;
      case ExamStatus.AGUARDANDO_RESULTADO:
        return <AlertCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleString("pt-BR");
  };

  const calculateWaitTime = (
    ticketTime: Date | null | undefined,
    exame: ExamRegister,
  ) => {
    if (!ticketTime || !exame) return null;

    try {
      const ticketDate = adjustForBrazilTime(new Date(ticketTime));
      const exameDate = adjustForBrazilTime(new Date(exame.dataExame));

      const diffMs = exameDate.getTime() - ticketDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes <= 0) {
        return "0 min";
      }

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
    <div className="space-y-4">
      {/* Modal para exclusão de anexo */}
      <DeleteAttachmentModal
        atendimentoId={atendimento._id}
        examGrupo={deleteAttachmentModal.examGrupo}
        examId={deleteAttachmentModal.examId}
        examName={deleteAttachmentModal.examName}
        isOpen={deleteAttachmentModal.isOpen}
        onClose={() =>
          setDeleteAttachmentModal({
            isOpen: false,
            examId: "",
            examName: "",
            examGrupo: "",
          })
        }
        onSuccess={handleDeleteSuccess}
      />

      {/* Modal de edição de exame - COM REFETCH APÓS FECHAR */}
      {editExamModal.isOpen && editExamModal.exam && (
        <ExamEditModal
          atendimento={atendimento}
          exame={editExamModal.exam}
          isOpen={editExamModal.isOpen}
          onClose={handleEditModalClose}
        />
      )}

      {/* Modal de upload de resultado */}
      {uploadExamModal.isOpen && uploadExamModal.exame && (
        <ExamUploadModal
          atendimento={atendimento}
          exame={uploadExamModal.exame}
          isOpen={uploadExamModal.isOpen}
          onClose={() =>
            setUploadExamModal({
              isOpen: false,
              exame: null,
              selectedFiles: [],
              isUploading: false,
              error: "",
              success: false,
            })
          }
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* Header com filtro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Exames Realizados
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              {localExames.filter((e) => e.status === "FINALIZADO").length}{" "}
              Finalizados
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              {localExames.filter((e) => e.status === "PENDENTE").length}{" "}
              Pendentes
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              {localExames.filter((e) => e.url).length} Com resultado
            </span>
          </div>
        </div>
        <Input
          className="w-full sm:w-64"
          placeholder="Buscar exames..."
          size="sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabela de exames */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table
          removeWrapper
          aria-label="Tabela de exames"
          classNames={{
            base: "min-w-full",
            th: "bg-gray-50 text-gray-700 font-semibold text-xs px-3 py-2",
            td: "px-3 py-2",
          }}
        >
          <TableHeader>
            <TableColumn>EXAME</TableColumn>
            <TableColumn className="w-4/24">STATUS</TableColumn>
            <TableColumn>RESULTADO</TableColumn>
            <TableColumn className="text-center">AÇÕES</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredExames.map((exame, index) => {
              const examKey = exame.codigoExame || index.toString();
              const waitTime = calculateWaitTime(
                atendimento.TICKET?.emissao,
                exame,
              );

              return (
                <TableRow key={examKey}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900 text-sm">
                        {exame.nomeExame}
                      </div>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span>{formatDate(exame.dataExame)}</span>
                        <span>{exame.sala}</span>
                        <span>{exame.profissional}</span>
                      </div>
                      {waitTime && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <span>Espera: {waitTime}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      classNames={{ content: "text-xs" }}
                      color={getExamStatusColor(exame.status)}
                      size="sm"
                      startContent={getExamStatusIcon(exame.status)}
                      variant="flat"
                    >
                      {exame.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-4">
                      <div className="flex flex-col gap-1">
                        <Button
                          color="primary"
                          size="sm"
                          startContent={<Upload size={14} />}
                          variant="solid"
                          onPress={() =>
                            setUploadExamModal({
                              isOpen: true,
                              exame,
                              selectedFiles: [],
                              isUploading: false,
                              error: "",
                              success: false,
                            })
                          }
                        >
                          Enviar
                        </Button>
                      </div>
                      {exame.url && (
                        <div className="flex flex-col gap-1">
                          <Button
                            className="w-full"
                            color="primary"
                            size="sm"
                            startContent={<Eye size={14} />}
                            variant="light"
                            onPress={() => window.open(exame.url, "_blank")}
                          >
                            Visualizar
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            className="min-w-8"
                            size="sm"
                            variant="light"
                          >
                            <MoreVertical size={14} />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Ações do exame">
                          <DropdownItem
                            key="reemitir"
                            color="default"
                            startContent={!reemitindoExams && <Printer size={14} />}
                            variant="light"
                            onPress={() => handleReemitirExame(exame)}
                          >
                            {reemitindoExams ? "Reemitindo..." : "Reemitir"}
                          </DropdownItem>
                          {userApp?.codigo == exame.codigoProfissional ? (
                            <DropdownItem
                              key="edit"
                              startContent={<Pen size={14} />}
                              textValue="Editar Exame"
                              onPress={() =>
                                setEditExamModal({ isOpen: true, exam: exame })
                              }
                            >
                              Editar Exame
                            </DropdownItem>
                          ) : null}
                          {exame.url ? (
                            <DropdownItem
                              key="delete-result"
                              className="text-danger"
                              color="danger"
                              startContent={<Trash size={14} />}
                              textValue="Remover Resultado"
                              onPress={() =>
                                setDeleteAttachmentModal({
                                  isOpen: true,
                                  examId: exame.codigoExame,
                                  examName: exame.nomeExame,
                                  examGrupo: exame.grupo || "",
                                })
                              }
                            >
                              Remover Resultado
                            </DropdownItem>
                          ) : null}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default React.memo(ExamesTable);
