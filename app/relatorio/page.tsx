// app/relatorios/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Select,
  SelectItem,
  DatePicker,
  DateValue,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Chip,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Tooltip,
  Skeleton
} from '@heroui/react';
import { SearchIcon, FilterIcon, DownloadIcon, EyeIcon, FileTextIcon, CalendarIcon, UserIcon, MapPinIcon, LoaderIcon, CheckIcon } from 'lucide-react';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { useAppData } from '../context/AppDataContext';
import { AtendimentoStatus } from '@/lib/scheduling/enum/scheduling.enum';

// Componente lazy para o conteúdo pesado do modal
const LazyModalContent = lazy(() => import('./LazyModalContent'));

// Interface Otimizada
interface OptimizedScheduling extends Scheduling {
  DATAAGENDAMENTO_DATE_OBJ: Date;
  SEARCH_INDEX: string;
}

// Hook para debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook para debounce do modal
const useModalDebounce = (delay: number = 100) => {
  const [isOpening, setIsOpening] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const openWithDebounce = useCallback((callback: () => void) => {
    setIsOpening(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback();
      setIsOpening(false);
    }, delay);
  }, [delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setIsOpening(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { isOpening, openWithDebounce, cancel };
};

// Componente skeleton para loading
const ModalSkeleton = () => (
  <div className="space-y-4">
    <ModalHeader>
      <Skeleton className="h-6 w-48 rounded-lg" />
    </ModalHeader>
    <ModalBody>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-2/3 rounded-lg" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-2/3 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </ModalBody>
    <ModalFooter>
      <Skeleton className="h-10 w-20 rounded-lg" />
    </ModalFooter>
  </div>
);

// Componente principal
export default function RelatoriosPage() {
  const { data } = useAppData();
  const appAtendimentos: Scheduling[] = data?.atendimentos ?? [];
  
  const [optimizedAtendimentos, setOptimizedAtendimentos] = useState<OptimizedScheduling[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    dataInicio: null as DateValue | null,
    dataFim: null as DateValue | null,
    empresa: '',
    exame: '',
    status: '',
    search: ''
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof filters>(filters);

  // Estados para selects
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [exames, setExames] = useState<string[]>([]);
  
  // Paginação
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // Modal de detalhes
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedAtendimento, setSelectedAtendimento] = useState<Scheduling | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Debounce para abertura do modal
  const { isOpening: isModalOpening, openWithDebounce: openModalWithDebounce } = useModalDebounce(150);

  // Estado para os atendimentos FILTRADOS
  const [filteredAtendimentos, setFilteredAtendimentos] = useState<OptimizedScheduling[]>([]);

  // 1. Carregar e otimizar dados iniciais
  useEffect(() => {
    if (appAtendimentos.length === 0) {
      setLoading(false);
      return;
    }

    const optimizeData = () => {
      const optimized = appAtendimentos.map((a: Scheduling) => {
        const searchIndex = [
          a.NOME?.toLowerCase() || '',
          a.CPFFUNCIONARIO || '',
          a.MATRICULAFUNCIONARIO?.toLowerCase() || '',
          a.NOMECARGO?.toLowerCase() || '',
          a.NOMEEMPRESA?.toLowerCase() || ''
        ].join('|');

        return {
          ...a,
          DATAAGENDAMENTO_DATE_OBJ: new Date(a.DATAAGENDAMENTO_DATE),
          SEARCH_INDEX: searchIndex
        };
      });

      setOptimizedAtendimentos(optimized);
      
      const empresasUnicas = [...new Set(appAtendimentos.map(a => a.NOMEEMPRESA).filter(Boolean))];
      const examesUnicos = [...new Set(appAtendimentos.flatMap(a => 
        a.EXAMES.map(e => e.nomeExame)
      ).filter(Boolean))];
      
      setEmpresas(empresasUnicas as string[]);
      setExames(examesUnicos as string[]);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        optimizeData();
        setLoading(false);
      });
    } else {
      setTimeout(() => {
        optimizeData();
        setLoading(false);
      }, 0);
    }
  }, [appAtendimentos]);

  // 2. Função de filtragem otimizada
  const applyFiltersFunction = useCallback((
    atendimentosList: OptimizedScheduling[], 
    currentFilters: typeof filters
  ) => {
    if (atendimentosList.length === 0) return [];

    let filtered = atendimentosList;

    const dataInicio = currentFilters.dataInicio ? new Date(currentFilters.dataInicio.toString()) : null;
    const dataFim = currentFilters.dataFim ? new Date(currentFilters.dataFim.toString()) : null;
    if (dataFim) dataFim.setHours(23, 59, 59, 999);

    if (dataInicio) {
      filtered = filtered.filter(a => a.DATAAGENDAMENTO_DATE_OBJ >= dataInicio);
    }

    if (dataFim) {
      filtered = filtered.filter(a => a.DATAAGENDAMENTO_DATE_OBJ <= dataFim);
    }

    if (currentFilters.empresa) {
      filtered = filtered.filter(a => a.NOMEEMPRESA === currentFilters.empresa);
    }

    if (currentFilters.exame) {
      filtered = filtered.filter(a => 
        a.EXAMES.some(e => e.nomeExame === currentFilters.exame)
      );
    }

    if (currentFilters.status) {
      filtered = filtered.filter(a => a.ATENDIMENTOSTATUS === currentFilters.status);
    }

    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(a => 
        a.SEARCH_INDEX.includes(searchLower)
      );
    }

    return filtered;
  }, []);

  // 3. Aplicar filtros quando o usuário clicar no botão
  const handleApplyFilters = useCallback(async () => {
    if (optimizedAtendimentos.length === 0) return;

    setIsFiltering(true);
    setShowResults(true);
    setAppliedFilters(filters);
    setPage(1);

    setTimeout(() => {
      const result = applyFiltersFunction(optimizedAtendimentos, filters);
      setFilteredAtendimentos(result);
      setIsFiltering(false);
    }, 50);
  }, [optimizedAtendimentos, filters, applyFiltersFunction]);

  // 4. Limpar filtros e resultados
  const handleClearFilters = useCallback(() => {
    setFilters({
      dataInicio: null,
      dataFim: null,
      empresa: '',
      exame: '',
      status: '',
      search: ''
    });
    setAppliedFilters({
      dataInicio: null,
      dataFim: null,
      empresa: '',
      exame: '',
      status: '',
      search: ''
    });
    setShowResults(false);
    setPage(1);
  }, []);

  // 5. Handler para mudanças rápidas nos filtros
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // 6. Calcular se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.dataInicio !== null ||
      filters.dataFim !== null ||
      filters.empresa !== '' ||
      filters.exame !== '' ||
      filters.status !== '' ||
      filters.search !== ''
    );
  }, [filters]);

  // 7. Função para visualizar detalhes - OTIMIZADA
  const viewDetails = useCallback((atendimento: Scheduling) => {
    setModalLoading(true);
    
    openModalWithDebounce(() => {
      setSelectedAtendimento(atendimento);
      setModalLoading(false);
      onOpen();
    });
  }, [onOpen, openModalWithDebounce]);

  // 8. Fechar modal - limpar estados
  const handleCloseModal = useCallback(() => {
    setSelectedAtendimento(null);
    onClose();
  }, [onClose]);

  // 9. Memoizar dados paginados
  const paginatedItems = useMemo(() => {
    if (!showResults) return [];
    const startIndex = (page - 1) * rowsPerPage;
    return filteredAtendimentos.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAtendimentos, page, rowsPerPage, showResults]);

  // 10. Memoizar cálculos de paginação
  const paginationInfo = useMemo(() => {
    if (!showResults) return { totalPages: 0, hasPagination: false };
    const totalPages = Math.ceil(filteredAtendimentos.length / rowsPerPage);
    return {
      totalPages,
      hasPagination: totalPages > 1
    };
  }, [filteredAtendimentos.length, rowsPerPage, showResults]);

  // 11. Exportar relatório
  const exportRelatorio = useCallback(async (formato: 'csv' | 'pdf') => {
    if (!showResults || filteredAtendimentos.length === 0) return;
    
    try {
      setExportLoading(true);
      
      if (formato === 'csv') {
        const headers = [
          'Data Agendamento',
          'Paciente',
          'CPF',
          'Empresa',
          'Cargo',
          'Tipo Exame',
          'Status',
          'Unidade'
        ];
        
        const csvData = filteredAtendimentos.map(a => [
          a.DATAAGENDAMENTO,
          a.NOME,
          a.CPFFUNCIONARIO,
          a.NOMEEMPRESA,
          a.NOMECARGO,
          a.TIPOEXAMENOME,
          a.ATENDIMENTOSTATUS,
          a.UNIDADEATENDIMENTO
        ].join(';'));
        
        const csvContent = [headers.join(';'), ...csvData].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-atendimentos-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const params = new URLSearchParams();
        if (appliedFilters.dataInicio) params.append('dataInicio', appliedFilters.dataInicio.toString());
        if (appliedFilters.dataFim) params.append('dataFim', appliedFilters.dataFim.toString());
        if (appliedFilters.empresa) params.append('empresa', appliedFilters.empresa);
        if (appliedFilters.exame) params.append('exame', appliedFilters.exame);
        if (appliedFilters.status) params.append('status', appliedFilters.status);
        
        window.open(`/api/relatorios/pdf?${params.toString()}`, '_blank');
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    } finally {
      setExportLoading(false);
    }
  }, [filteredAtendimentos, appliedFilters, showResults]);

  // 12. Função para obter a cor do status
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

  // 13. Renderização otimizada do modal
  const renderModalContent = useMemo(() => {
    if (!selectedAtendimento) return null;

    return (
      <Suspense fallback={<ModalSkeleton />}>
        <LazyModalContent
          atendimento={selectedAtendimento}
          onClose={handleCloseModal}
        />
      </Suspense>
    );
  }, [selectedAtendimento, handleCloseModal]);

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios de Atendimento</h1>
          <p className="text-gray-600">Configure os filtros e clique em "Aplicar Filtros" para ver os resultados</p>
        </div>
        {/* <div className="flex gap-2">
          <Button
            color="primary"
            variant="flat"
            startContent={<DownloadIcon size={16} />}
            isLoading={exportLoading}
            onPress={() => exportRelatorio('csv')}
            isDisabled={!showResults || filteredAtendimentos.length === 0}
          >
            Exportar CSV
          </Button>
          <Button
            color="primary"
            startContent={<DownloadIcon size={16} />}
            isLoading={exportLoading}
            onPress={() => exportRelatorio('pdf')}
            isDisabled={!showResults || filteredAtendimentos.length === 0}
          >
            Exportar PDF
          </Button>
        </div> */}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Filtros</h2>
          </div>
          <div className="flex gap-2">
            <Button
              color="primary"
              startContent={<CheckIcon size={16} />}
              onPress={handleApplyFilters}
              isLoading={isFiltering}
              isDisabled={!hasActiveFilters}
            >
              Aplicar Filtros
            </Button>
            <Button
              variant="light"
              onPress={handleClearFilters}
            >
              Limpar Tudo
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DatePicker
              label="Data Início"
              value={filters.dataInicio}
              onChange={(value) => handleFilterChange('dataInicio', value)}
            />
            
            <DatePicker
              label="Data Fim"
              value={filters.dataFim}
              onChange={(value) => handleFilterChange('dataFim', value)}
            />
            
            <Select
              label="Empresa"
              selectedKeys={filters.empresa ? [filters.empresa] : []}
              onSelectionChange={(keys) => handleFilterChange('empresa', Array.from(keys)[0] || '')}
            >
              {empresas.map(empresa => (
                <SelectItem key={empresa}>
                  {empresa}
                </SelectItem>
              ))}
            </Select>
            
            <Select
              label="Exame"
              selectedKeys={filters.exame ? [filters.exame] : []}
              onSelectionChange={(keys) => handleFilterChange('exame', Array.from(keys)[0] || '')}
            >
              {exames.map(exame => (
                <SelectItem key={exame}>
                  {exame}
                </SelectItem>
              ))}
            </Select>
            
            <Select
              label="Status"
              selectedKeys={filters.status ? [filters.status] : []}
              onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
            >
              {Object.values(AtendimentoStatus).map(status => (
                <SelectItem key={status}>
                  {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </Select>
            
            <div className="lg:col-span-2">
              <Input
                placeholder="Buscar por paciente, CPF, matrícula ou cargo..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                startContent={<SearchIcon size={16} className="text-gray-400" />}
                isClearable
                onClear={() => handleFilterChange('search', '')}
              />
            </div>
          </div>

          {hasActiveFilters && !showResults && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <FilterIcon size={16} />
                <span className="text-sm font-medium">
                  Filtros configurados. Clique em "Aplicar Filtros" para ver os resultados.
                </span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tabela de Resultados - Só mostra quando há resultados */}
      {showResults && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Resultados</h2>
            <div className="text-sm text-gray-500">
              Mostrando {paginatedItems.length} de {filteredAtendimentos.length} registros
            </div>
          </CardHeader>
          <CardBody>
            {isFiltering ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <div className="overflow-auto">
                  <Table aria-label="Tabela de atendimentos">
                    <TableHeader>
                      <TableColumn>DATA</TableColumn>
                      <TableColumn>PACIENTE</TableColumn>
                      <TableColumn>EMPRESA</TableColumn>
                      <TableColumn>CARGO</TableColumn>
                      <TableColumn>TIPO EXAME</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>UNIDADE</TableColumn>
                      <TableColumn>AÇÕES</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((atendimento) => (
                        <TableRow key={atendimento._id || atendimento.CODIGOPRONTUARIO}>
                          <TableCell>{atendimento.DATAAGENDAMENTO}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{atendimento.NOME}</p>
                              <p className="text-sm text-gray-500">{atendimento.CPFFUNCIONARIO}</p>
                            </div>
                          </TableCell>
                          <TableCell>{atendimento.NOMEEMPRESA}</TableCell>
                          <TableCell>{atendimento.NOMECARGO}</TableCell>
                          <TableCell>{atendimento.TIPOEXAMENOME}</TableCell>
                          <TableCell>
                            <Chip color={getStatusColor(atendimento.ATENDIMENTOSTATUS)} size="sm">
                              {atendimento.ATENDIMENTOSTATUS.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </Chip>
                          </TableCell>
                          <TableCell>{atendimento.UNIDADEATENDIMENTO}</TableCell>
                          <TableCell>
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              onPress={() => viewDetails(atendimento)}
                            >
                              <EyeIcon size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {paginationInfo.hasPagination && (
                  <div className="flex justify-center mt-4">
                    <Pagination
                      page={page}
                      total={paginationInfo.totalPages}
                      onChange={setPage}
                      showControls
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Estado inicial - instruções */}
      {!showResults && !loading && (
        <Card>
          <CardBody className="text-center py-12">
            <FilterIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Configure os filtros para ver os resultados
            </h3>
            <p className="text-gray-500">
              Selecione os critérios de filtragem e clique em "Aplicar Filtros" para gerar o relatório.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Modal de Detalhes - OTIMIZADO */}
      <Modal 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          wrapper: "z-[1000]"
        }}
      >
        <ModalContent>
          {(modalLoading || isModalOpening) ? (
            <ModalBody className="py-8">
              <ModalSkeleton />
            </ModalBody>
          ) : (
            renderModalContent
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}