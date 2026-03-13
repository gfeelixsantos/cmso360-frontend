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
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  MoreVertical,
  Pen,
  Printer,
  Trash,
  Upload,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import DeleteAttachmentModal from "./DeleteAttachmentModal";
import ExamEditModal from "./ExamEditModal";
import ExamUploadModal from "./ExamUploadModal";
import { SelectedFile } from "./SelectedFilesList";

import {
  NEST_RELATORIO_FUNCIONARIO,
  NEST_SCHEDULINGS_EXAM_REISSUE,
  NEST_SCHEDULINGS_EXAM_UPDATE,
} from "@/config/constants";
import { ExamStatus } from "@/lib/scheduling/enum/scheduling.enum";
import {
  ExamRegister,
  Scheduling,
} from "@/lib/scheduling/interface/scheduling";
import { getCurrentUser } from "@/lib/utils";
import { IUserInfo } from "@/hooks/useUser";

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

  const [reemitindoExams, setReemitindoExams] = useState<boolean>(false);
  const [isCredenciada, setIsCredenciada] = useState<boolean>(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    const isCredenciada =
      atendimento?.NOMECARGO?.includes("KIT CREDENCIADA") ||
      atendimento?.NOMESETOR?.includes("KIT CREDENCIADA");

    setIsCredenciada(isCredenciada);
  }, [atendimento?.NOMECARGO, atendimento?.NOMESETOR]);

  const fetchUpdatedExames = async () => {
    try {
      const response = await fetch(
        `${NEST_RELATORIO_FUNCIONARIO}${atendimento._id}`,
      );

      if (response.ok) {
        const updatedAtendimento = await response.json();
        const updatedExams = updatedAtendimento.EXAMES || [];

        setLocalExames(updatedExams);

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
    setDeleteAttachmentModal({
      isOpen: false,
      examId: "",
      examName: "",
      examGrupo: "",
    });

    if (updatedScheduling) {
      setLocalExames(updatedScheduling.EXAMES || []);

      if (onUpdateScheduling) {
        onUpdateScheduling(updatedScheduling);
      }
    } else {
      fetchUpdatedExames();
    }
  };

  const handleReemitirExame = async (exame: ExamRegister) => {
    if (!exame.formulario || !exame.profissional || !exame.codigoProfissional) {
      alert("Dados incompletos para reemissao de exame");
      return;
    }

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

      if (result) {
        alert(
          "Reemissao enviada para processamento, atualize a pagina para visualizar o resultado.",
        );
      } else {
        throw new Error("Atualizacao nao concluida.");
      }
    } catch (error) {
      console.error("Erro ao reemitir exame:", error);
      alert(error);
    } finally {
      setReemitindoExams(false);
    }
  };

  const handleFinalizarExame = async (exame: ExamRegister) => {
    if (exame.grupo != "Ultrassom") {
      return alert("Exame nao identificado como Ultrassom para finalizacao.");
    }

    const confirmResponse = confirm("Finalizar Ultrassom como NORMAL ?");

    try {
      const response = await fetch(NEST_SCHEDULINGS_EXAM_UPDATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          funcionarioId: atendimento._id,
          codigoExame: [exame.codigoExame],
          formulario: {
            normal: confirmResponse ? "Sim" : "Nao",
            observacoes: "",
          },
          sala: "Emitido via relatorio",
          profissional: currentUser ?? "Desconhecido",
          isEditing: true,
          dataExame: new Date(),
        }),
      });

      const result: Scheduling = await response.json();

      if (result) {
        alert("Exame atualizado, atualize a pagina para ver o resultado.");
      }
    } catch (err) {
      alert(`Erro ao finalizar exame ${err}`);
    }
  };

  const handleEditModalClose = () => {
    setEditExamModal({ isOpen: false, exam: null });

    setTimeout(() => {
      fetchUpdatedExames();
    }, 1500);
  };

  const filteredExames = useMemo(() => {
    if (!searchTerm) return localExames;

    return localExames.filter(
      (exame) =>
        exame.nomeExame?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exame.codigoExame?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const getSignatureStatusMeta = (exame: ExamRegister) => {
    const signatureStatus = exame.signatureInfo?.status;

    if (
      !signatureStatus ||
      signatureStatus === "NOT_REQUIRED" ||
      signatureStatus === "NAO_REQUER_ASSINATURA"
    ) {
      return null;
    }

    if (
      signatureStatus === "WAITING_AUTH" ||
      signatureStatus === "AGUARDANDO_AUTENTICACAO" ||
      signatureStatus === "PROCESSING" ||
      signatureStatus === "PROCESSANDO_ASSINATURA"
    ) {
      return {
        icon: <Clock size={12} className="text-amber-600" />,
        label:
          signatureStatus === "PROCESSING" ||
          signatureStatus === "PROCESSANDO_ASSINATURA"
            ? "Processando assinatura digital"
            : "Aguardando assinatura digital",
        labelClassName: "text-amber-700",
        detail:
          exame.signatureInfo?.provider &&
          `via ${exame.signatureInfo.provider.toUpperCase()}`,
        detailClassName: "text-amber-600/80",
      };
    }

    if (
      signatureStatus === "PENDING_RETRY" ||
      signatureStatus === "AGUARDANDO_REPROCESSAMENTO" ||
      signatureStatus === "FAILED" ||
      signatureStatus === "FALHA_ASSINATURA"
    ) {
      return {
        icon: <AlertCircle size={12} className="text-rose-600" />,
        label:
          signatureStatus === "FAILED" ||
          signatureStatus === "FALHA_ASSINATURA"
            ? "Falha na assinatura digital"
            : "Aguardando reprocessamento da assinatura",
        labelClassName: "text-rose-700",
        detail:
          exame.signatureInfo?.lastError ||
          (exame.signatureInfo?.provider &&
            `via ${exame.signatureInfo.provider.toUpperCase()}`),
        detailClassName: "text-rose-600/80",
      };
    }

    if (signatureStatus === "SIGNED" || signatureStatus === "ASSINADO") {
      return {
        icon: <CheckCircle size={12} className="text-emerald-600" />,
        label: "Assinado digitalmente",
        labelClassName: "text-emerald-700",
        detail:
          exame.signatureInfo?.provider &&
          `via ${exame.signatureInfo.provider.toUpperCase()}`,
        detailClassName: "text-emerald-600/80",
      };
    }

    return null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    return new Date(dateString).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  };

  const calculateWaitTime = (
    ticketTime: Date | null | undefined,
    exame: ExamRegister,
  ) => {
    if (!ticketTime || !exame) return null;

    try {
      const ticketDate = new Date(ticketTime);
      const exameDate = new Date(exame.dataExame);
      const diffMs = exameDate.getTime() - ticketDate.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (diffMinutes <= 0) {
        return "0 min";
      }

      if (diffMinutes < 60) {
        return `${diffMinutes} min`;
      }

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      return `${hours}h ${minutes}min`;
    } catch {
      return null;
    }
  };

  if (!localExames.length) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-8 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
        <h3 className="mb-2 text-lg font-medium text-gray-900">
          Nenhum exame encontrado
        </h3>
        <p className="text-gray-500">
          Nao ha exames cadastrados para este atendimento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {editExamModal.isOpen && editExamModal.exam && (
        <ExamEditModal
          atendimento={atendimento}
          exame={editExamModal.exam}
          isOpen={editExamModal.isOpen}
          onClose={handleEditModalClose}
        />
      )}

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Exames Realizados
          </h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              {localExames.filter((e) => e.status === "FINALIZADO").length}{" "}
              Finalizados
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              {localExames.filter((e) => e.status === "PENDENTE").length}{" "}
              Pendentes
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
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

      <div className="overflow-hidden rounded-lg border border-gray-200">
        <Table
          removeWrapper
          aria-label="Tabela de exames"
          classNames={{
            base: "min-w-full",
            th: "bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700",
            td: "px-3 py-2",
          }}
        >
          <TableHeader>
            <TableColumn>EXAME</TableColumn>
            <TableColumn className="w-4/24">STATUS</TableColumn>
            <TableColumn>RESULTADO</TableColumn>
            <TableColumn className="text-center">ACOES</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredExames.map((exame, index) => {
              const examKey = exame.codigoExame || index.toString();
              const waitTime = calculateWaitTime(
                atendimento.TICKET?.emissao,
                exame,
              );
              const signatureMeta = getSignatureStatusMeta(exame);

              return (
                <TableRow key={examKey}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {exame.nomeExame}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <div>{formatDate(exame.dataExame)}</div>
                        <div>
                          {exame.sala} - {exame.profissional}
                        </div>
                        {waitTime && (
                          <div className="flex items-center text-xs text-gray-500">
                            <span>Espera: {waitTime}</span>
                          </div>
                        )}
                      </div>
                      {signatureMeta && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                          <div
                            className={`inline-flex items-center gap-1 font-medium ${signatureMeta.labelClassName}`}
                          >
                            {signatureMeta.icon}
                            <span>{signatureMeta.label}</span>
                          </div>
                          {signatureMeta.detail && (
                            <span
                              className={`max-w-full truncate ${signatureMeta.detailClassName}`}
                              title={signatureMeta.detail}
                            >
                              {signatureMeta.detail}
                            </span>
                          )}
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
                          color={isCredenciada ? "default" : "primary"}
                          disabled={isCredenciada}
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
                        <DropdownMenu aria-label="Acoes do exame">
                          <DropdownItem
                            key="reemitir"
                            color="default"
                            startContent={
                              !reemitindoExams && <Printer size={14} />
                            }
                            variant="light"
                            onPress={() => handleReemitirExame(exame)}
                          >
                            {reemitindoExams ? "Reemitindo..." : "Reemitir"}
                          </DropdownItem>
                          {exame.grupo?.includes("Ultrassom") ? (
                            <DropdownItem
                              key="finalizar"
                              color="default"
                              startContent={
                                !reemitindoExams && <Check size={14} />
                              }
                              variant="light"
                              onPress={() => handleFinalizarExame(exame)}
                            >
                              {reemitindoExams ? "Finalizando.." : "Finalizar"}
                            </DropdownItem>
                          ) : null}
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