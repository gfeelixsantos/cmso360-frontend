// PainelDireita.tsx
"use client";
import React, { useCallback, useEffect, useMemo, useState, memo } from "react";
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
  Checkbox,
  CheckboxGroup,
} from "@heroui/react";
import {
  ClipboardList,
  Eye,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  FileText,
  Radiation,
  TriangleAlert,
} from "lucide-react";

import { MedicalRecord } from "../page";

import { IUserInfo } from "@/lib/user/interfaces/IUser";
import {
  AtendimentoStatus,
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
import { RiscosAso } from "@/lib/scheduling/interface/scheduling";

/* ---------------------- Tipos ---------------------- */

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
  examesParaRepetir?: string[];
};

interface RightPanelProps {
  selectedRecord: MedicalRecord | null;
  setSelectedRecord: React.Dispatch<React.SetStateAction<MedicalRecord | null>>;
  currentPdfIndex: number;
  onPdfIndexChange: (index: number) => void;
  user: IUserInfo;
  onRecordUpdate: (record: MedicalRecord) => void;
}

/* ---------------------- Componentes Auxiliares Memoizados ---------------------- */

const ExameCard = memo(
  ({
    exame,
    isActive,
    hasPdf,
    onView,
  }: {
    exame: any;
    isActive: boolean;
    hasPdf: boolean;
    onView: () => void;
  }) => {
    const data = exame?.dataExame
      ? new Date(exame.dataExame).toLocaleDateString("pt-BR")
      : "N/A";
    const hora = exame?.dataExame
      ? new Date(exame.dataExame).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <tr
        className={`transition-all border-b border-default-200 ${
          isActive ? "bg-primary-50" : "hover:bg-default-50"
        }`}
      >
        <td className="p-2 text-default-800">
          <div className="flex flex-col">
            <span className="font-medium truncate text-xs sm:text-sm">
              {exame.grupo}
            </span>
            {isActive && (
              <Chip
                className="mt-1 w-fit"
                color="primary"
                size="sm"
                variant="flat"
              >
                Visualizando
              </Chip>
            )}
          </div>
        </td>
        <td className="p-2 text-default-600 whitespace-nowrap text-xs">
          {data} <br />
          <span className="text-[0.65rem]">{hora}</span>
        </td>
        <td className="p-2 text-center">
          {hasPdf && (
            <Button
              isIconOnly
              color="primary"
              size="sm"
              title="Visualizar PDF"
              variant={isActive ? "solid" : "ghost"}
              onPress={onView}
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
        </td>
      </tr>
    );
  },
);

ExameCard.displayName = "ExameCard";

/* ---------------------- Modal de Seleção de Exames ---------------------- */

const ExamesRepeticaoModal = memo(
  ({
    isOpen,
    onClose,
    onSave,
    examesDisponiveis,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (exames: string[]) => void;
    examesDisponiveis: string[];
  }) => {
    const [selectedExames, setSelectedExames] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const examesFiltrados = useMemo(() => {
      if (!searchTerm) return examesDisponiveis || [];

      return (examesDisponiveis || []).filter((e) =>
        e.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }, [examesDisponiveis, searchTerm]);

    const handleSave = useCallback(() => {
      if (selectedExames.length === 0) {
        addToast({
          title: "Seleção obrigatória",
          description: "Selecione ao menos um exame para repetição.",
          color: "warning",
          variant: "solid",
        });

        return;
      }
      onSave(selectedExames);
      onClose();
    }, [selectedExames, onSave, onClose]);

    const handleClose = useCallback(() => {
      setSelectedExames([]);
      setSearchTerm("");
      onClose();
    }, [onClose]);

    return (
      <HeroModal
        backdrop="blur"
        classNames={{
          base: "max-h-[90vh]",
          body: "py-6",
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={handleClose}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
              <h3 className="text-base sm:text-lg md:text-xl font-bold">
                Selecionar Exames para Repetição
              </h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Alert
                className="text-xs sm:text-sm"
                color="primary"
                variant="flat"
              >
                Selecione ao menos um exame que deverá ser repetido pelo
                paciente.
              </Alert>

              <Input
                isClearable
                className="w-full"
                placeholder="Buscar exames..."
                size="sm"
                value={searchTerm}
                onClear={() => setSearchTerm("")}
                onValueChange={setSearchTerm}
              />

              <Card className="border border-default-200">
                <CardBody className="p-3 max-h-[400px] overflow-y-auto">
                  <CheckboxGroup
                    classNames={{
                      base: "w-full",
                    }}
                    value={selectedExames}
                    onValueChange={setSelectedExames}
                  >
                    {examesFiltrados.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {examesFiltrados.map((exame) => (
                          <Checkbox
                            key={exame}
                            classNames={{
                              label: "text-xs sm:text-sm",
                            }}
                            value={exame}
                          >
                            {exame}
                          </Checkbox>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-default-400 text-sm py-4">
                        Nenhum exame encontrado
                      </p>
                    )}
                  </CheckboxGroup>
                </CardBody>
              </Card>

              {selectedExames.length > 0 && (
                <Card className="bg-primary-50 border-primary-200">
                  <CardBody className="p-3">
                    <p className="text-xs font-semibold text-primary mb-2">
                      {selectedExames.length} exame(s) selecionado(s):
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedExames.map((exame) => (
                        <Chip
                          key={exame}
                          color="primary"
                          size="sm"
                          variant="flat"
                          onClose={() =>
                            setSelectedExames((prev) =>
                              prev.filter((e) => e !== exame),
                            )
                          }
                        >
                          {exame}
                        </Chip>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="light" onPress={handleClose}>
              Cancelar
            </Button>
            <Button
              color="warning"
              isDisabled={selectedExames.length === 0}
              size="sm"
              onPress={handleSave}
            >
              Confirmar Seleção
            </Button>
          </ModalFooter>
        </ModalContent>
      </HeroModal>
    );
  },
);

ExamesRepeticaoModal.displayName = "ExamesRepeticaoModal";

/* ---------------------- Modal de Confirmação ---------------------- */

const ConfirmacaoParecerModal = memo(
  ({
    isOpen,
    onClose,
    onConfirm,
    opinion,
    isLoading,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    opinion: MedicalOpinionData;
    isLoading: boolean;
  }) => {
    return (
      <HeroModal
        backdrop="blur"
        hideCloseButton={isLoading}
        isDismissable={!isLoading}
        isOpen={isOpen}
        size="md"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
              <h3 className="text-base sm:text-lg md:text-xl font-bold">
                Confirmar Parecer Médico
              </h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Card className="border border-default-200">
                <CardBody className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-default-500">
                      Parecer Principal:
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {opinion.opinionType?.replace(/_/g, " ")}
                    </p>
                  </div>

                  {opinion.altura && (
                    <div>
                      <p className="text-xs text-default-500">
                        Trabalho em Altura:
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {opinion.altura}
                      </p>
                    </div>
                  )}

                  {opinion.confinado && (
                    <div>
                      <p className="text-xs text-default-500">
                        Espaço Confinado:
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {opinion.confinado}
                      </p>
                    </div>
                  )}

                  {opinion.examesParaRepetir &&
                    opinion.examesParaRepetir.length > 0 && (
                      <div>
                        <p className="text-xs text-default-500 mb-2">
                          Exames para Repetição (
                          {opinion.examesParaRepetir.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {opinion.examesParaRepetir.map((exame) => (
                            <Chip
                              key={exame}
                              color="warning"
                              size="sm"
                              variant="flat"
                            >
                              {exame}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                  {(opinion.laudoPCD || opinion.laudoRestricao) && (
                    <div>
                      <p className="text-xs text-default-500 mb-2">
                        Laudos Emitidos:
                      </p>
                      <div className="space-y-1">
                        {opinion.laudoPCD && (
                          <Chip color="primary" size="sm" variant="flat">
                            Laudo PCD - CID: {opinion.laudoPCD.cid}
                          </Chip>
                        )}
                        {opinion.laudoRestricao && (
                          <Chip color="warning" size="sm" variant="flat">
                            Restrição Temporária - CID:{" "}
                            {opinion.laudoRestricao.cid}
                          </Chip>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={isLoading}
              size="sm"
              variant="light"
              onPress={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="text-white font-bold"
              color="success"
              isLoading={isLoading}
              size="sm"
              startContent={!isLoading && <CheckCircle2 className="w-4 h-4" />}
              onPress={onConfirm}
            >
              {isLoading ? "Salvando..." : "Confirmar e Finalizar"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </HeroModal>
    );
  },
);

ConfirmacaoParecerModal.displayName = "ConfirmacaoParecerModal";

/* ---------------------- Modal de Laudos ---------------------- */

const LaudosModal = memo(
  ({
    isOpen,
    onClose,
    onSave,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tipo: LaudoTipo, data: any) => void;
  }) => {
    const todayIso = useCallback(
      () => new Date().toISOString().split("T")[0],
      [],
    );
    const calcularDataFim = useCallback((inicio: string, dias: number) => {
      const data = new Date(inicio);

      data.setDate(data.getDate() + dias);

      return data.toISOString().split("T")[0];
    }, []);

    const [tipoLaudo, setTipoLaudo] = useState<LaudoTipo>(
      LaudoTipo.RESTRICAO_TEMPORARIA,
    );
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
      <HeroModal
        backdrop="blur"
        classNames={{
          base: "max-h-[90vh]",
        }}
        isOpen={isOpen}
        scrollBehavior="inside"
        size="2xl"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <h3 className="text-base sm:text-lg md:text-xl font-bold">
                Emitir Laudo Médico
              </h3>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4 sm:space-y-6">
              <RadioGroup
                classNames={{
                  label: "text-xs sm:text-sm",
                }}
                label="Tipo de Laudo"
                orientation="horizontal"
                value={tipoLaudo}
                onValueChange={(value) => setTipoLaudo(value as LaudoTipo)}
              >
                <Radio value={LaudoTipo.RESTRICAO_TEMPORARIA}>
                  Restrição Temporária
                </Radio>
                <Radio value={LaudoTipo.PCD}>Laudo PCD</Radio>
              </RadioGroup>

              <Divider />

              {tipoLaudo === LaudoTipo.RESTRICAO_TEMPORARIA ? (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      label="CID"
                      placeholder="Ex: M54.5"
                      size="sm"
                      value={laudoRestricao.cid}
                      onValueChange={(value) =>
                        setLaudoRestricao((prev) => ({ ...prev, cid: value }))
                      }
                    />
                    <Input
                      label="Período (dias)"
                      size="sm"
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
                    size="sm"
                    value={laudoRestricao.descricaoCid}
                    onValueChange={(value) =>
                      setLaudoRestricao((prev) => ({
                        ...prev,
                        descricaoCid: value,
                      }))
                    }
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      label="Data Início"
                      size="sm"
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
                      size="sm"
                      type="date"
                      value={laudoRestricao.dataFim}
                      onValueChange={(value) =>
                        setLaudoRestricao((prev) => ({
                          ...prev,
                          dataFim: value,
                        }))
                      }
                    />
                  </div>

                  <Textarea
                    label="Restrições Específicas"
                    placeholder="Descreva as restrições temporárias para o trabalho..."
                    rows={3}
                    size="sm"
                    value={laudoRestricao.restricoes}
                    onValueChange={(value) =>
                      setLaudoRestricao((prev) => ({
                        ...prev,
                        restricoes: value,
                      }))
                    }
                  />

                  <Textarea
                    label="Recomendações"
                    placeholder="Recomendações e orientações para o período..."
                    rows={2}
                    size="sm"
                    value={laudoRestricao.recomendacoes}
                    onValueChange={(value) =>
                      setLaudoRestricao((prev) => ({
                        ...prev,
                        recomendacoes: value,
                      }))
                    }
                  />
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <Input
                    className="sm:w-1/2"
                    label="CID"
                    placeholder="Ex: G80.9"
                    size="sm"
                    value={laudoPCD.cid}
                    onValueChange={(value) =>
                      setLaudoPCD((prev) => ({ ...prev, cid: value }))
                    }
                  />

                  <Input
                    label="Descrição do CID"
                    placeholder="Descrição da condição de deficiência"
                    size="sm"
                    value={laudoPCD.descricaoCid}
                    onValueChange={(value) =>
                      setLaudoPCD((prev) => ({ ...prev, descricaoCid: value }))
                    }
                  />

                  <Textarea
                    label="Limitações Funcionais"
                    placeholder="Descreva as limitações funcionais do paciente..."
                    rows={3}
                    size="sm"
                    value={laudoPCD.limitacoes}
                    onValueChange={(value) =>
                      setLaudoPCD((prev) => ({ ...prev, limitacoes: value }))
                    }
                  />

                  <Textarea
                    label="Adaptações Necessárias"
                    placeholder="Descreva as adaptações necessárias no ambiente de trabalho..."
                    rows={3}
                    size="sm"
                    value={laudoPCD.adaptacoesNecessarias}
                    onValueChange={(value) =>
                      setLaudoPCD((prev) => ({
                        ...prev,
                        adaptacoesNecessarias: value,
                      }))
                    }
                  />

                  <Textarea
                    label="Observações Adicionais"
                    placeholder="Outras observações relevantes..."
                    rows={2}
                    size="sm"
                    value={laudoPCD.observacoes}
                    onValueChange={(value) =>
                      setLaudoPCD((prev) => ({ ...prev, observacoes: value }))
                    }
                  />
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" size="sm" onPress={handleSave}>
              Emitir Laudo
            </Button>
          </ModalFooter>
        </ModalContent>
      </HeroModal>
    );
  },
);

LaudosModal.displayName = "LaudosModal";

/* ---------------------- Componente Principal ---------------------- */

const PainelDireita: React.FC<RightPanelProps> = ({
  selectedRecord,
  setSelectedRecord,
  currentPdfIndex,
  onPdfIndexChange,
  user,
  onRecordUpdate,
}) => {
  /* ---------------------- Estados ---------------------- */

  const initialOpinion: MedicalOpinionData = {
    opinionType: null,
    details: "",
    laudoPCD: null,
    laudoRestricao: null,
    altura: null,
    confinado: null,
    examesParaRepetir: [],
  };

  const [opinion, setOpinion] = useState<MedicalOpinionData>(initialOpinion);

  const [isSavingOpinion, setIsSavingOpinion] = useState(false);
  const [laudoModalOpen, setLaudoModalOpen] = useState(false);
  const [examesAccordionOpen, setExamesAccordionOpen] = useState<string[]>([]);
  const [examesRepeticaoModalOpen, setExamesRepeticaoModalOpen] =
    useState(false);
  const [confirmacaoModalOpen, setConfirmacaoModalOpen] = useState(false);

  /* ---------------------- Helpers ---------------------- */
  const todayIso = useCallback(
    () => new Date().toISOString().split("T")[0],
    [],
  );
  const calcularDataFim = useCallback((inicio: string, dias: number) => {
    const data = new Date(inicio);

    data.setDate(data.getDate() + dias);

    return data.toISOString().split("T")[0];
  }, []);

  /* ---------------------- Dados Derivados ---------------------- */

  // exames com sala — depende explicitamente de EXAMES (defensivo)
  const examesComSala = useMemo(() => {
    return selectedRecord?.EXAMES ?? [];
  }, [selectedRecord?.EXAMES]);

  // exames disponíveis para repetição — depende explicitamente de EXAMES
  const examesDisponiveisParaRepeticao = useMemo(() => {
    const grupos = new Set<string>();

    (selectedRecord?.EXAMES ?? []).forEach((exame: any) => {
      if (exame?.grupo) grupos.add(exame.grupo);
    });

    return Array.from(grupos).sort();
  }, [selectedRecord?.EXAMES]);

  // normaliza a propriedade RISCOSASO como array seguro
  const riscos = useMemo(() => {
    const raw = selectedRecord?.RISCOSASO;

    if (Array.isArray(raw)) return raw;
    // se for string JSON, tentar parse (caso venha serializado)
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // ignore parse error — retorna array vazio
      }
    }

    return [];
  }, [selectedRecord?.RISCOSASO]);

  const hasHeightRisk = useMemo(
    () => riscos.some((r: any) => CODIGOS_RISCO_ALTURA.has(r?.codigo)),
    [riscos],
  );

  const hasConfinedRisk = useMemo(
    () => riscos.some((r: any) => CODIGOS_ESPACO_CONFINADO.has(r?.codigo)),
    [riscos],
  );

  const agruparRiscos = (riscos: RiscosAso[]) => {
    // ordenar alfabeticamente por risco
    const riscosOrdenados = [...riscos].sort((a, b) =>
      a.risco.localeCompare(b.risco),
    );

    // agrupar por grupo
    return riscosOrdenados.reduce(
      (acc, risco) => {
        if (!acc[risco.grupo]) acc[risco.grupo] = [];
        acc[risco.grupo].push(risco);

        return acc;
      },
      {} as Record<string, RiscosAso[]>,
    );
  };

  const hasPdfForExame = useCallback(
    (exameGrupo: string) =>
      !!(selectedRecord?.pdfUrls ?? []).some(
        (p: any) => p.grupo === exameGrupo && p.type === "exame",
      ),
    [selectedRecord?.pdfUrls],
  );

  /* ---------------------- Lifecycle ---------------------- */

  // Ao trocar de prontuário, resetamos o opinion para garantir que não haja estado stale entre prontuários
  useEffect(() => {
    if (!selectedRecord) {
      setOpinion(initialOpinion);

      return;
    }
    setOpinion(initialOpinion);
  }, [selectedRecord]);

  /* ---------------------- Handlers ---------------------- */
  const selectPdfFromExame = useCallback(
    (exameGrupo: string) => {
      if (!selectedRecord) return;

      const pdfIndex = (selectedRecord.pdfUrls ?? []).findIndex(
        (pdf: any) => pdf.grupo === exameGrupo && pdf.type === "exame",
      );

      if (pdfIndex !== -1) {
        document.getElementById("pdf-viewer")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
        onPdfIndexChange(pdfIndex);
      }
    },
    [onPdfIndexChange, selectedRecord?.pdfUrls],
  );

  const isExamBeingDisplayed = useCallback(
    (exameGrupo: string) => {
      const currentPdf = (selectedRecord?.pdfUrls ?? [])[currentPdfIndex];

      if (!currentPdf?.grupo) return false;

      return currentPdf.grupo === exameGrupo;
    },
    [currentPdfIndex, selectedRecord?.pdfUrls],
  );

  const opinionRequiresDetails = useCallback(
    (op: MedicalOpinionData | null) => {
      if (!op) return false;
      const mainRequires =
        !!op.opinionType &&
        [
          ParecerMedico.APTO_COM_ORIENTACAO,
          ParecerMedico.SOLICITAR_REPETICAO,
          ParecerMedico.INAPTO,
          ParecerMedico.INAPTO_TEMPORARIAMENTE,
        ].includes(op.opinionType);
      const alturaInapto =
        op.altura === (ParecerTrabalhoAltura as any).INAPTO_ALTURA;
      const confinadoInapto =
        op.confinado === (ParecerEspaçoConfinado as any).INAPTO_CONFINADO;

      return Boolean(mainRequires || alturaInapto || confinadoInapto);
    },
    [],
  );

  const opinionRequiresExames = useCallback((op: MedicalOpinionData | null) => {
    return op?.opinionType === ParecerMedico.SOLICITAR_REPETICAO;
  }, []);

  const handleOpenConfirmacao = useCallback(() => {
    if (!opinion || !opinion.opinionType) {
      addToast({
        variant: "solid",
        title: "Parecer incompleto",
        description: "Selecione um parecer médico antes de salvar.",
        color: "danger",
      });

      return;
    }

    if (
      opinionRequiresDetails(opinion) &&
      (!opinion.details || opinion.details.trim() === "")
    ) {
      addToast({
        variant: "solid",
        title: "Justificativa necessária",
        description:
          "Este parecer exige justificativa. Preencha o campo 'Detalhes' antes de salvar.",
        color: "danger",
      });

      return;
    }

    if (
      opinionRequiresExames(opinion) &&
      (!opinion.examesParaRepetir || opinion.examesParaRepetir.length === 0)
    ) {
      addToast({
        variant: "solid",
        title: "Exames não selecionados",
        description: "Para solicitar repetição, selecione ao menos um exame.",
        color: "danger",
      });

      return;
    }

    setConfirmacaoModalOpen(true);
  }, [opinion, opinionRequiresDetails, opinionRequiresExames]);

  const saveOpinion = useCallback(async () => {
    if (!opinion || !opinion.opinionType || !selectedRecord) return;

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

      if (!response.ok) {
        const err = await response.text()
        throw new Error(`Erro ao salvar parecer ${err}`);
      }

      // NÃO mutamos selectedRecord diretamente. Se for necessário atualizar, faça de forma imutável
      const updatedRecord = {
        ...selectedRecord,
        // se houve alterações retornadas do backend, aplique aqui (ex: status atualizado)
      };

      onRecordUpdate(updatedRecord);
      setOpinion(initialOpinion);
      setSelectedRecord(null);
      setConfirmacaoModalOpen(false);

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
        description:
          "Verifique detalhes no console, se o erro persistir contate o suporte.",
        color: "danger",
      });
    } finally {
      setIsSavingOpinion(false);
    }
  }, [opinion, onRecordUpdate, selectedRecord, user, setSelectedRecord]);

  const handleSaveExamesRepeticao = useCallback((exames: string[]) => {
    setOpinion((prev) => ({
      ...prev,
      examesParaRepetir: exames,
    }));
    addToast({
      title: "Exames selecionados",
      description: `${exames.length} exame(s) marcado(s) para repetição.`,
      color: "success",
    });
  }, []);

  const handleLimparParecer = useCallback(() => {
    setOpinion(initialOpinion);
  }, []);

  const riscoCor = useCallback((risco: any) => {
    // risco.grupo pode ser string ou number — mantemos defensivo
    const grupo = String(risco);

    switch (grupo) {
      case "1": // Físico
        return "text-green-500";
      case "2": // Químico
        return "text-red-500";
      case "4": // Ergonômicos
        return "text-amber-500";
      case "5": // Acidentes
        return "text-blue-700";
      case "6": // Inespecífico
        return "text-purple-700";
      default:
        return "";
    }
  }, []);

  /* ---------------------- Render ---------------------- */

  if (!selectedRecord) {
    return (
      <aside className="w-full sm:w-82 bg-content1 border-l border-divider flex-shrink-0 flex flex-col">
        <Card className="m-4">
          <CardBody className="text-center p-6">
            <p className="text-default-500 text-xs sm:text-sm">
              Selecione um prontuário para visualizar as opções.
            </p>
          </CardBody>
        </Card>
      </aside>
    );
  }

  const showDetailsField = opinionRequiresDetails(opinion);
  const showExamesSelector = opinionRequiresExames(opinion);
  const isMedicoOrMaster =
    user.perfil === USER_PROFILE.MEDICO || user.perfil === USER_PROFILE.MASTER;
  const isAwaitingMedical =
    selectedRecord.ATENDIMENTOSTATUS ===
    AtendimentoStatus.AGUARDANDO_AVALIACAO_MEDICA;

  return (
    <aside className="w-full sm:w-82 lg:w-[26rem] bg-content1 flex-shrink-0 flex flex-col overflow-y-auto">
      <div className="flex flex-col flex-1">
        {/* Informações do Paciente */}
        <div className="rounded-none">
          <div className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {selectedRecord.NOME}
                </h3>
                <Chip className="mt-1" size="md" variant="flat">
                  {selectedRecord.TIPOEXAMENOME}
                </Chip>
                <div className="space-y-1 mt-2 text">
                  <div className="flex flex-col justify-between">
                    <Input
                      readOnly
                      className="text-xs text-default-600"
                      label="Cargo"
                      size="sm"
                      value={selectedRecord.NOMECARGO}
                      variant="underlined"
                    />
                    <Input
                      readOnly
                      className="text-xs text-default-600"
                      label="Setor/Unidade"
                      size="sm"
                      value={`${selectedRecord.NOMESETOR} - ${selectedRecord.NOMEUNIDADE}`}
                      variant="underlined"
                    />
                    <Input
                      readOnly
                      className="text-xs text-default-600"
                      label="Empresa"
                      size="sm"
                      value={selectedRecord.NOMEEMPRESA}
                      variant="underlined"
                    />
                  </div>

                  {riscos.length > 0 && (
                    <article className="mt-6" title="Riscos">
                      <div className="flex items-center gap-2 pb-2">
                        <h4 className="font-bold text-sm sm:text-base">
                          Riscos
                        </h4>
                      </div>

                      {Object.entries(agruparRiscos(riscos)).map(
                        ([grupo, lista]) => (
                          <ul className="list-none pl-4 text-[0.65rem] sm:text-[0.7rem]">
                            {lista.map((risco, index) => (
                              <li
                                key={index}
                                className={`capitalize ${riscoCor(risco.grupo)}`}
                              >
                                {risco.risco}
                              </li>
                            ))}
                          </ul>
                        ),
                      )}
                    </article>
                  )}

                  {selectedRecord.OBSERVACOES && (
                    <Alert
                      className="text-[0.6rem] sm:text-[0.65rem]"
                      color="danger"
                      title="Observações cliente"
                      variant="flat"
                    >
                      {selectedRecord.OBSERVACOES}
                    </Alert>
                  )}
                  {selectedRecord.ANOTACOES && (
                    <Alert
                      className="text-[0.6rem] sm:text-[0.65rem]"
                      color="primary"
                      title="Anotações internas"
                      variant="flat"
                    >
                      {selectedRecord.ANOTACOES}
                    </Alert>
                  )}
                </div>
              </div>
            </div>
            <Divider className="mt-4" />

            {/* Lista de Exames */}
            {examesComSala.length > 0 && (
              <Accordion
                isCompact
                className="mt-2"
                selectedKeys={examesAccordionOpen}
                selectionMode="multiple"
                onSelectionChange={(keys) =>
                  setExamesAccordionOpen(Array.from(keys as Set<string>))
                }
              >
                <AccordionItem
                  key="exames"
                  aria-label="Exames Realizados"
                  title={
                    <div className="flex items-center gap-2 pb-2 hover:cursor-pointer">
                      <h4 className="font-bold text-sm sm:text-base">
                        Exames realizados:{" "}
                        {(selectedRecord.EXAMES ?? []).length}
                      </h4>
                    </div>
                  }
                >
                  <div className="overflow-x-auto p-1">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="sticky top-0 bg-default-100 z-10">
                        <tr className="text-default-700">
                          <th className="p-2 font-semibold w-[50%]">Exame</th>
                          <th className="p-2 font-semibold">Data/Hora</th>
                          <th className="p-2 font-semibold text-center w-[60px]">
                            Ver
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {examesComSala.map((exame: any) => (
                          <ExameCard
                            key={exame.codigoExame}
                            exame={exame}
                            hasPdf={hasPdfForExame(exame.grupo)}
                            isActive={isExamBeingDisplayed(exame.grupo)}
                            onView={() => selectPdfFromExame(exame.grupo)}
                          />
                        ))}
                      </tbody>
                      <footer>
                        <tr className="text-right">
                          <td>{selectedRecord.TICKET?.emissao.toLocaleString("pt-BR")}</td>
                        </tr>
                      </footer>
                    </table>
                  </div>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </div>

        {/* Parecer Médico */}
        {isMedicoOrMaster && isAwaitingMedical && (
          <div className="flex-1 m-3 sm:m-4">
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4">
              <div className="flex items-center gap-2 pb-2">
                <h4 className="font-bold text-sm sm:text-base">
                  Parecer Médico
                </h4>
              </div>

              <Select
                classNames={{
                  label: "text-xs sm:text-sm",
                  value: "text-xs sm:text-sm",
                }}
                label="Tipo de Parecer"
                placeholder="Selecione o parecer"
                selectedKeys={opinion?.opinionType ? [opinion.opinionType] : []}
                size="sm"
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as ParecerMedico;

                  setOpinion((prev) => ({
                    ...(prev || {}),
                    opinionType: value,
                    details:
                      value === ParecerMedico.APTO ? "" : (prev?.details ?? ""),
                    examesParaRepetir:
                      value === ParecerMedico.SOLICITAR_REPETICAO
                        ? prev?.examesParaRepetir
                        : [],
                  }));
                }}
              >
                <SelectItem key={ParecerMedico.APTO}>
                  {ParecerMedico.APTO}
                </SelectItem>
                <SelectItem key={ParecerMedico.APTO_COM_ORIENTACAO}>
                  {ParecerMedico.APTO_COM_ORIENTACAO.replace(/_/g, " ")}
                </SelectItem>
                {/* <SelectItem key={ParecerMedico.SOLICITAR_REPETICAO}>
                  {ParecerMedico.SOLICITAR_REPETICAO.replace(/_/g, " ")}
                </SelectItem> */}
                <SelectItem key={ParecerMedico.INAPTO}>
                  {ParecerMedico.INAPTO}
                </SelectItem>
                <SelectItem key={ParecerMedico.INAPTO_TEMPORARIAMENTE}>
                  {ParecerMedico.INAPTO_TEMPORARIAMENTE.replace(/_/g, " ")}
                </SelectItem>
              </Select>

              {/* Seletor de Exames para Repetição */}
              {showExamesSelector && (
                <div className="space-y-2">
                  <Button
                    fullWidth
                    color="warning"
                    size="sm"
                    startContent={<FileText className="w-4 h-4" />}
                    variant="flat"
                    onPress={() => setExamesRepeticaoModalOpen(true)}
                  >
                    Selecionar exames para repetir
                    {opinion.examesParaRepetir &&
                      opinion.examesParaRepetir.length > 0 && (
                        <Chip
                          className="ml-2"
                          color="warning"
                          size="sm"
                          variant="solid"
                        >
                          {opinion.examesParaRepetir.length}
                        </Chip>
                      )}
                  </Button>

                  {opinion.examesParaRepetir &&
                    opinion.examesParaRepetir.length > 0 && (
                      <Card className="bg-warning-50 border-warning-200">
                        <CardBody className="p-3">
                          <p className="text-xs font-semibold text-warning-700 mb-2">
                            Exames selecionados para repetição:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {opinion.examesParaRepetir.map((exame) => (
                              <Chip
                                key={exame}
                                color="warning"
                                size="sm"
                                variant="flat"
                                onClose={() =>
                                  setOpinion((prev) => ({
                                    ...prev,
                                    examesParaRepetir:
                                      prev.examesParaRepetir?.filter(
                                        (e) => e !== exame,
                                      ) || [],
                                  }))
                                }
                              >
                                {exame}
                              </Chip>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    )}
                </div>
              )}

              {/* Pareceres Complementares */}
              {(hasHeightRisk || hasConfinedRisk) && (
                <div className="space-y-3">
                  <Divider />
                  <p className="text-xs font-semibold text-default-600">
                    Pareceres Complementares
                  </p>

                  {hasHeightRisk && (
                    <Select
                      classNames={{
                        label: "text-xs",
                        value: "text-xs",
                      }}
                      label="Trabalho em Altura"
                      placeholder="Selecione o parecer"
                      selectedKeys={opinion?.altura ? [opinion.altura] : []}
                      size="sm"
                      onSelectionChange={(keys) => {
                        const val = Array.from(
                          keys,
                        )[0] as ParecerTrabalhoAltura;

                        setOpinion((prev) => ({
                          ...(prev || {}),
                          altura: val,
                          details: prev?.details ?? "",
                        }));
                      }}
                    >
                      <SelectItem key={ParecerTrabalhoAltura.APTO_ALTURA}>
                        {ParecerTrabalhoAltura.APTO_ALTURA}
                      </SelectItem>
                      <SelectItem key={ParecerTrabalhoAltura.INAPTO_ALTURA}>
                        {ParecerTrabalhoAltura.INAPTO_ALTURA}
                      </SelectItem>
                    </Select>
                  )}

                  {hasConfinedRisk && (
                    <Select
                      classNames={{
                        label: "text-xs",
                        value: "text-xs",
                      }}
                      label="Espaço Confinado"
                      placeholder="Selecione o parecer"
                      selectedKeys={
                        opinion?.confinado ? [opinion.confinado] : []
                      }
                      size="sm"
                      onSelectionChange={(keys) => {
                        const val = Array.from(
                          keys,
                        )[0] as ParecerEspaçoConfinado;

                        setOpinion((prev) => ({
                          ...(prev || {}),
                          confinado: val,
                          details: prev?.details ?? "",
                        }));
                      }}
                    >
                      <SelectItem key={ParecerEspaçoConfinado.APTO_CONFINADO}>
                        {ParecerEspaçoConfinado.APTO_CONFINADO}
                      </SelectItem>
                      <SelectItem key={ParecerEspaçoConfinado.INAPTO_CONFINADO}>
                        {ParecerEspaçoConfinado.INAPTO_CONFINADO}
                      </SelectItem>
                    </Select>
                  )}
                </div>
              )}

              {/* Indicadores de Laudos */}
              {(opinion?.laudoPCD || opinion?.laudoRestricao) && (
                <>
                  <Divider />
                  <Card className="bg-primary-50 border-primary-200">
                    <CardBody className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-xs sm:text-sm text-primary">
                          Laudos Emitidos:
                        </span>
                      </div>
                      <div className="space-y-2">
                        {opinion.laudoPCD && (
                          <Chip color="primary" size="sm" variant="flat">
                            Laudo PCD - CID: {opinion.laudoPCD.cid}
                          </Chip>
                        )}
                        {opinion.laudoRestricao && (
                          <Chip color="warning" size="sm" variant="flat">
                            Restrição Temporária - CID:{" "}
                            {opinion.laudoRestricao.cid}
                          </Chip>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                </>
              )}

              {/* Campo Justificativa */}
              {showDetailsField && (
                <>
                  <Divider />
                  <Textarea
                    classNames={{
                      label: "text-xs sm:text-sm",
                      input: "text-xs sm:text-sm",
                    }}
                    label="Justificativa / Detalhes"
                    placeholder="Descreva a justificativa do parecer..."
                    rows={4}
                    size="sm"
                    value={opinion?.details ?? ""}
                    onValueChange={(value) =>
                      setOpinion((prev) => ({
                        ...(prev || {}),
                        details: value,
                      }))
                    }
                  />

                  {opinion?.opinionType ===
                    ParecerMedico.INAPTO_TEMPORARIAMENTE && (
                    <Input
                      classNames={{
                        label: "text-xs sm:text-sm",
                      }}
                      label="Inapto até"
                      size="sm"
                      type="date"
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
                  )}
                </>
              )}

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  className="flex-1 text-xs sm:text-sm text-white font-bold"
                  color="success"
                  isDisabled={isSavingOpinion || !opinion?.opinionType}
                  size="md"
                  startContent={<CheckCircle2 className="w-4 h-4" />}
                  onPress={handleOpenConfirmacao}
                >
                  Salvar Parecer
                </Button>
                <Button
                  className="text-xs sm:text-sm"
                  isDisabled={isSavingOpinion}
                  size="sm"
                  variant="bordered"
                  onPress={handleLimparParecer}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <ExamesRepeticaoModal
        examesDisponiveis={examesDisponiveisParaRepeticao}
        isOpen={examesRepeticaoModalOpen}
        onClose={() => setExamesRepeticaoModalOpen(false)}
        onSave={handleSaveExamesRepeticao}
      />

      <ConfirmacaoParecerModal
        isLoading={isSavingOpinion}
        isOpen={confirmacaoModalOpen}
        opinion={opinion}
        onClose={() => setConfirmacaoModalOpen(false)}
        onConfirm={saveOpinion}
      />

      <LaudosModal
        isOpen={laudoModalOpen}
        onClose={() => setLaudoModalOpen(false)}
        onSave={(t, d) => {
          setOpinion((prev) => ({
            ...(prev || {}),
            opinionType:
              prev?.opinionType ||
              (t === LaudoTipo.PCD
                ? ParecerMedico.APTO_COM_ORIENTACAO
                : ParecerMedico.INAPTO_TEMPORARIAMENTE),
            laudoPCD: t === LaudoTipo.PCD ? d : (prev?.laudoPCD ?? null),
            laudoRestricao:
              t !== LaudoTipo.PCD ? d : (prev?.laudoRestricao ?? null),
          }));
          addToast({
            title:
              t === LaudoTipo.PCD
                ? "Laudo PCD emitido"
                : "Laudo de Restrição emitido",
            description:
              t === LaudoTipo.PCD
                ? "Laudo PCD adicionado ao parecer médico"
                : "Laudo de restrição temporária adicionado ao parecer",
            color: "foreground",
          });
        }}
      />
    </aside>
  );
};

export default memo(PainelDireita);
