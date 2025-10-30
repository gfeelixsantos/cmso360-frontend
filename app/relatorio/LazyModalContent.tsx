// app/relatorios/LazyModalContent.tsx
import { useMemo, useCallback, memo } from 'react';
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
  Divider
} from '@heroui/react';
import { FileTextIcon, CalendarIcon, UserIcon, MapPinIcon, EyeIcon } from 'lucide-react';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { AtendimentoStatus } from '@/lib/scheduling/enum/scheduling.enum';

// Props interface
interface LazyModalContentProps {
  atendimento: Scheduling;
  onClose: () => void;
}

// Componente memoizado para informações gerais
const InformacoesGerais = memo(({ atendimento }: { atendimento: Scheduling }) => {
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case AtendimentoStatus.AGENDADO: return 'warning';
      case AtendimentoStatus.EM_ATENDIMENTO: return 'primary';
      case AtendimentoStatus.AGUARDANDO_RESULTADOS: return 'secondary';
      case AtendimentoStatus.AGUARDANDO_AVALIACAO_MEDICA: return 'default';
      case AtendimentoStatus.FINALIZADO: return 'success';
      default: return 'default';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div>
        <h3 className="font-semibold mb-4 text-lg border-b pb-2">Informações do Atendimento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Dados do Paciente</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Nome:</strong> {atendimento.NOME}</p>
                <p><strong>CPF:</strong> {atendimento.CPFFUNCIONARIO}</p>
                <p><strong>Data Nascimento:</strong> {atendimento.DATANASCIMENTO}</p>
                <p><strong>Matrícula:</strong> {atendimento.MATRICULAFUNCIONARIO || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Dados da Empresa</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Empresa:</strong> {atendimento.NOMEEMPRESA}</p>
                <p><strong>CNPJ:</strong> {atendimento.CNPJEMPRESA}</p>
                <p><strong>Cargo:</strong> {atendimento.NOMECARGO}</p>
                <p><strong>Setor:</strong> {atendimento.NOMESETOR}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Agendamento</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Data:</strong> {atendimento.DATAAGENDAMENTO}</p>
                <p><strong>Horário:</strong> {atendimento.HORARIO}</p>
                <p><strong>Unidade:</strong> {atendimento.UNIDADEATENDIMENTO}</p>
                <p><strong>Tipo Exame:</strong> {atendimento.TIPOEXAMENOME}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-gray-600 mb-2">Status</h4>
              <div className="space-y-2">
                <Chip color={getStatusColor(atendimento.ATENDIMENTOSTATUS)} size="lg">
                  {atendimento.ATENDIMENTOSTATUS.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </Chip>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* Exames - Tabela Simples */}
      <div>
        <h3 className="font-semibold mb-4 text-lg border-b pb-2">
          Exames ({atendimento.EXAMES.length})
        </h3>
        <ExamesTable exames={atendimento.EXAMES} />
      </div>
    </div>
  );
});

InformacoesGerais.displayName = 'InformacoesGerais';

// Componente para tabela de exames
const ExamesTable = memo(({ exames }: { exames: any[] }) => {
  const formatarDataExame = useCallback((dataExame: string | null) => {
    if (!dataExame) return '-';
    try {
      const data = new Date(dataExame);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }, []);

  const visualizarResultado = useCallback((url: string) => {
    if (url) window.open(url, '_blank');
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'FINALIZADO': return 'success';
      case 'PENDENTE': return 'warning';
      default: return 'default';
    }
  }, []);

  if (exames.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Nenhum exame encontrado para este atendimento.
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-96">
      <Table 
        aria-label="Tabela de exames"
        classNames={{
          base: "min-w-full",
        }}
      >
        <TableHeader>
          <TableColumn>EXAME</TableColumn>
          <TableColumn>GRUPO</TableColumn>
          <TableColumn>DATA</TableColumn>
          <TableColumn>PROFISSIONAL</TableColumn>
          <TableColumn>SALA</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>RESULTADO</TableColumn>
        </TableHeader>
        <TableBody>
          {exames.map((exame, index) => (
            <TableRow key={exame.sequencialResultadoExame || index}>
              <TableCell>
                <div className="max-w-xs">
                  <p className="font-medium text-sm">{exame.nomeExame}</p>
                  {exame.preparacao && (
                    <p className="text-xs text-gray-500 mt-1">
                      Prep: {exame.preparacao}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm">{exame.grupo}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <CalendarIcon size={14} className="text-gray-400" />
                  <span className="text-sm">{formatarDataExame(exame.dataExame)}</span>
                </div>
              </TableCell>
              <TableCell>
                {exame.profissional ? (
                  <div className="flex items-center gap-1">
                    <UserIcon size={14} className="text-gray-400" />
                    <span className="text-sm">{exame.profissional}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                {exame.sala ? (
                  <div className="flex items-center gap-1">
                    <MapPinIcon size={14} className="text-gray-400" />
                    <span className="text-sm">{exame.sala}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <Chip 
                  color={getStatusColor(exame.status)} 
                  size="sm"
                  className="text-xs"
                >
                  {exame.status}
                </Chip>
              </TableCell>
              <TableCell>
                {exame.url ? (
                  <Tooltip content="Visualizar resultado em PDF">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => visualizarResultado(exame.url)}
                    >
                      <FileTextIcon size={16} />
                    </Button>
                  </Tooltip>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});

ExamesTable.displayName = 'ExamesTable';

// Componente principal LazyModalContent
const LazyModalContent = memo(({ atendimento, onClose }: LazyModalContentProps) => {
  return (
    <>
      <ModalHeader>
        <h2 className="text-xl font-bold">Detalhes do Atendimento</h2>
      </ModalHeader>
      <ModalBody>
        <InformacoesGerais atendimento={atendimento} />
      </ModalBody>
      <ModalFooter>
        <Button variant="light" onPress={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </>
  );
});

LazyModalContent.displayName = 'LazyModalContent';

export default LazyModalContent;