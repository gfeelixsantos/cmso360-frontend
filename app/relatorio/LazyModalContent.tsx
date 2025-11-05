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
  Select,
  SelectItem,
} from '@heroui/react';
import { FileTextIcon, UploadIcon, CheckCircleIcon } from 'lucide-react';
import { ExamRegister, Scheduling } from '@/lib/scheduling/interface/scheduling';
import { AtendimentoStatus, ExamStatus } from '@/lib/scheduling/enum/scheduling.enum';
import { NEST_SCHEDULINGS } from '@/config/constants';


// Props corretas conforme o pai (page.tsx)
interface LazyModalContentProps {
  atendimento: Scheduling;
  onClose: () => void;
  onUpdateScheduling?: (updated: Scheduling) => void;
}

const InformacoesGerais: React.FC<{ atendimento: Scheduling }> = ({ atendimento }) => {
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
        <h3 className="font-semibold mb-4 text-lg border-b pb-2">Informações do Atendimento</h3>
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
  // localExames para refletir alterações locais imediatamente
  const [localExames, setLocalExames] = useState<ExamRegister[]>(exames || []);
  // mapa de arquivos selecionados por grupo
  const [groupFiles, setGroupFiles] = useState<Record<string, File[]>>({});
  // uploading flags por grupo
  const [uploadingGroup, setUploadingGroup] = useState<Record<string, boolean>>({});
  // success flags por grupo
  const [successGroup, setSuccessGroup] = useState<Record<string, boolean>>({});
  // error messages por grupo
  const [errorGroup, setErrorGroup] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalExames(exames || []);
  }, [exames]);

  // Agrupa exames por grupo
  const grupos = useMemo(() => {
    const map = new Map<string, ExamRegister[]>();
    for (const ex of localExames) {
      const g = ex.grupo || 'Sem Grupo';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(ex);
    }
    return Array.from(map.entries()); // [ [grupoName, exams[]], ... ]
  }, [localExames]);

  const canShowUploadForExamStatus = (status: string) => {
    // Mostra o botão somente quando o exame estiver aguardando resultado.
    // Aceitamos dois valores comuns: constante do enum ou string 'PENDENTE' presente nos dados.
    const allowed = [
      ExamStatus.AGUARDANDO_RESULTADO, // se existir no enum
      'AGUARDANDO_RESULTADO',
    ];
    return allowed.includes(status);
  };

  const handleGroupFilesChange = (groupName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setGroupFiles(prev => ({ ...prev, [groupName]: files }));
    setSuccessGroup(prev => ({ ...prev, [groupName]: false }));
    setErrorGroup(prev => ({ ...prev, [groupName]: '' }));
  };

  const handleUploadGroup = async (groupName: string) => {
    const files = groupFiles[groupName];
    if (!files || files.length === 0) {
      setErrorGroup(prev => ({ ...prev, [groupName]: 'Selecione ao menos um PDF.' }));
      return;
    }

    setUploadingGroup(prev => ({ ...prev, [groupName]: true }));
    setErrorGroup(prev => ({ ...prev, [groupName]: '' }));
    setSuccessGroup(prev => ({ ...prev, [groupName]: false }));

    try {
      // Prepara scheduling para envio (marca url vazio nos exames do grupo para backend processar)
      const schedulingToSend: Scheduling = {
        ...atendimento,
        EXAMES: atendimento.EXAMES.map(e => e.grupo === groupName ? { ...e, url: '' } : e)
      };

      const formData = new FormData();
      formData.append('schedulingid', schedulingToSend._id);
      formData.append('grupo', groupName)
      // múltiplos arquivos
      for (const file of files) {
        formData.append('files', file);
      }

      const resp = await fetch(`${NEST_SCHEDULINGS}/resultadoexame`, {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => 'Erro no servidor');
        throw new Error(text || 'Erro no upload');
      }

      // backend deve retornar o scheduling atualizado (com EXAMES[].url preenchidos)
      const updatedScheduling: Scheduling = await resp.json();

      // Atualiza localExames com a resposta do backend (fallback para objectURL se backend não retornar urls)
      if (updatedScheduling && updatedScheduling.EXAMES) {
        setLocalExames(updatedScheduling.EXAMES);
      } else {
        // fallback — cria URLs locais apenas para visualização
        setLocalExames(prev => prev.map(e => e.grupo === groupName ? { ...e, url: URL.createObjectURL(files[0]) } : e));
      }

      // sinaliza sucesso e chama callback para atualizar pai
      setSuccessGroup(prev => ({ ...prev, [groupName]: true }));
      if (onUpdateScheduling) onUpdateScheduling(updatedScheduling);

    } catch (err: any) {
      console.error('Erro upload grupo', groupName, err);
      setErrorGroup(prev => ({ ...prev, [groupName]: err?.message || 'Falha no upload' }));
    } finally {
      setUploadingGroup(prev => ({ ...prev, [groupName]: false }));
      // não limpar imediatamente os arquivos para o usuário ver os nomes — vamos manter por curto período
      // se quiser limpar: setGroupFiles(prev => ({ ...prev, [groupName]: [] }));
    }
  };

  if (!localExames.length) {
    return <div className="text-center py-8 text-gray-500 text-sm">Nenhum exame encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      {grupos.map(([groupName, examsInGroup]) => (
        <div key={groupName} className="bg-white border rounded-md p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold">{groupName}</h4>
              <div className="text-sm text-gray-500">{examsInGroup.length} exame(s)</div>
              {successGroup[groupName] && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircleIcon size={16} />
                  <span>Arquivos enviados</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* input file multiple (oculto) */}
              <input
                id={`group-file-${groupName}`}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleGroupFilesChange(groupName, e)}
              />

              {/* label botão selecionar */}
              <label
                htmlFor={`group-file-${groupName}`}
                className={`cursor-pointer px-3 py-2 rounded text-sm font-medium border ${
                  groupFiles[groupName] && groupFiles[groupName].length > 0 ? 'bg-gray-100 border-gray-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {groupFiles[groupName] && groupFiles[groupName].length > 0 ? `${groupFiles[groupName].length} arquivo(s) selecionado(s)` : 'Selecionar PDF(s)'}
              </label>

              {/* botão enviar — habilitado apenas se houver ao menos um exame do grupo com status elegível */}
              <Button
                size="sm"
                disabled={!groupFiles[groupName] || groupFiles[groupName].length === 0 || uploadingGroup[groupName]}
                onPress={() => handleUploadGroup(groupName)}
                startContent={uploadingGroup[groupName] ? <Spinner size="sm" /> : <UploadIcon size={16} />}
              >
                {uploadingGroup[groupName] ? 'Enviando...' : 'Enviar grupo'}
              </Button>
            </div>
          </div>

          {/* exibe nomes dos arquivos selecionados */}
          {groupFiles[groupName] && groupFiles[groupName].length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-1">Arquivos selecionados:</div>
              <div className="flex flex-wrap gap-2">
                {groupFiles[groupName].map((f, idx) => (
                  <Chip key={idx} size="sm">{f.name}</Chip>
                ))}
              </div>
            </div>
          )}

          {/* exibe erro se houver */}
          {errorGroup[groupName] && (
            <div className="mt-2 text-sm text-red-600">{errorGroup[groupName]}</div>
          )}

          {/* tabela interna com exames do grupo */}
          <div className="mt-4 overflow-x-auto">
            <Table aria-label={`Exames do grupo ${groupName}`}>
              <TableHeader>
                <TableColumn>EXAME</TableColumn>
                <TableColumn>DATA</TableColumn>
                <TableColumn>PROFISSIONAL</TableColumn>
                <TableColumn>STATUS</TableColumn>
                <TableColumn>RESULTADO</TableColumn>
              </TableHeader>
              <TableBody>
                {examsInGroup.map((ex, idx) => (
                  <TableRow key={ex.sequencialResultadoExame || ex.codigoExame || idx}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{ex.nomeExame}</span>
                        <span className="text-xs text-gray-500">{ex.codigoExame}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{ex.dataExame || '-'}</TableCell>
                    <TableCell className="text-sm">{ex.profissional || '-'}</TableCell>
                    <TableCell>
                      <Chip color={ex.status === 'FINALIZADO' ? 'success' : ex.status === 'PENDENTE' ? 'warning' : 'default'} size="sm">
                        {ex.status}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {ex.url ? (
                        <Tooltip content="Visualizar resultado em PDF">
                          <Button isIconOnly size="sm" variant="light" onPress={() => window.open(ex.url, '_blank')}>
                            <FileTextIcon size={16} />
                          </Button>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-gray-400">Sem resultado</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
};

ExamesTable.displayName = 'ExamesTable';

const LazyModalContent: React.FC<LazyModalContentProps> = ({ atendimento, onClose, onUpdateScheduling }) => {
  return (
    <>
      <ModalHeader>
        <h2 className="text-xl font-bold">Detalhes do Atendimento</h2>
      </ModalHeader>
      <ModalBody>
        <InformacoesGerais atendimento={atendimento} />
        <div>
          <h3 className="font-semibold mb-3 text-lg">Exames</h3>
          <ExamesTable exames={atendimento.EXAMES} atendimento={atendimento} onUpdateScheduling={onUpdateScheduling} />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="light" onPress={onClose}>Fechar</Button>
      </ModalFooter>
    </>
  );
};

LazyModalContent.displayName = 'LazyModalContent';
export default LazyModalContent;
