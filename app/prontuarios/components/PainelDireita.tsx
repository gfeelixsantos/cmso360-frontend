// PainelDireita.tsx
"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addToast,
  Button,
  Card,
  CardBody,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Textarea,
  Alert,
  Accordion,
  AccordionItem,
  RadioGroup,
  Radio,
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import {
  ClipboardList,
  Eye,
  UserCheck,
} from "lucide-react";
import { IUserInfo } from "@/lib/user/interfaces/IUser";
import {
  AtendimentoStatus,
  ExamStatus,
  ParecerEspaçoConfinado,
  ParecerMedico,
  ParecerTrabalhoAltura,
} from "@/lib/scheduling/enum/scheduling.enum";
import {
  CODIGOS_ESPACO_CONFINADO,
  CODIGOS_RISCO_ALTURA,
  USER_PROFILE,
} from "@/config/constants";
import { NEST_SCHEDULINGS_FINISH } from "@/config/constants";
import { Scheduling } from "@/lib/scheduling/interface/scheduling";
import { MedicalRecord } from "../page";

/* ---------------------- Tipos para Laudos ---------------------- */

enum LaudoTipo {
  PCD = "PCD",
  RESTRICAO_TEMPORARIA = "RESTRICAO_TEMPORARIA",
}

type LaudoPCDData = {
  cid: string;
  descricaoCid: string;
  limitacoes: string;
  adaptacoesNecessarias: string;
  observacoes: string;
};

type LaudoRestricaoData = {
  cid: string;
  descricaoCid: string;
  restricoes: string;
  periodoDias: number;
  dataInicio: string;
  dataFim: string;
  recomendacoes: string;
};

export type MedicalOpinionData = {
  opinionType: ParecerMedico | null;
  details?: string | null;
  laudoPCD?: LaudoPCDData | null;
  laudoRestricao?: LaudoRestricaoData | null;
  altura?: ParecerTrabalhoAltura | null;
  confinado?: ParecerEspaçoConfinado | null;
};

type PdfUrl = {
  url: string;
  title: string;
  type: "exame" | "anexo";
  examName?: string;
  grupo?: string;
};

interface RightPanelProps {
  selectedRecord: MedicalRecord | null;
  setSelectedRecord: React.Dispatch<React.SetStateAction<MedicalRecord | null>>;
  currentPdfIndex: number;
  onPdfIndexChange: (index: number) => void;
  user: IUserInfo;
  onRecordUpdate: (record: MedicalRecord) => void;
}

const PainelDireita: React.FC<RightPanelProps> = ({
  selectedRecord,
  setSelectedRecord,
  currentPdfIndex,
  onPdfIndexChange,
  user,
  onRecordUpdate,
}) => {
  /* ---------------------- Hooks (sempre no topo) ---------------------- */
  const [opinion, setOpinion] = useState<MedicalOpinionData>({
      opinionType: null,
      details: null,
      laudoPCD: null,
      laudoRestricao: null,
      altura: null,
      confinado: null
  });

  const [isSavingOpinion, setIsSavingOpinion] = useState(false);
  const [uploadStates, setUploadStates] = useState<
    Record<string, Record<string, { file: File; progress: number; uploading: boolean; url?: string }>>
  >({});
  const [laudoModalOpen, setLaudoModalOpen] = useState(false);
  const [examesAccordionOpen, setExamesAccordionOpen] = useState<string[]>([]);

  // Refs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /* ---------------------- Util helpers puros ---------------------- */
  const todayIso = useCallback(() => new Date().toISOString().split("T")[0], []);
  const calcularDataFim = useCallback((inicio: string, dias: number) => {
    const data = new Date(inicio);
    data.setDate(data.getDate() + dias);
    return data.toISOString().split("T")[0];
  }, []);

  /* ---------------------- Derived / Memoized data ---------------------- */
  const examesComSala = useMemo(
    () => (selectedRecord?.EXAMES || []).filter((e) => e.sala != ""),
    [selectedRecord]
  );

  const hasHeightRisk = Array.isArray(selectedRecord?.RISCOSASO)
  ? selectedRecord?.RISCOSASO?.some((r) => CODIGOS_RISCO_ALTURA.has(r.codigo))
  : false;

  const hasConfinedRisk = Array.isArray(selectedRecord?.RISCOSASO)
  ? selectedRecord?.RISCOSASO?.some((r) => CODIGOS_ESPACO_CONFINADO.has(r.codigo))
  : false;

  const hasPdfForExame = useCallback(
    (exameGrupo: string) =>
      !!selectedRecord?.pdfUrls?.some((p) => p.grupo === exameGrupo && p.type === "exame"),
    [selectedRecord]
  );

  /* ---------------------- Lifecycle: initialize opinion quando abre registro ---------------------- */
  useEffect(() => {
    // Sempre inicializa ou reseta opinion ao selecionar um registro (preservando se já houver dados)
    if (!selectedRecord) return;

    setOpinion((prev) => {
      // Se já havia um parecer associado no selectedRecord (campo MEDICO / RECOMENDACAO etc.)
      // você pode inicializar com dados aqui. Atualmente mantemos comportamento anterior: inicializa vazio.
      return prev ?? {
        opinionType: null,
        details: "",
        laudoPCD: null,
        laudoRestricao: null,
        altura: null,
        confinado: null,
      };
    });
  }, [selectedRecord]);

  /* ---------------------- Handlers (useCallback) ---------------------- */

  const simulateUploadFile = useCallback(
    async (file: File, onProgress?: (p: number) => void) => {
      return new Promise<{ url: string }>((resolve) => {
        let progress = 0;
        const i = setInterval(() => {
          progress += 10;
          onProgress?.(progress);
          if (progress >= 100) {
            clearInterval(i);
            const fakeUrl = `/uploads/${Date.now()}-${file.name}`;
            resolve({ url: fakeUrl });
          }
        }, 150);
      });
    },
    []
  );

  const handleFileInputClick = useCallback((codigoExame: string) => {
    fileInputRefs.current[codigoExame]?.click();
  }, []);

  const handleFileSelected = useCallback(
    (codigoExame: string, event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0 || !selectedRecord) return;

      const file = files[0];

      if (file.type !== "application/pdf") {
        addToast({
          title: "Formato inválido",
          description: "Apenas PDF é permitido.",
          color: "warning",
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        addToast({
          title: "Arquivo muito grande",
          description: "Tamanho máximo: 10MB.",
          color: "warning",
        });
        return;
      }

      setUploadStates((prev) => ({
        ...prev,
        [selectedRecord._id as string]: {
          ...(prev[selectedRecord._id as string] || {}),
          [codigoExame]: { file, progress: 0, uploading: false },
        },
      }));

      event.target.value = "";
    },
    [selectedRecord]
  );

  const startUpload = useCallback(
    async (codigoExame: string) => {
      if (!selectedRecord) return;

      const state = uploadStates[selectedRecord._id as string]?.[codigoExame];
      if (!state?.file) return;

      setUploadStates((prev) => ({
        ...prev,
        [selectedRecord._id as string]: {
          ...(prev[selectedRecord._id as string] || {}),
          [codigoExame]: { ...state, uploading: true, progress: 0 },
        },
      }));

      try {
        const res = await simulateUploadFile(state.file, (p) => {
          setUploadStates((prev) => ({
            ...prev,
            [selectedRecord._id as string]: {
              ...(prev[selectedRecord._id as string] || {}),
              [codigoExame]: {
                ...(prev[selectedRecord._id as string]?.[codigoExame] || {}),
                file: state.file,
                uploading: true,
                progress: p,
              },
            },
          }));
        });

        // Simula atualização do registro com o novo PDF (preservei a intenção original, sem chamar API)
        setTimeout(() => {
          setUploadStates((prev) => {
            const copy = { ...prev };
            if (copy[selectedRecord._id as string] && copy[selectedRecord._id as string][codigoExame]) {
              delete copy[selectedRecord._id as string][codigoExame];
            }
            return copy;
          });
        }, 1200);

        addToast({
          title: "Upload realizado",
          description: "Arquivo enviado com sucesso.",
          color: "success",
        });
      } catch (err) {
        console.error("Upload falhou:", err);
        addToast({
          title: "Erro no upload",
          description: "Não foi possível enviar o arquivo.",
          color: "danger",
        });
        setUploadStates((prev) => ({
          ...prev,
          [selectedRecord._id as string]: {
            ...(prev[selectedRecord._id as string] || {}),
            [codigoExame]: {
              ...(prev[selectedRecord._id as string]?.[codigoExame] || {}),
              uploading: false,
              progress: 0,
            },
          },
        }));
      }
    },
    [simulateUploadFile, selectedRecord, uploadStates]
  );

  const cancelUpload = useCallback(
    (codigoExame: string) => {
      if (!selectedRecord) return;

      setUploadStates((prev) => {
        const copy = { ...prev };
        if (copy[selectedRecord._id as string] && copy[selectedRecord._id as string][codigoExame]) {
          delete copy[selectedRecord._id as string][codigoExame];
        }
        return copy;
      });
    },
    [selectedRecord]
  );

  const selectPdfFromExame = useCallback(
    (exameGrupo: string) => {
      if (!selectedRecord) return;

      const pdfIndex = selectedRecord.pdfUrls.findIndex((pdf) => pdf.grupo === exameGrupo && pdf.type === "exame");

      if (pdfIndex !== -1) {
        document.getElementById('pdf-viewer')?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        onPdfIndexChange(pdfIndex);
      }
    },
    [onPdfIndexChange, selectedRecord]
  );

  const isExamBeingDisplayed = useCallback(
    (exameGrupo: string) => {
      if (!selectedRecord || !selectedRecord.pdfUrls[currentPdfIndex]?.grupo) return false;
      return selectedRecord.pdfUrls[currentPdfIndex].grupo === exameGrupo;
    },
    [currentPdfIndex, selectedRecord]
  );

  /* ---------------------- Regras de negócio: quando justificativa é necessária ---------------------- */
  const opinionRequiresDetails = useCallback((op: MedicalOpinionData | null) => {
    if (!op) return false;
    const mainRequires =
      !!op.opinionType &&
      [
        ParecerMedico.APTO_COM_ORIENTACAO,
        ParecerMedico.SOLICITAR_REPETICAO,
        ParecerMedico.INAPTO,
        ParecerMedico.INAPTO_TEMPORARIAMENTE,
      ].includes(op.opinionType);
    const alturaInapto = op.altura === (ParecerTrabalhoAltura as any).INAPTO_ALTURA;
    const confinadoInapto = op.confinado === (ParecerEspaçoConfinado as any).INAPTO_CONFINADO;
    return Boolean(mainRequires || alturaInapto || confinadoInapto);
  }, []);

  /* ---------------------- Save opinion (validação e envio) ---------------------- */
  const saveOpinion = useCallback(async () => {
    if (!opinion || !opinion.opinionType || !selectedRecord) {
      addToast({
        variant: "solid",
        title: "Parecer incompleto",
        description: "Selecione um parecer médico antes de salvar.",
        color: "danger",
      });
      return;
    }

    // valida justificativa quando necessária
    if (opinionRequiresDetails(opinion) && (!opinion.details || opinion.details.trim() === "")) {
      addToast({
        variant: "solid",
        title: "Justificativa necessária",
        description: "Este parecer exige justificativa. Preencha o campo 'Detalhes' antes de salvar.",
        color: "danger",
      });
      return;
    }

    setIsSavingOpinion(true);

    try {
      const response = await fetch(NEST_SCHEDULINGS_FINISH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduledId: selectedRecord._id,
          user: user,
          options: opinion,
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar parecer");

      // Você pode extrair e usar o retorno real do backend aqui se necessário
      const updatedRecord = {
        ...selectedRecord,
      };

      onRecordUpdate(updatedRecord);
      setOpinion({ opinionType: null, altura: null, confinado: null, details: null, laudoPCD: null, laudoRestricao: null });
      setSelectedRecord(null)

      addToast({
        title: "Prontuário liberado",
        description: "Parecer médico salvo com sucesso.",
        color: "foreground",
      });
    } catch (err) {
      console.error(err);
      addToast({
        variant: "solid",
        title: "Erro ao finalizar prontuário",
        description: "Verifique detalhes no console, se o erro persistir contate o suporte.",
        color: "danger",
      });
    } finally {
      setIsSavingOpinion(false);
    }
  }, [opinion, opinionRequiresDetails, onRecordUpdate, selectedRecord, user]);

  /* ---------------------- Laudos Modal (com hooks locais - componente definido aqui) ---------------------- */
  const LaudosModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (tipo: LaudoTipo, data: any) => void;
  }> = ({ isOpen, onClose, onSave }) => {
    const [tipoLaudo, setTipoLaudo] = useState<LaudoTipo>(LaudoTipo.RESTRICAO_TEMPORARIA);
    const [laudoPCD, setLaudoPCD] = useState<LaudoPCDData>({
      cid: "",
      descricaoCid: "",
      limitacoes: "",
      adaptacoesNecessarias: "",
      observacoes: "",
    });
    const [laudoRestricao, setLaudoRestricao] = useState<LaudoRestricaoData>({
      cid: "",
      descricaoCid: "",
      restricoes: "",
      periodoDias: 30,
      dataInicio: todayIso(),
      dataFim: calcularDataFim(todayIso(), 30),
      recomendacoes: "",
    });

    const handleSave = useCallback(() => {
      if (tipoLaudo === LaudoTipo.PCD) {
        onSave(tipoLaudo, laudoPCD);
      } else {
        onSave(tipoLaudo, laudoRestricao);
      }
      onClose();
    }, [laudoPCD, laudoRestricao, onClose, onSave, tipoLaudo]);

    return (
      <HeroModal isOpen={isOpen} onClose={onClose} size="2xl" backdrop="blur" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold">Emitir Laudo Médico</h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <RadioGroup
                label="Tipo de Laudo"
                value={tipoLaudo}
                onValueChange={(value) => setTipoLaudo(value as LaudoTipo)}
                orientation="horizontal"
              >
                <Radio value={LaudoTipo.RESTRICAO_TEMPORARIA}>Restrição Temporária</Radio>
                <Radio value={LaudoTipo.PCD}>Laudo PCD</Radio>
              </RadioGroup>

              <Divider />

              {tipoLaudo === LaudoTipo.RESTRICAO_TEMPORARIA ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="CID"
                      placeholder="Ex: M54.5"
                      value={laudoRestricao.cid}
                      onValueChange={(value) => setLaudoRestricao((prev) => ({ ...prev, cid: value }))}
                    />
                    <Input
                      label="Período (dias)"
                      type="number"
                      value={laudoRestricao.periodoDias.toString()}
                      onValueChange={(value) => {
                        const dias = parseInt(value) || 30;
                        setLaudoRestricao((prev) => ({
                          ...prev,
                          periodoDias: dias,
                          dataFim: calcularDataFim(prev.dataInicio, dias),
                        }));
                      }}
                    />
                  </div>

                  <Input
                    label="Descrição do CID"
                    placeholder="Descrição da condição médica"
                    value={laudoRestricao.descricaoCid}
                    onValueChange={(value) => setLaudoRestricao((prev) => ({ ...prev, descricaoCid: value }))}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Data Início"
                      type="date"
                      value={laudoRestricao.dataInicio}
                      onValueChange={(value) =>
                        setLaudoRestricao((prev) => ({
                          ...prev,
                          dataInicio: value,
                          dataFim: calcularDataFim(value, prev.periodoDias),
                        }))
                      }
                    />
                    <Input
                      label="Data Fim"
                      type="date"
                      value={laudoRestricao.dataFim}
                      onValueChange={(value) => setLaudoRestricao((prev) => ({ ...prev, dataFim: value }))}
                    />
                  </div>

                  <Textarea
                    label="Restrições Específicas"
                    placeholder="Descreva as restrições temporárias para o trabalho..."
                    value={laudoRestricao.restricoes}
                    onValueChange={(value) => setLaudoRestricao((prev) => ({ ...prev, restricoes: value }))}
                    rows={3}
                  />

                  <Textarea
                    label="Recomendações"
                    placeholder="Recomendações e orientações para o período..."
                    value={laudoRestricao.recomendacoes}
                    onValueChange={(value) => setLaudoRestricao((prev) => ({ ...prev, recomendacoes: value }))}
                    rows={2}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="CID"
                      placeholder="Ex: G80.9"
                      value={laudoPCD.cid}
                      onValueChange={(value) => setLaudoPCD((prev) => ({ ...prev, cid: value }))}
                    />
                  </div>

                  <Input
                    label="Descrição do CID"
                    placeholder="Descrição da condição de deficiência"
                    value={laudoPCD.descricaoCid}
                    onValueChange={(value) => setLaudoPCD((prev) => ({ ...prev, descricaoCid: value }))}
                  />

                  <Textarea
                    label="Limitações Funcionais"
                    placeholder="Descreva as limitações funcionais do paciente..."
                    value={laudoPCD.limitacoes}
                    onValueChange={(value) => setLaudoPCD((prev) => ({ ...prev, limitacoes: value }))}
                    rows={3}
                  />

                  <Textarea
                    label="Adaptações Necessárias"
                    placeholder="Descreva as adaptações necessárias no ambiente de trabalho..."
                    value={laudoPCD.adaptacoesNecessarias}
                    onValueChange={(value) => setLaudoPCD((prev) => ({ ...prev, adaptacoesNecessarias: value }))}
                    rows={3}
                  />

                  <Textarea
                    label="Observações Adicionais"
                    placeholder="Outras observações relevantes..."
                    value={laudoPCD.observacoes}
                    onValueChange={(value) => setLaudoPCD((prev) => ({ ...prev, observacoes: value }))}
                    rows={2}
                  />
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSave}>
              Emitir Laudo
            </Button>
          </ModalFooter>
        </ModalContent>
      </HeroModal>
    );
  };

  /* ---------------------- Render ---------------------- */

  // Early return - mantém compatibilidade com a UI existente
  if (!selectedRecord) {
    return (
      <aside className="w-96 bg-content1 border-l border-divider flex-shrink-0 flex flex-col">
        <Card className="m-4">
          <CardBody className="text-center p-6">
            <p className="text-default-500 text-sm">Selecione um prontuário para visualizar as opções.</p>
          </CardBody>
        </Card>
      </aside>
    );
  }

  // Determina se justificativa deve aparecer
  const showDetailsField = opinionRequiresDetails(opinion);

  return (
    <aside className="w-90 bg-content1 border-l border-divider flex-shrink-0 flex flex-col">
      <div className="flex flex-col flex-1">
        {/* Informações do Paciente */}
        <Card shadow="none" className="rounded-none border-b border-divider">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground truncate">{selectedRecord.NOME}</h3>
                <Chip size="sm" variant="flat" className="mt-1">
                  {selectedRecord.TIPOEXAMENOME}
                </Chip>
                <div className="space-y-1 mt-2">
                  <div className="flex flex-col justify-between">
                    <Input
                      className="text-xs text-default-600"
                      readOnly
                      value={selectedRecord.NOMECARGO}
                      size="sm"
                      label="Cargo"
                      variant="underlined"
                    />
                    <Input
                      className="text-xs text-default-600"
                      readOnly
                      value={`${selectedRecord.NOMESETOR} - ${selectedRecord.NOMEUNIDADE}`}
                      size="sm"
                      label="Setor/Unidade"
                      variant="underlined"
                    />
                    <Input
                      className="text-xs text-default-600"
                      readOnly
                      value={selectedRecord.NOMEEMPRESA}
                      size="sm"
                      label="Empresa"
                      variant="underlined"
                    />
                  </div>

                  {selectedRecord.RISCOSASO && (
                    <Alert title="Riscos" className="text-[0.7rem]" variant="flat" color="default" hideIcon={true}>
                      <ul className="list-disc pl-4">
                        {selectedRecord.RISCOSASO.map((risco, index) => (
                          <li key={index} className="capitalize">
                            {risco.risco}
                          </li>
                        ))}
                      </ul>
                    </Alert>
                  )}

                  {selectedRecord.OBSERVACOES && (
                    <Alert title="Observações cliente" className="text-[0.6rem]" variant="flat" color="danger">
                      {selectedRecord.OBSERVACOES}
                    </Alert>
                  )}
                  {selectedRecord.ANOTACOES && (
                    <Alert title="Anotações internas" className="text-[0.6rem]" variant="flat" color="primary">
                      {selectedRecord.ANOTACOES}
                    </Alert>
                  )}
                </div>
              </div>
            </div>

            {/* Lista de Exames */}
            {examesComSala.length > 0 && (
            <Accordion
              isCompact
              selectionMode="multiple"
              selectedKeys={examesAccordionOpen}
              onSelectionChange={(keys) =>
                setExamesAccordionOpen(Array.from(keys as Set<string>))
              }
            >
              <AccordionItem
                key="exames"
                aria-label="Exames Realizados"
                title={
                  <div className="flex items-center gap-2 mt-2">
                    <h5 className="font-semibold text-default-700">
                      {selectedRecord.EXAMES.length} Exames
                    </h5>
                  </div>
                }
              >
                <div className=" overflow-y-clip p-1">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-default-100 z-10">
                      <tr className="text-default-700">
                        <th className="p-2 font-semibold w-[50%]">Exame</th>
                        <th className="p-2 font-semibold">Data/Hora</th>
                        <th className="p-2 font-semibold text-center w-[60px]">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examesComSala.map((exame) => {
                        const isActive = isExamBeingDisplayed(exame.grupo);
                        const data = exame.dataExame
                          ? new Date(exame.dataExame).toLocaleDateString("pt-BR")
                          : "N/A";
                        const hora = exame.dataExame
                          ? new Date(exame.dataExame).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "";

                        return (
                          <tr
                            key={exame.codigoExame}
                            className={`transition-all border-b border-default-200 ${
                              isActive ? "bg-primary-50" : "hover:bg-default-50"
                            }`}
                          >
                            <td className="p-2 text-default-800">
                              <div className="flex flex-col">
                                <span className="font-medium truncate">{exame.grupo}</span>
                                {isActive && (
                                  <Chip
                                    size="sm"
                                    color="primary"
                                    variant="flat"
                                    className="mt-1 w-fit"
                                  >
                                    Visualizando
                                  </Chip>
                                )}
                              </div>
                            </td>
                            <td className="p-2 text-default-600 whitespace-nowrap">
                              {data} <br />
                              <span className="text-[0.7rem]">{hora}</span>
                            </td>
                            <td className="p-2 text-center">
                              {hasPdfForExame(exame.grupo) && (
                                <Button
                                  size="sm"
                                  variant={isActive ? "solid" : "ghost"}
                                  color="primary"
                                  onPress={() => selectPdfFromExame(exame.grupo)}
                                  title="Visualizar PDF"
                                  isIconOnly
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </AccordionItem>
            </Accordion>

            )}
          </CardBody>
        </Card>

        {/* Parecer Médico (apenas para médicos) */}
        {(user.perfil === USER_PROFILE.MEDICO || user.perfil === USER_PROFILE.MASTER) && selectedRecord.ATENDIMENTOSTATUS === AtendimentoStatus.AGUARDANDO_AVALIACAO_MEDICA && (
          <Card className="flex-1">
            <CardBody className="space-y-4">
              <div className="flex flex-col justify-between items-center">
                <Select
                  size="sm"
                  label="Tipo de Parecer"
                  placeholder="Selecione o parecer"
                  value={opinion?.opinionType || ""}
                  onChange={(e) => {
                    const value = e.target.value as ParecerMedico;
                    setOpinion((prev) => ({
                      ...(prev || {}),
                      opinionType: value,
                      // se o novo parecer for APTO limpamos details para evitar obrigatoriedade residual
                      details: value === ParecerMedico.APTO ? "" : prev?.details ?? "",
                    }));
                  }}
                  className="flex-1"
                >
                  <SelectItem key={ParecerMedico.APTO}>{ParecerMedico.APTO}</SelectItem>
                  <SelectItem key={ParecerMedico.APTO_COM_ORIENTACAO}>{ParecerMedico.APTO_COM_ORIENTACAO.replace(/_/g, " ")}</SelectItem>
                  <SelectItem key={ParecerMedico.SOLICITAR_REPETICAO}>{ParecerMedico.SOLICITAR_REPETICAO.replace(/_/g, " ")}</SelectItem>
                  <SelectItem key={ParecerMedico.INAPTO}>{ParecerMedico.INAPTO}</SelectItem>
                  <SelectItem key={ParecerMedico.INAPTO_TEMPORARIAMENTE}>
                    {ParecerMedico.INAPTO_TEMPORARIAMENTE.replace(/_/g, " ")}
                  </SelectItem>
                </Select>
              </div>

              {/* Parecer trabalho em altura - apenas exibe para riscos de altura */}
              {hasHeightRisk && (
                <div className="flex flex-col justify-between items-center">
                  <Select
                    size="sm"
                    label="Parecer trabalho em altura"
                    placeholder="Selecione o parecer"
                    value={opinion?.altura || ""}
                    onChange={(e) => {
                      const val = e.target.value as ParecerTrabalhoAltura;
                      setOpinion((prev) => ({
                        ...(prev || {}),
                        altura: val,
                        // se for apto em altura removemos detalhes (mas não limpamos se já houver justificativa para outro motivo)
                        details: val === (ParecerTrabalhoAltura as any).APTO_ALTURA ? prev?.details ?? "" : prev?.details ?? "",
                      }));
                    }}
                    className="flex-1"
                  >
                    <SelectItem key={ParecerTrabalhoAltura.APTO_ALTURA}>{ParecerTrabalhoAltura.APTO_ALTURA}</SelectItem>
                    <SelectItem key={ParecerTrabalhoAltura.INAPTO_ALTURA}>{ParecerTrabalhoAltura.INAPTO_ALTURA}</SelectItem>
                  </Select>
                </div>
              )}

              {/* Parecer espaço confinado - apenas exibe para riscos de confinado */}
              {hasConfinedRisk && (
                <div className="flex flex-col justify-between items-center">
                  <Select
                    size="sm"
                    label="Parecer espaço confinado"
                    placeholder="Selecione o parecer"
                    value={opinion?.confinado || ""}
                    onChange={(e) => {
                      const val = e.target.value as ParecerEspaçoConfinado;
                      setOpinion((prev) => ({
                        ...(prev || {}),
                        confinado: val,
                        details: val === (ParecerEspaçoConfinado as any).APTO_CONFINADO ? prev?.details ?? "" : prev?.details ?? "",
                      }));
                    }}
                    className="flex-1"
                  >
                    <SelectItem key={ParecerEspaçoConfinado.APTO_CONFINADO}>{ParecerEspaçoConfinado.APTO_CONFINADO}</SelectItem>
                    <SelectItem key={ParecerEspaçoConfinado.INAPTO_CONFINADO}>{ParecerEspaçoConfinado.INAPTO_CONFINADO}</SelectItem>
                  </Select>
                </div>
              )}

              {/* Indicadores de Laudos Emitidos */}
              {(opinion?.laudoPCD || opinion?.laudoRestricao) && (
                <Card className="bg-primary-50 border-primary-200">
                  <CardBody className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm text-primary">Laudos Emitidos:</span>
                    </div>
                    <div className="space-y-2">
                      {opinion.laudoPCD && (
                        <Chip color="primary" variant="flat" size="sm">
                          Laudo PCD - CID: {opinion.laudoPCD.cid}
                        </Chip>
                      )}
                      {opinion.laudoRestricao && (
                        <Chip color="warning" variant="flat" size="sm">
                          Restrição Temporária - CID: {opinion.laudoRestricao.cid}
                        </Chip>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Campo Justificativa / Detalhes - aparece automaticamente quando necessário */}
              {showDetailsField && (
                <>
                  <Textarea
                    label="Justificativa / Detalhes"
                    placeholder="Descreva a justificativa do parecer..."
                    value={opinion?.details ?? ""}
                    onValueChange={(value) => setOpinion((prev) => ({ ...(prev || {}), details: value }))}
                    rows={4}
                  />

                  {/* Se for INAPTO_TEMPORARIAMENTE, mantém campo 'Inapto até' atrelado a laudoRestricao.dataFim (cria laudoRestricao se não existir) */}
                  {opinion?.opinionType === ParecerMedico.INAPTO_TEMPORARIAMENTE && (
                    <div className="grid grid-cols-1 gap-2">
                      <Input
                        type="date"
                        label="Inapto até"
                        value={opinion?.laudoRestricao?.dataFim ?? todayIso()}
                        onValueChange={(value) => {
                          setOpinion((prev) => {
                            const newLaudo = prev?.laudoRestricao
                              ? { ...prev.laudoRestricao }
                              : {
                                  cid: "",
                                  descricaoCid: "",
                                  restricoes: "",
                                  periodoDias: 30,
                                  dataInicio: todayIso(),
                                  dataFim: calcularDataFim(todayIso(), 30),
                                  recomendacoes: "",
                                };
                            newLaudo.dataFim = value;
                            return { ...(prev || {}), laudoRestricao: newLaudo };
                          });
                        }}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="flex gap-2 pt-2">
                <Button color="primary" onPress={saveOpinion} isDisabled={isSavingOpinion || !opinion?.opinionType} isLoading={isSavingOpinion} className="flex-1">
                  {isSavingOpinion ? "Salvando..." : "Salvar Parecer"}
                </Button>
                <Button variant="bordered" onPress={() => setOpinion({ opinionType: null, altura: null, confinado: null, details: null, laudoPCD: null, laudoRestricao: null })} isDisabled={isSavingOpinion}>
                  Limpar
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Modal Emitir Laudo */}
      <LaudosModal isOpen={laudoModalOpen} onClose={() => setLaudoModalOpen(false)} onSave={(t, d) => {
        // integra com estado opinion sem sobrescrever opinião principal
        setOpinion((prev) => ({
          ...(prev || {}),
          opinionType: prev?.opinionType || (t === LaudoTipo.PCD ? ParecerMedico.APTO_COM_ORIENTACAO : ParecerMedico.INAPTO_TEMPORARIAMENTE),
          laudoPCD: t === LaudoTipo.PCD ? d : prev?.laudoPCD ?? null,
          laudoRestricao: t !== LaudoTipo.PCD ? d : prev?.laudoRestricao ?? null,
        }));
        // toasts (já existiam)
        addToast({
          title: t === LaudoTipo.PCD ? "Laudo PCD emitido" : "Laudo de Restrição emitido",
          description: t === LaudoTipo.PCD ? "Laudo PCD adicionado ao parecer médico" : "Laudo de restrição temporária adicionado ao parecer",
          color: "success",
        });
      }} />
    </aside>
  );
};

export default PainelDireita;
