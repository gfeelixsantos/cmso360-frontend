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
  Skeleton,
  DatePicker,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Autocomplete
} from '@heroui/react';
import { SearchIcon, FilterIcon, EyeIcon, CheckIcon, CalendarIcon, XIcon } from 'lucide-react';
import { Scheduling } from '@/lib/scheduling/interface/scheduling';
import { AtendimentoStatus } from '@/lib/scheduling/enum/scheduling.enum';
import { NEST_SCHEDULINGS_ALL } from '@/config/constants';
import { HeaderApp } from '@/components/shared/HeaderApp';
import { formatCPF, logout, ordemAlfabetica } from '@/lib/utils';
import { useRouter } from "next/navigation";

// Componente lazy para o conteúdo pesado do modal
const LazyModalContent = lazy(() => import('./LazyModalContent'));

// Interface Otimizada
interface OptimizedScheduling extends Scheduling {
  DATAAGENDAMENTO_DATE_OBJ: Date;
  SEARCH_INDEX: string;
  PROFISSIONAIS: string[];
  SALAS: string[];
  GRUPOS_EXAMES: string[];
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
  const router = useRouter();
  const [appAtendimentos, setAppAtendimentos] = useState<Scheduling[]>([]);
  const [optimizedAtendimentos, setOptimizedAtendimentos] = useState<OptimizedScheduling[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Filtros atualizados
  const [filters, setFilters] = useState({
    dataInicio: null as any,
    dataFim: null as any,
    empresa: '',
    grupoExame: '',
    status: '',
    search: '',
    profissional: '',
    sala: ''
  });

  const [appliedFilters, setAppliedFilters] = useState<typeof filters>(filters);

  // Estados para selects
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [gruposExames, setGruposExames] = useState<string[]>([]);
  const [profissionais, setProfissionais] = useState<string[]>([]);
  const [salas, setSalas] = useState<string[]>([]);
  
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

  // Carregar dados iniciais
  const getData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(NEST_SCHEDULINGS_ALL, { cache: "no-store" });
  
      if (!response.ok) {
        console.error("Erro ao buscar dados iniciais:", response.statusText);
        return null;
      }
  
      const json: Scheduling[] = await response.json();
      const jsonOrdened = json.sort((a,b) => a.NOME.localeCompare(b.NOME, "pt-BR")); 
      setAppAtendimentos(jsonOrdened);
  
    } catch (err) {
      console.error("Erro ao carregar dados iniciais:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Carregar e otimizar dados iniciais
  useEffect(() => {
    getData();
  }, [getData]);

  useEffect(() => {
    if (appAtendimentos.length === 0) return;

    const optimizeData = () => {
      const optimized = appAtendimentos.map((a: Scheduling) => {
        // Extrair profissionais e salas únicos dos exames
        const profissionaisUnicos = [...new Set(a.EXAMES.map(e => e.profissional).filter(Boolean))];
        const salasUnicas = [...new Set(a.EXAMES.map(e => e.sala).filter(Boolean))];
        const gruposUnicos = [...new Set(a.EXAMES.map(e => e.grupo).filter(Boolean))];

        const searchIndex = [
          a.NOME?.toLowerCase() || '',
          a.CPFFUNCIONARIO || '',
          a.MATRICULAFUNCIONARIO?.toLowerCase() || '',
          a.NOMECARGO?.toLowerCase() || '',
          a.NOMEEMPRESA?.toLowerCase() || '',
          ...profissionaisUnicos.map(p => p?.toLowerCase()),
          ...salasUnicas.map(s => s?.toLowerCase()),
          ...gruposUnicos.map(g => g.toLowerCase())
        ].join('|');

        return {
          ...a,
          DATAAGENDAMENTO_DATE_OBJ: new Date(a.DATAAGENDAMENTO_DATE),
          SEARCH_INDEX: searchIndex,
          PROFISSIONAIS: profissionaisUnicos,
          SALAS: salasUnicas,
          GRUPOS_EXAMES: gruposUnicos
        } as OptimizedScheduling;
      });

      setOptimizedAtendimentos(optimized);
      
      // Extrair opções únicas para filtros
      const empresasUnicas = [...new Set(appAtendimentos.map(a => a.NOMEEMPRESA).filter(Boolean))];
      const gruposUnicos = [...new Set(appAtendimentos.flatMap(a => a.EXAMES.map(e => e.grupo)).filter(Boolean))];
      const profissionaisUnicos = [...new Set(appAtendimentos.flatMap(a => a.EXAMES.map(e => e.profissional)).filter(Boolean))];
      const salasUnicas = [...new Set(appAtendimentos.flatMap(a => a.EXAMES.map(e => e.sala)).filter(Boolean))];
      
      const empresasOrdenadas = ordemAlfabetica(empresasUnicas)
      const profissionaisOrdenados = ordemAlfabetica(profissionaisUnicos as string[])
      const salasOrdenadas = salasUnicas ?? ordemAlfabetica(salasUnicas as string[])

      setEmpresas(empresasOrdenadas as string[]);
      setGruposExames(gruposUnicos as string[]);
      setProfissionais(profissionaisOrdenados as string[]);
      setSalas(salasOrdenadas as string[]);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        optimizeData();
      });
    } else {
      setTimeout(() => {
        optimizeData();
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

    // Filtro por data
    if (currentFilters.dataInicio) {
      const dataInicio = new Date(currentFilters.dataInicio.toString());
      filtered = filtered.filter(a => a.DATAAGENDAMENTO_DATE_OBJ >= dataInicio);
    }

    if (currentFilters.dataFim) {
      const dataFim = new Date(currentFilters.dataFim.toString());
      dataFim.setHours(23, 59, 59, 999);
      filtered = filtered.filter(a => a.DATAAGENDAMENTO_DATE_OBJ <= dataFim);
    }

    // Filtro por empresa
    if (currentFilters.empresa) {
      filtered = filtered.filter(a => a.NOMEEMPRESA === currentFilters.empresa);
    }

    // Filtro por grupo de exame (ATUALIZADO)
    if (currentFilters.grupoExame) {
      filtered = filtered.filter(a => 
        a.GRUPOS_EXAMES.includes(currentFilters.grupoExame)
      );
    }

    // Filtro por status
    if (currentFilters.status) {
      filtered = filtered.filter(a => a.ATENDIMENTOSTATUS === currentFilters.status);
    }

    // Filtro por profissional (NOVO)
    if (currentFilters.profissional) {
      filtered = filtered.filter(a => 
        a.PROFISSIONAIS.includes(currentFilters.profissional)
      );
    }

    // Filtro por sala (NOVO)
    if (currentFilters.sala) {
      filtered = filtered.filter(a => 
        a.SALAS.includes(currentFilters.sala)
      );
    }

    // Filtro de busca geral (incluindo nome do funcionário)
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(a => 
        a.SEARCH_INDEX.includes(searchLower) ||
        a.NOME?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, []);

  // 3. Aplicar filtros quando o usuário clicar no botão
  const handleApplyFilters = useCallback(() => {
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
      grupoExame: '',
      status: '',
      search: '',
      profissional: '',
      sala: ''
    });
    setAppliedFilters({
      dataInicio: null,
      dataFim: null,
      empresa: '',
      grupoExame: '',
      status: '',
      search: '',
      profissional: '',
      sala: ''
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
    return Object.values(filters).some(value => 
      value !== null && value !== '' && 
      !(value instanceof Date && isNaN(value.getTime()))
    );
  }, [filters]);

  // 7. Função para visualizar detalhes
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

  // 9. Atualizar atendimento após upload
  const handleUpdateSchedulingFromModal = useCallback((updated: Scheduling) => {
    setAppAtendimentos(prev => {
      const foundIndex = prev.findIndex(p => (p._id && updated._id && p._id === updated._id) || (p.CODIGOPRONTUARIO && updated.CODIGOPRONTUARIO && p.CODIGOPRONTUARIO === updated.CODIGOPRONTUARIO));
      if (foundIndex === -1) return prev;
      const copy = [...prev];
      copy[foundIndex] = updated;
      return copy;
    });
  }, []);

  // 10. Memoizar dados paginados
  const paginatedItems = useMemo(() => {
    if (!showResults) return [];
    const startIndex = (page - 1) * rowsPerPage;
    return filteredAtendimentos.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAtendimentos, page, rowsPerPage, showResults]);

  // 11. Memoizar cálculos de paginação
  const paginationInfo = useMemo(() => {
    if (!showResults) return { totalPages: 0, hasPagination: false };
    const totalPages = Math.ceil(filteredAtendimentos.length / rowsPerPage);
    return {
      totalPages,
      hasPagination: totalPages > 1
    };
  }, [filteredAtendimentos.length, rowsPerPage, showResults]);

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
          onUpdateScheduling={handleUpdateSchedulingFromModal}
        />
      </Suspense>
    );
  }, [selectedAtendimento, handleCloseModal, handleUpdateSchedulingFromModal]);

  // 14. Contador de filtros ativos
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value !== null && value !== '' && 
      !(value instanceof Date && isNaN(value.getTime()))
    ).length;
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 mb-8">
      <HeaderApp onLogout={() => { logout(); router.push("/"); }} children={<h2>Relatórios de Atendimento</h2>} />

      {/* Filtros - Design Conceitual do Modal */}
      <Card className='mx-6 mb-6 mt-6 border border-gray-200 shadow-sm'>
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Filtros de atendimento</h2>
              <p className="text-sm text-gray-500">
                {activeFiltersCount > 0 
                  ? `${activeFiltersCount} filtro(s) ativo(s)` 
                  : 'Configure os filtros para buscar atendimentos'
                }
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              color="success"
              startContent={<CheckIcon size={16} />}
              onPress={handleApplyFilters}
              isLoading={isFiltering}
              isDisabled={!hasActiveFilters}
              className="font-medium text-white"
            >
              Aplicar Filtros
            </Button>
            <Button
              variant="light"
              onPress={handleClearFilters}
              startContent={<XIcon size={16} />}
              isDisabled={!hasActiveFilters}
            >
              Limpar
            </Button>
          </div>
        </CardHeader>
        <CardBody className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Busca por Nome do Funcionário (ATUALIZADO) */}
            <div className="lg:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-700">Buscar por Funcionário</label>
              <Input
                placeholder="Digite o nome do funcionário..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                startContent={<SearchIcon size={16} className="text-gray-400" />}
                isClearable
                onClear={() => handleFilterChange('search', '')}
                size="lg"
              />
            </div>
            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data Início</label>
              <DatePicker
                size="sm"
                value={filters.dataInicio}
                onChange={(value) => handleFilterChange('dataInicio', value)}
                label=" "
                granularity="day"
                hideTimeZone
              />
            </div>


            {/* Empresa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Empresa</label>
              <Autocomplete
                multiple={true}
                size="lg"
                selectedKey={filters.empresa || undefined}
                onSelectionChange={(key) => handleFilterChange('empresa', key?.toString() || '')}
                className="w-full"
              >
                {empresas.map((empresa) => (
                  <SelectItem key={empresa} textValue={empresa}>
                    {empresa}
                  </SelectItem>
                ))}
              </Autocomplete>
            </div>


            {/* Grupo de Exame (ATUALIZADO) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Exame</label>
              <Select
                size="lg"
                selectedKeys={filters.grupoExame ? [filters.grupoExame] : []}
                onSelectionChange={(keys) => handleFilterChange('grupoExame', Array.from(keys)[0] || '')}
                className="w-full"
              >
                {gruposExames.map(grupo => (
                  <SelectItem key={grupo}>
                    {grupo}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Data Fim</label>
              <DatePicker
                size="sm"
                value={filters.dataFim}
                onChange={(value) => handleFilterChange('dataFim', value)}
                label=" "
                granularity="day"
                hideTimeZone
              />
            </div>


            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select
                size="lg"
                selectedKeys={filters.status ? [filters.status] : []}
                onSelectionChange={(keys) => handleFilterChange('status', Array.from(keys)[0] || '')}
                className="w-full"
              >
                {Object.values(AtendimentoStatus).map(status => (
                  <SelectItem key={status}>
                    {status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Profissional (NOVO) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Profissional</label>
              <Select
                size="lg"
                selectedKeys={filters.profissional ? [filters.profissional] : []}
                onSelectionChange={(keys) => handleFilterChange('profissional', Array.from(keys)[0] || '')}
                className="w-full"
              >
                {profissionais.map(profissional => (
                  <SelectItem key={profissional}>
                    {profissional}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Sala (NOVO) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sala</label>
              <Select
                size="lg"
                selectedKeys={filters.sala ? [filters.sala] : []}
                onSelectionChange={(keys) => handleFilterChange('sala', Array.from(keys)[0] || '')}
                className="w-full"
              >
                {salas.map(sala => (
                  <SelectItem key={sala}>
                    {sala}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabela de Resultados - Layout Compacto */}
      {showResults && (
        <Card className='mx-6 mb-6 mt-6 p-2 border border-gray-200 shadow-sm'>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Resultados</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredAtendimentos.length} atendimento(s) encontrado(s)
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Página {page} de {paginationInfo.totalPages}</span>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {isFiltering ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" label="Aplicando filtros..." />
              </div>
            ) : (
              <>
                <div className="overflow-auto">
                  <Table 
                    aria-label="Tabela de atendimentos"
                    removeWrapper
                    classNames={{
                      base: "min-w-full",
                      th: "bg-gray-50 text-gray-700 font-semibold text-xs px-3 py-2 border-b",
                      td: "px-3 py-2 border-b border-gray-100 text-sm",
                      tr: "hover:bg-gray-50 transition-colors"
                    }}
                  >
                    <TableHeader>
                      <TableColumn className="w-50">FUNCIONÁRIO</TableColumn>
                      <TableColumn className="w-50">EMPRESA</TableColumn>
                      <TableColumn className="w-40">CARGO</TableColumn>
                      <TableColumn className="w-30">EXAME</TableColumn>
                      <TableColumn className="w-10">STATUS</TableColumn>
                      <TableColumn className="w-20">UNIDADE</TableColumn>
                      <TableColumn className="w-10">AÇÕES</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {paginatedItems.map((atendimento) => (
                        <TableRow key={atendimento._id || atendimento.CODIGOPRONTUARIO}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-xs text-gray-900">{atendimento.NOME}</p>
                              <p className="text-xs text-gray-500">CPF: {formatCPF(atendimento.CPFFUNCIONARIO)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-700">{atendimento.NOMEEMPRESA}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-gray-700">{atendimento.NOMECARGO}</span>
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className="text-sm text-gray-700">{atendimento.TIPOEXAMENOME}</span>
                              <span className="text-xs text-gray-500">{atendimento.DATAAGENDAMENTO} - {atendimento.HORARIO}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              color={getStatusColor(atendimento.ATENDIMENTOSTATUS)} 
                              size="sm"
                              variant="flat"
                              classNames={{
                                content: "text-xs font-medium"
                              }}
                            >
                              {atendimento.ATENDIMENTOSTATUS.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-700">{atendimento.UNIDADEATENDIMENTO}</span>
                          </TableCell>
                          <TableCell>
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              onPress={() => viewDetails(atendimento)}
                              className="text-blue-600 hover:text-blue-700"
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
                  <div className="flex justify-center p-4 border-t border-gray-100">
                    <Pagination
                      page={page}
                      total={paginationInfo.totalPages}
                      onChange={setPage}
                      showControls
                      size="sm"
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
        <Card className="mx-6 border border-gray-200 shadow-sm">
          <CardBody className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FilterIcon size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Nenhum filtro aplicado
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Configure os filtros acima e clique em "Aplicar Filtros" para visualizar os atendimentos.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Loading inicial */}
      {loading && (
        <Card className="mx-6">
          <CardBody className="text-center py-16">
            <Spinner size="lg" label="Carregando atendimentos..." />
          </CardBody>
        </Card>
      )}

      {/* Modal de Detalhes */}
      <Modal 
        isOpen={isOpen} 
        onClose={handleCloseModal} 
        size="5xl"
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