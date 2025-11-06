// app/relatorios/LazyModalContent.tsx
import React, { useEffect, useMemo, useState } from 'react';
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
} from '@heroui/react';
import { FileText, Upload, CheckCircle, Download, Eye, Clock, AlertCircle, User, Edit, RefreshCw } from 'lucide-react';
import { ExamRegister, Scheduling } from '@/lib/scheduling/interface/scheduling';
import { AtendimentoStatus, ExamStatus } from '@/lib/scheduling/enum/scheduling.enum';
import { NEST_SCHEDULINGS } from '@/config/constants';

interface LazyModalContentProps {
  atendimento: Scheduling;
  onClose: () => void;
  onUpdateScheduling?: (updated: Scheduling) => void;
}

const InformacoesGerais: React.FC<{ 
  atendimento: Scheduling;
  onEditClick: () => void;
}> = ({ atendimento, onEditClick }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case AtendimentoStatus.AGENDADO: return 'warning';
      case AtendimentoStatus.EM_ATENDIMENTO: return 'primary';
      case AtendimentoStatus.AGUARDANDO_RESULTADOS: return 'secondary';
      case AtendimentoStatus.AGUARDANDO_AVALIACAO_MEDICA: return 'default';
      case AtendimentoStatus.FINALIZADO: return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg border-b pb-2">Informações do Atendimento</h3>
          <Tooltip content="Editar cadastro do funcionário">
            <Button
              isIconOnly
              variant="light"
              color="primary"
              size="sm"
              onPress={onEditClick}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Edit size={18} />
            </Button>
          </Tooltip>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2">Dados do Paciente</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Nome:</strong> {atendimento.NOME}</p>
              <p><strong>CPF:</strong> {atendimento.CPFFUNCIONARIO}</p>
              <p><strong>Data Nasc.:</strong> {atendimento.DATANASCIMENTO}</p>
              <p><strong>Matrícula:</strong> {atendimento.MATRICULAFUNCIONARIO || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2">Dados da Empresa</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Empresa:</strong> {atendimento.NOMEEMPRESA}</p>
              <p><strong>CNPJ:</strong> {atendimento.CNPJEMPRESA}</p>
              <p><strong>Cargo:</strong> {atendimento.NOMECARGO}</p>
              <p><strong>Setor:</strong> {atendimento.NOMESETOR}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2">Agendamento</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Data:</strong> {atendimento.DATAAGENDAMENTO}</p>
              <p><strong>Horário:</strong> {atendimento.HORARIO}</p>
              <p><strong>Unidade:</strong> {atendimento.UNIDADEATENDIMENTO}</p>
              <p><strong>Tipo Exame:</strong> {atendimento.TIPOEXAMENOME}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-600 mb-2">Status</h4>
            <Chip color={getStatusColor(atendimento.ATENDIMENTOSTATUS)} size="lg">
              {atendimento.ATENDIMENTOSTATUS.replace(/_/g, ' ').toLowerCase()
                .replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Chip>
          </div>
        </div>
      </div>
      <Divider />
    </div>
  );
};

InformacoesGerais.displayName = 'InformacoesGerais';

const ExamesTable: React.FC<{
  exames: ExamRegister[];
  atendimento: Scheduling;
  onUpdateScheduling?: (updated: Scheduling) => void;
}> = ({ exames, atendimento, onUpdateScheduling }) => {
  const [localExames, setLocalExames] = useState<ExamRegister[]>(exames || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [uploadingExams, setUploadingExams] = useState<Record<string, boolean>>({});
  const [successExams, setSuccessExams] = useState<Record<string, boolean>>({});
  const [errorExams, setErrorExams] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalExames(exames || []);
  }, [exames]);

  // Filtra exames baseado no termo de busca
  const filteredExames = useMemo(() => {
    if (!searchTerm) return localExames;
    return localExames.filter(exame =>
      exame.nomeExame.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exame.codigoExame.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exame.grupo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localExames, searchTerm]);

  const getExamStatusColor = (status: string) => {
    switch (status) {
      case 'FINALIZADO': return 'success';
      case 'PENDENTE': return 'warning';
      case 'AGUARDANDO_RESULTADO': return 'secondary';
      default: return 'default';
    }
  };

  const getExamStatusIcon = (status: string) => {
    switch (status) {
      case 'FINALIZADO': return <CheckCircle size={14} />;
      case 'PENDENTE': return <Clock size={14} />;
      case 'AGUARDANDO_RESULTADO': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const handleFileChange = (examKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [examKey]: file }));
      setSuccessExams(prev => ({ ...prev, [examKey]: false }));
      setErrorExams(prev => ({ ...prev, [examKey]: '' }));
    }
  };

  const handleUploadExam = async (exame: ExamRegister) => {
    const examKey = exame.sequencialResultadoExame || exame.codigoExame;
    const file = selectedFiles[examKey];

    if (!file) {
      setErrorExams(prev => ({ ...prev, [examKey]: 'Selecione um arquivo PDF.' }));
      return;
    }

    setUploadingExams(prev => ({ ...prev, [examKey]: true }));
    setErrorExams(prev => ({ ...prev, [examKey]: '' }));
    setSuccessExams(prev => ({ ...prev, [examKey]: false }));

    try {
      const formData = new FormData();
      formData.append('schedulingid', atendimento._id);
      formData.append('grupo', exame.grupo || '');
      formData.append('codigoExame', exame.codigoExame);
      formData.append('files', file);

      const resp = await fetch(`${NEST_SCHEDULINGS}/resultadoexame`, {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => 'Erro no servidor');
        throw new Error(text || 'Erro no upload');
      }

      const updatedScheduling: Scheduling = await resp.json();
      if (updatedScheduling && updatedScheduling.EXAMES) {
        setLocalExames(updatedScheduling.EXAMES);
        setSelectedFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[examKey];
          return newFiles;
        });
      }

      setSuccessExams(prev => ({ ...prev, [examKey]: true }));
      if (onUpdateScheduling) onUpdateScheduling(updatedScheduling);

    } catch (err: any) {
      console.error('Erro upload exame', examKey, err);
      setErrorExams(prev => ({ ...prev, [examKey]: err?.message || 'Falha no upload' }));
    } finally {
      setUploadingExams(prev => ({ ...prev, [examKey]: false }));
    }
  };

  const handleSyncExam = (exame: ExamRegister) => {
    // Implementação será feita posteriormente
    console.log('Sincronizar exame:', exame);
    // TODO: Implementar sincronização do exame
  };

  const handleViewMedicalRecord = () => {
    // Implementação será feita posteriormente
    console.log('Visualizar prontuário do atendimento:', atendimento._id);
    // TODO: Implementar visualização do prontuário
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!localExames.length) {
    return (
      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum exame encontrado</h3>
        <p className="text-gray-500">Não há exames cadastrados para este atendimento.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header da Tabela */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Exames Realizados</h3>
          <Tooltip content="Visualizar prontuário completo">
            <Button
              isIconOnly
              variant="light"
              color="default"
              size="sm"
              onPress={handleViewMedicalRecord}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
            >
              <User size={18} />
            </Button>
          </Tooltip>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Buscar exames..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
            size="sm"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table 
          aria-label="Tabela de exames"
          removeWrapper
          classNames={{
            base: "min-w-full",
            th: "bg-gray-50 text-gray-700 font-semibold text-sm border-b px-4 py-3",
            td: "border-b border-gray-100 px-4 py-3",
            tr: "hover:bg-gray-50 transition-colors"
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
              const examKey = exame.sequencialResultadoExame || exame.codigoExame || index.toString();
              const hasFileSelected = !!selectedFiles[examKey];
              const isUploading = uploadingExams[examKey];
              const isSuccess = successExams[examKey];
              const error = errorExams[examKey];

              return (
                <TableRow key={examKey}>
                  {/* Coluna Exame */}
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="font-medium text-gray-900 text-sm">{exame.nomeExame}</div>
                      <div className="text-xs text-gray-600">
                        {formatDate(exame.dataExame)} - {exame.profissional} 
                      </div>
                      <div className="text-xs text-gray-600">
                        {exame.sala != "" ? new Date(exame.dataExame).toLocaleTimeString("pt-BR") : ''} {exame.sala} 
                      </div>
                    </div>
                  </TableCell>

                  {/* Coluna Status */}
                  <TableCell>
                    <Chip 
                      color={getExamStatusColor(exame.status)} 
                      size="sm"
                      variant="flat"
                      startContent={getExamStatusIcon(exame.status)}
                      classNames={{
                        base: "px-2 py-1",
                        content: "text-xs font-medium"
                      }}
                    >
                      {exame.status}
                    </Chip>
                  </TableCell>

                  {/* Coluna Resultado */}
                  <TableCell>
                    {exame.url ? (
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Disponível</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Não enviado</span>
                    )}
                  </TableCell>

                  {/* Coluna Ações */}
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {/* Ícone de Sincronizar */}
                      <Tooltip content="Sincronizar exame">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => handleSyncExam(exame)}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <RefreshCw size={16} />
                        </Button>
                      </Tooltip>

                      {exame.url ? (
                        <>
                          <Tooltip content="Visualizar">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => window.open(exame.url, '_blank')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye size={16} />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Download">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              onPress={() => {
                                const link = document.createElement('a');
                                link.href = exame.url;
                                link.download = `${exame.nomeExame}.pdf`;
                                link.click();
                              }}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              <Download size={16} />
                            </Button>
                          </Tooltip>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          {/* Input file oculto */}
                          <input
                            id={`file-${examKey}`}
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => handleFileChange(examKey, e)}
                          />
                          
                          {/* Botão selecionar arquivo */}
                          <label
                            htmlFor={`file-${examKey}`}
                            className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                              hasFileSelected
                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                            }`}
                          >
                            <Upload size={12} />
                            {hasFileSelected ? 'Arquivo Selecionado' : 'Selecionar PDF'}
                          </label>

                          {/* Botão enviar */}
                          <Button
                            size="sm"
                            color="primary"
                            disabled={!hasFileSelected || isUploading}
                            onPress={() => handleUploadExam(exame)}
                            startContent={isUploading ? <Spinner size="sm" /> : <Upload size={12} />}
                            className="text-xs h-8 min-w-20"
                          >
                            {isUploading ? 'Enviando...' : 'Enviar'}
                          </Button>
                        </div>
                      )}
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

      {/* Estatísticas */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Finalizados: {localExames.filter(e => e.status === 'FINALIZADO').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Pendentes: {localExames.filter(e => e.status === 'PENDENTE').length}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Com resultado: {localExames.filter(e => e.url).length}</span>
        </div>
      </div>
    </div>
  );
};

ExamesTable.displayName = 'ExamesTable';

const LazyModalContent: React.FC<LazyModalContentProps> = ({ atendimento, onClose, onUpdateScheduling }) => {
  const handleEditEmployee = () => {
    // Implementação será feita posteriormente
    console.log('Editar cadastro do funcionário:', atendimento._id);
    // TODO: Implementar edição do cadastro do funcionário
  };

  return (
    <>
      <ModalHeader className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Detalhes do Atendimento</h2>
            <p className="text-sm text-gray-600 mt-1">
              {atendimento.NOME} - {atendimento.NOMEEMPRESA}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Visualizar prontuário completo">
              <Button
                isIconOnly
                variant="light"
                color="default"
                size="sm"
                onPress={() => console.log('Visualizar prontuário')}
                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              >
                <User size={20} />
              </Button>
            </Tooltip>
          </div>
        </div>
      </ModalHeader>
      <ModalBody>
        <InformacoesGerais 
          atendimento={atendimento} 
          onEditClick={handleEditEmployee}
        />
        <div>
          <ExamesTable 
            exames={atendimento.EXAMES} 
            atendimento={atendimento} 
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

LazyModalContent.displayName = 'LazyModalContent';
export default LazyModalContent;