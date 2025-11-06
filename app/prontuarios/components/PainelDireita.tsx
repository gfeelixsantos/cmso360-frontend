"use client"
import React, { useState, useRef } from 'react';
import { 
  addToast,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Textarea,
  Progress,
  Spinner,
  Badge,
  Alert,
  Accordion,
  AccordionItem,
  RadioGroup,
  Radio,
  Modal as HeroModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";
import { 
  UploadCloud, 
  CheckCircle, 
  X, 
  Eye, 
  Maximize, 
  ClipboardList, 
  UserCheck,
  ChevronDown,
  ChevronUp,
  Stethoscope
} from "lucide-react";
import { IUserInfo } from '@/lib/user/interfaces/IUser';
import { AtendimentoStatus, ExamStatus, ParecerMedico } from '@/lib/scheduling/enum/scheduling.enum';
import { USER_PROFILE } from '@/config/constants';
import { NEST_SCHEDULINGS_FINISH } from '@/config/constants';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { MedicalRecord } from '../page';

/* ---------------------- Tipos para Laudos ---------------------- */

enum LaudoTipo {
  PCD = "PCD",
  RESTRICAO_TEMPORARIA = "RESTRICAO_TEMPORARIA"
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
};

type PdfUrl = { url: string; title: string; type: "exame" | "anexo"; examName?: string; grupo?: string };


interface RightPanelProps {
  selectedRecord: MedicalRecord | null;
  currentPdfIndex: number;
  onPdfIndexChange: (index: number) => void;
  user: IUserInfo;
  onRecordUpdate: (record: MedicalRecord) => void;
}

const PainelDireita: React.FC<RightPanelProps> = ({
  selectedRecord,
  currentPdfIndex,
  onPdfIndexChange,
  user,
  onRecordUpdate
}) => {
  // Estados do componente
  const [opinion, setOpinion] = useState<MedicalOpinionData | null>(null);
  const [isSavingOpinion, setIsSavingOpinion] = useState(false);
    const [uploadStates, setUploadStates] = useState<Record<string, Record<string, { file: File; progress: number; uploading: boolean; url?: string }>>>({});
  const [laudoModalOpen, setLaudoModalOpen] = useState(false);
  const [examesAccordionOpen, setExamesAccordionOpen] = useState<string[]>([]);

  // Refs
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /* ---------------------- Handlers ---------------------- */

  const simulateUploadFile = async (file: File, onProgress?: (p: number) => void) => {
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
  };

  const handleFileInputClick = (codigoExame: string) => {
    fileInputRefs.current[codigoExame]?.click();
  };

  const handleFileSelected = (codigoExame: string, event: React.ChangeEvent<HTMLInputElement>) => {
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

    event.target.value = '';
  };

  const startUpload = async (codigoExame: string) => {
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
              progress: p 
            },
          },
        }));
      });

      // Atualizar o registro com o novo PDF
    //   const updatedRecord: MedicalRecord = {
    //     ...selectedRecord,
    //     EXAMES: selectedRecord.EXAMES.map((ex) => 
    //       ex.codigoExame === codigoExame 
    //         ? { ...ex, url: res.url, status: ExamStatus.FINALIZADO } 
    //         : ex
    //     ),
    //     pdfUrls: [
    //       ...selectedRecord.pdfUrls,
    //       {
    //         url: res.url,
    //         title: `Resultado: ${selectedRecord.EXAMES.find(e => e.codigoExame === codigoExame)?.grupo || codigoExame}`,
    //         type: "exame" as const,
    //         grupo: selectedRecord.EXAMES.find(e => e.codigoExame === codigoExame)?.grupo
    //       }
    //     ]
    //   };

    //   onRecordUpdate(updatedRecord);
      
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
            progress: 0 
          },
        },
      }));
    }
  };

  const cancelUpload = (codigoExame: string) => {
    if (!selectedRecord) return;
    
    setUploadStates((prev) => {
      const copy = { ...prev };
      if (copy[selectedRecord._id as string] && copy[selectedRecord._id as string][codigoExame]) {
        delete copy[selectedRecord._id as string][codigoExame];
      }
      return copy;
    });
  };

  const saveOpinion = async () => {
    if (!opinion || !opinion.opinionType || !selectedRecord) {
      addToast({
        variant: "solid",
        title: "Parecer incompleto",
        description: "Selecione um parecer médico antes de salvar.",
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
          options: opinion
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar parecer');

      const updatedRecord = {
        ...selectedRecord,
      };

      onRecordUpdate(updatedRecord);
      setOpinion(null);
      
      addToast({
        variant: "flat",
        title: "Prontuário liberado",
        description: "Parecer médico salvo com sucesso.",
        color: "success",
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
  };

  const handleEmitirLaudo = (tipo: LaudoTipo, data: any) => {
    if (tipo === LaudoTipo.PCD) {
      setOpinion(prev => ({
        ...prev,
        opinionType: ParecerMedico.APTO_COM_ORIENTACAO,
        laudoPCD: data
      }));
      addToast({
        title: "Laudo PCD emitido",
        description: "Laudo PCD adicionado ao parecer médico",
        color: "success",
      });
    } else {
      setOpinion(prev => ({
        ...prev,
        opinionType: ParecerMedico.INAPTO_TEMPORARIAMENTE,
        laudoRestricao: data
      }));
      addToast({
        title: "Laudo de Restrição emitido",
        description: "Laudo de restrição temporária adicionado ao parecer",
        color: "success",
      });
    }
  };

  const selectPdfFromExame = (exameGrupo: string) => {
    if (!selectedRecord) return;
    
    const pdfIndex = selectedRecord.pdfUrls.findIndex(pdf => 
      pdf.grupo === exameGrupo && pdf.type === "exame"
    );
    
    if (pdfIndex !== -1) {
      onPdfIndexChange(pdfIndex);
    }
  };

  const isExamBeingDisplayed = (exameGrupo: string) => {
    if (!selectedRecord || !selectedRecord.pdfUrls[currentPdfIndex]?.grupo) return false;
    return selectedRecord.pdfUrls[currentPdfIndex].grupo === exameGrupo;
  };

  const hasPdfAvailable = (exameGrupo: string) => {
    if (!selectedRecord) return false;
    return selectedRecord.pdfUrls.some(pdf => 
      pdf.grupo === exameGrupo && pdf.type === "exame"
    );
  };

  /* ---------------------- Componentes Internos ---------------------- */

  const LaudosModal = ({ 
    isOpen, 
    onClose, 
    onSave 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (tipo: LaudoTipo, data: any) => void;
  }) => {
    const [tipoLaudo, setTipoLaudo] = useState<LaudoTipo>(LaudoTipo.RESTRICAO_TEMPORARIA);
    const [laudoPCD, setLaudoPCD] = useState<LaudoPCDData>({
      cid: "",
      descricaoCid: "",
      limitacoes: "",
      adaptacoesNecessarias: "",
      observacoes: ""
    });
    const [laudoRestricao, setLaudoRestricao] = useState<LaudoRestricaoData>({
      cid: "",
      descricaoCid: "",
      restricoes: "",
      periodoDias: 30,
      dataInicio: new Date().toISOString().split('T')[0],
      dataFim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      recomendacoes: ""
    });

    const calcularDataFim = (inicio: string, dias: number) => {
      const data = new Date(inicio);
      data.setDate(data.getDate() + dias);
      return data.toISOString().split('T')[0];
    };

    const handleSave = () => {
      if (tipoLaudo === LaudoTipo.PCD) {
        onSave(tipoLaudo, laudoPCD);
      } else {
        onSave(tipoLaudo, laudoRestricao);
      }
      onClose();
    };

    return (
      <HeroModal 
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        backdrop="blur"
        scrollBehavior="inside"
      >
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
                      onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, cid: value }))}
                    />
                    <Input
                      label="Período (dias)"
                      type="number"
                      value={laudoRestricao.periodoDias.toString()}
                      onValueChange={(value) => {
                        const dias = parseInt(value) || 30;
                        setLaudoRestricao(prev => ({
                          ...prev,
                          periodoDias: dias,
                          dataFim: calcularDataFim(prev.dataInicio, dias)
                        }));
                      }}
                    />
                  </div>
                  
                  <Input
                    label="Descrição do CID"
                    placeholder="Descrição da condição médica"
                    value={laudoRestricao.descricaoCid}
                    onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, descricaoCid: value }))}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Data Início"
                      type="date"
                      value={laudoRestricao.dataInicio}
                      onValueChange={(value) => setLaudoRestricao(prev => ({
                        ...prev,
                        dataInicio: value,
                        dataFim: calcularDataFim(value, prev.periodoDias)
                      }))}
                    />
                    <Input
                      label="Data Fim"
                      type="date"
                      value={laudoRestricao.dataFim}
                      onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, dataFim: value }))}
                    />
                  </div>

                  <Textarea
                    label="Restrições Específicas"
                    placeholder="Descreva as restrições temporárias para o trabalho..."
                    value={laudoRestricao.restricoes}
                    onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, restricoes: value }))}
                    rows={3}
                  />

                  <Textarea
                    label="Recomendações"
                    placeholder="Recomendações e orientações para o período..."
                    value={laudoRestricao.recomendacoes}
                    onValueChange={(value) => setLaudoRestricao(prev => ({ ...prev, recomendacoes: value }))}
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
                      onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, cid: value }))}
                    />
                  </div>

                  <Input
                    label="Descrição do CID"
                    placeholder="Descrição da condição de deficiência"
                    value={laudoPCD.descricaoCid}
                    onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, descricaoCid: value }))}
                  />

                  <Textarea
                    label="Limitações Funcionais"
                    placeholder="Descreva as limitações funcionais do paciente..."
                    value={laudoPCD.limitacoes}
                    onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, limitacoes: value }))}
                    rows={3}
                  />

                  <Textarea
                    label="Adaptações Necessárias"
                    placeholder="Descreva as adaptações necessárias no ambiente de trabalho..."
                    value={laudoPCD.adaptacoesNecessarias}
                    onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, adaptacoesNecessarias: value }))}
                    rows={3}
                  />

                  <Textarea
                    label="Observações Adicionais"
                    placeholder="Outras observações relevantes..."
                    value={laudoPCD.observacoes}
                    onValueChange={(value) => setLaudoPCD(prev => ({ ...prev, observacoes: value }))}
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

  if (!selectedRecord) {
    return (
      <aside className="w-96 bg-content1 border-l border-divider flex-shrink-0 flex flex-col">
        <Card className="m-4">
          <CardBody className="text-center p-6">
            <p className="text-default-500 text-sm">
              Selecione um prontuário para visualizar as opções.
            </p>
          </CardBody>
        </Card>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-content1 border-l border-divider flex-shrink-0 flex flex-col">
      <div className="flex flex-col flex-1">
        {/* Informações do Paciente */}
        <Card shadow="none" className="rounded-none border-b border-divider">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-foreground truncate">{selectedRecord.NOME}</h3>
                <Chip 
                  size="sm" 
                  variant="flat"
                  className="mt-1"
                >
                  {selectedRecord.TIPOEXAMENOME}
                </Chip>
                <div className="space-y-1 mt-2">
                  <p className="text-xs text-default-600">Empresa: {selectedRecord.NOMEEMPRESA}</p>
                  <p className="text-xs text-default-600">Cargo: {selectedRecord.NOMECARGO}</p>
                  <p className="text-xs text-default-600">Setor: {selectedRecord.NOMESETOR} - {selectedRecord.NOMEUNIDADE}</p>
                  {selectedRecord.OBSERVACOES && (
                    <Alert 
                      title="Observações cliente"
                      className="text-[0.6rem]"
                      variant="flat"
                      color="danger"
                    >
                      {selectedRecord.OBSERVACOES}
                    </Alert>
                  )}
                  {selectedRecord.ANOTACOES && (
                    <Alert 
                      title="Anotações internas"
                      className="text-[0.6rem]"
                      variant="flat"
                      color="primary"
                    >
                      {selectedRecord.ANOTACOES}
                    </Alert>
                  )}
                </div>
              </div>
            </div>
            
            {/* Lista de Exames */}
            <Accordion 
              isCompact={true}
              selectionMode="multiple"
              selectedKeys={examesAccordionOpen}
              onSelectionChange={(keys) => setExamesAccordionOpen(Array.from(keys as Set<string>))}
            >
              <AccordionItem
                key="exames"
                aria-label="Exames Realizados"
                title={
                  <div className="flex items-center gap-2 mt-2">
                    <h4 className="font-semibold text-default-700">Exames</h4>
                    <Badge variant="flat" color="primary" size="sm">
                      {selectedRecord.EXAMES.length}
                    </Badge>
                  </div>
                }
              >
                <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                  {selectedRecord.EXAMES.map((exame) => {
                    const uploadState = selectedRecord ? uploadStates[selectedRecord._id as string]?.[exame.codigoExame] : null;
                    
                    return (
                      <Card 
                        key={exame.codigoExame} 
                        className={`border-default-200 transition-all duration-200 ${
                          isExamBeingDisplayed(exame.grupo) 
                            ? "ring-2 ring-primary bg-primary-50 border-primary-200" 
                            : ""
                        }`}
                      >
                        <CardBody className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center justify-between flex-1">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-sm text-default-800">{exame.grupo}</h5>
                                {hasPdfAvailable(exame.grupo) && (
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="primary"
                                    onPress={() => selectPdfFromExame(exame.grupo)}
                                    title="Visualizar PDF"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              {isExamBeingDisplayed(exame.grupo) && (
                                <Chip size="sm" color="primary" variant="flat">
                                  Visualizando
                                </Chip>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs text-default-600 mb-3">
                            <div>
                              {new Date(exame.dataExame).toLocaleDateString("pt-BR") || "N/A"} 
                            </div>
                            <div>
                              {exame.sala || "N/A"}
                            </div>
                            <div className="col-span-2">
                              {exame.profissional?.split(" ")[0] || "N/A"}
                            </div>
                          </div>
                          
                          {/* Área de upload */}
                          <div className="space-y-2">
                            {exame.url && exame.status === ExamStatus.FINALIZADO ? (
                              <div className="flex items-center justify-between bg-success-50 p-2 rounded-lg border border-success-200">
                                <div className="flex items-center gap-2 text-success-700">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">Resultado Recebido</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    as="a"
                                    href={exame.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    color="success"
                                    size="sm"
                                    variant="flat"
                                  >
                                    Visualizar
                                  </Button>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="primary"
                                    onPress={() => selectPdfFromExame(exame.grupo)}
                                    title="Abrir no Visualizador"
                                  >
                                    <Maximize className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : uploadState ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium truncate flex-1 mr-2">
                                    {uploadState.file.name}
                                  </span>
                                  {!uploadState.uploading ? (
                                    <div className="flex gap-1">
                                      <Button
                                        color="primary"
                                        size="sm"
                                        onPress={() => startUpload(exame.codigoExame)}
                                      >
                                        Enviar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="light"
                                        color="danger"
                                        onPress={() => cancelUpload(exame.codigoExame)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-primary font-medium">
                                      {uploadState.progress}%
                                    </span>
                                  )}
                                </div>
                                {uploadState.uploading && (
                                  <Progress
                                    value={uploadState.progress}
                                    color="primary"
                                    className="w-full"
                                    size="sm"
                                  />
                                )}
                              </div>
                            ) : exame.status === ExamStatus.AGUARDANDO_RESULTADO && (
                              <div className="flex gap-2">
                                <input
                                  type="file"
                                  ref={(el: HTMLInputElement | null) => {
                                    fileInputRefs.current[exame.codigoExame] = el;
                                  }}
                                  onChange={(e) => handleFileSelected(exame.codigoExame, e)}
                                  accept="application/pdf"
                                  className="hidden"
                                />
                                <Button
                                  color="primary"
                                  size="sm"
                                  variant="flat"
                                  onPress={() => handleFileInputClick(exame.codigoExame)}
                                  startContent={<UploadCloud className="w-3 h-3" />}
                                >
                                  Enviar PDF
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </AccordionItem>
            </Accordion>
          </CardBody>
        </Card>

        {/* Parecer Médico (apenas para médicos) */}
        {(user.perfil === USER_PROFILE.MEDICO || user.perfil === USER_PROFILE.MASTER) && (
          <Card className="flex-1">
            <CardBody className="space-y-4">
              <div className="flex justify-between items-center">
                <Select
                  label="Tipo de Parecer"
                  placeholder="Selecione o parecer"
                  value={opinion?.opinionType || ""}
                  onChange={(e) => setOpinion({ 
                    ...(opinion || {}), 
                    opinionType: e.target.value as ParecerMedico 
                  })}
                  className="flex-1"
                >
                  <SelectItem key={ParecerMedico.APTO}>
                    {ParecerMedico.APTO}
                  </SelectItem>
                  <SelectItem key={ParecerMedico.APTO_COM_ORIENTACAO}>
                    {ParecerMedico.APTO_COM_ORIENTACAO.replace(/_/g, ' ')}
                  </SelectItem>
                  <SelectItem key={ParecerMedico.SOLICITAR_REPETICAO}>
                    {ParecerMedico.SOLICITAR_REPETICAO.replace(/_/g, ' ')}
                  </SelectItem>
                  <SelectItem key={ParecerMedico.INAPTO}>
                    {ParecerMedico.INAPTO}
                  </SelectItem>
                  <SelectItem key={ParecerMedico.INAPTO_TEMPORARIAMENTE}>
                    {ParecerMedico.INAPTO_TEMPORARIAMENTE.replace(/_/g, ' ')}
                  </SelectItem>
                </Select>

                <Button
                  color="warning"
                  variant="flat"
                  onPress={() => setLaudoModalOpen(true)}
                  startContent={<ClipboardList className="w-4 h-4" />}
                  className="ml-2"
                >
                  Emitir Laudo
                </Button>
              </div>

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

              {opinion?.opinionType === ParecerMedico.APTO_COM_ORIENTACAO && (
                <Textarea
                  label="Detalhes da orientação"
                  placeholder="Descreva as orientações..."
                  value={opinion.details ?? ""}
                  onValueChange={(value) => setOpinion({ 
                    ...opinion, 
                    details: value 
                  })}
                  rows={4}
                />
              )}
              
              {opinion?.opinionType === ParecerMedico.SOLICITAR_REPETICAO && (
                <Textarea
                  label="Motivo da repetição"
                  placeholder="Descreva o motivo detalhado para solicitação de repetição..."
                  value={opinion.details ?? ""}
                  onValueChange={(value) => setOpinion({ 
                    ...opinion, 
                    details: value 
                  })}
                  rows={4}
                />
              )}
              
              {opinion?.opinionType === ParecerMedico.INAPTO && (
                <Textarea
                  label="Justificativa"
                  placeholder="Justificativa detalhada da inaptidão permanente..."
                  value={opinion.details ?? ""}
                  onValueChange={(value) => setOpinion({ 
                    ...opinion, 
                    details: value 
                  })}
                  rows={4}
                />
              )}
              
              {opinion?.opinionType === ParecerMedico.INAPTO_TEMPORARIAMENTE && (
                <div className="space-y-3">
                  <Textarea
                    label="Justificativa"
                    placeholder="Justificativa da inaptidão temporária..."
                    value={opinion.details ?? ""}
                    onValueChange={(value) => setOpinion({ 
                      ...opinion, 
                      details:  value 
                    })}
                    rows={3}
                  />
                  <Input
                    type="date"
                    label="Inapto até"
                    value={opinion.details ?? ""}
                    onValueChange={(value) => setOpinion({ 
                      ...opinion, 
                      details: value 
                    })}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  color="primary"
                  onPress={saveOpinion}
                  isDisabled={isSavingOpinion || !opinion?.opinionType}
                  isLoading={isSavingOpinion}
                  className="flex-1"
                >
                  {isSavingOpinion ? "Salvando..." : "Salvar Parecer"}
                </Button>
                <Button
                  variant="bordered"
                  onPress={() => setOpinion(null)}
                  isDisabled={isSavingOpinion}
                >
                  Limpar
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Modal Emitir Laudo */}
      <LaudosModal
        isOpen={laudoModalOpen}
        onClose={() => setLaudoModalOpen(false)}
        onSave={handleEmitirLaudo}
      />
    </aside>
  );
};

export default PainelDireita;