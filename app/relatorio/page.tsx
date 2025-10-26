"use client";

import { useState, useEffect } from 'react';

interface Exame {
  codigoExame: string;
  nomeExame: string;
  status: string;
  dataExame: string | null;
  preparacao: string;
  profissional: string;
  sala: string;
  sequencialResultadoExame: string;
  url: string;
}

interface Funcionario {
  _id: string;
  SCHEDULINGCODE: string;
  NOME: string;
  CPFFUNCIONARIO: string;
  NOMESETOR: string;
  DATAAGENDAMENTO: string;
  HORARIO: string;
  UNIDADEATENDIMENTO: string;
  TIPOEXAMENOME: string;
  OBSERVACOES: string;
  EXAMES: Exame[];
  ANEXOS: string[];
}

interface UploadState {
  [key: string]: {
    [codigoExame: string]: {
      file: File | null;
      isUploading: boolean;
      progress: number;
    }
  };
}

// Mapeamento de tipos de exame para melhor organização
const TIPOS_EXAME = {
  CLINICO: {
    codigo: 'clinico',
    nome: 'Avaliação Clínica Ocupacional',
    podeUpload: false // Já é salvo automaticamente
  },
  AUDIOMETRIA: {
    codigo: 'audiometria',
    nome: 'Audiometria',
    podeUpload: false // Já é salvo automaticamente
  },
  RAIO_X: {
    codigo: 'raio-x',
    nome: 'Raio-X de Tórax',
    podeUpload: true
  },
  GLICEMIA: {
    codigo: 'glicemia',
    nome: 'Glicemia',
    podeUpload: true
  },
  HEMOGRAMA: {
    codigo: 'hemograma',
    nome: 'Hemograma',
    podeUpload: true
  },
  ESPIROMETRIA: {
    codigo: 'espirometria',
    nome: 'Espirometria',
    podeUpload: true
  }
};

export default function ResultadosExames() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStates, setUploadStates] = useState<UploadState>({});
  const [filtro, setFiltro] = useState('');
  const [filtroApenasPendentes, setFiltroApenasPendentes] = useState(true);
  const [exameSelecionado, setExameSelecionado] = useState<{funcionarioId: string, codigoExame: string} | null>(null);

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  const carregarFuncionarios = async () => {
    try {
      // Simulação de dados com múltiplos exames
      const mockData: Funcionario[] = [
        {
          _id: "68d53f776d0467765764cce9",
          SCHEDULINGCODE: "6512872603",
          NOME: "GABRIEL SANCHEZ DIOGO",
          CPFFUNCIONARIO: "54839170819",
          NOMESETOR: "FURAÇÃO",
          DATAAGENDAMENTO: "17/10/2025",
          HORARIO: "09:30",
          UNIDADEATENDIMENTO: "RIO CLARO",
          TIPOEXAMENOME: "RETORNO TRABALHO",
          OBSERVACOES: "ENVIAR O RESULTADO DO ASO ASSIM QUE O FUNCIONÁRIO SAIR DO EXAME, PARA SABERMOS SE O MESMO ESTARÁ APTO PARA RETORNAR AO TRABALHO NESTA MESMA DATA (17/10).",
          EXAMES: [
            {
              codigoExame: "clinico",
              nomeExame: "Avaliação Clínica Ocupacional (Anamnese e Exame físico) (Cód. eSocial - 0295)",
              status: "CONCLUIDO",
              dataExame: "17/10/2025",
              preparacao: "",
              profissional: "Dr. Carlos Silva",
              sala: "Sala 01",
              sequencialResultadoExame: "649729702",
              url: "/resultados/exame_clinico_649729702.pdf"
            },
            {
              codigoExame: "audiometria",
              nomeExame: "Audiometria",
              status: "CONCLUIDO",
              dataExame: "17/10/2025",
              preparacao: "",
              profissional: "Dra. Ana Santos",
              sala: "Sala 02",
              sequencialResultadoExame: "649729703",
              url: "/resultados/audiometria_649729703.pdf"
            },
            {
              codigoExame: "raio-x",
              nomeExame: "Raio-X de Tórax",
              status: "PENDENTE",
              dataExame: "17/10/2025",
              preparacao: "Jejum não necessário",
              profissional: "",
              sala: "Sala 03",
              sequencialResultadoExame: "649729704",
              url: ""
            },
            {
              codigoExame: "glicemia",
              nomeExame: "Glicemia",
              status: "PENDENTE",
              dataExame: "17/10/2025",
              preparacao: "Jejum de 8 horas",
              profissional: "",
              sala: "",
              sequencialResultadoExame: "649729705",
              url: ""
            },
            {
              codigoExame: "hemograma",
              nomeExame: "Hemograma Completo",
              status: "PENDENTE",
              dataExame: "17/10/2025",
              preparacao: "Jejum de 8 horas",
              profissional: "",
              sala: "",
              sequencialResultadoExame: "649729706",
              url: ""
            },
            {
              codigoExame: "espirometria",
              nomeExame: "Espirometria",
              status: "PENDENTE",
              dataExame: "17/10/2025",
              preparacao: "Não fumar 24h antes do exame",
              profissional: "",
              sala: "Sala 04",
              sequencialResultadoExame: "649729707",
              url: ""
            }
          ],
          ANEXOS: []
        }
      ];
      
      setFuncionarios(mockData);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (funcionarioId: string, codigoExame: string, file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione apenas arquivos PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('O arquivo deve ter no máximo 10MB.');
      return;
    }

    setUploadStates(prev => ({
      ...prev,
      [funcionarioId]: {
        ...prev[funcionarioId],
        [codigoExame]: {
          file,
          isUploading: false,
          progress: 0
        }
      }
    }));
  };

  const handleUpload = async (funcionario: Funcionario, codigoExame: string) => {
    const uploadState = uploadStates[funcionario._id]?.[codigoExame];
    if (!uploadState?.file) return;

    setUploadStates(prev => ({
      ...prev,
      [funcionario._id]: {
        ...prev[funcionario._id],
        [codigoExame]: {
          ...prev[funcionario._id]?.[codigoExame],
          isUploading: true,
          progress: 0
        }
      }
    }));

    try {
      const formData = new FormData();
      formData.append('file', uploadState.file);
      formData.append('schedulingCode', funcionario.SCHEDULINGCODE);
      formData.append('codigoExame', codigoExame);
      
      const exame = funcionario.EXAMES.find(e => e.codigoExame === codigoExame);
      if (exame) {
        formData.append('sequencialResultadoExame', exame.sequencialResultadoExame);
      }

      // Simulação de upload - substitua pela sua API real
      await new Promise(resolve => {
        const interval = setInterval(() => {
          setUploadStates(prev => {
            const currentProgress = (prev[funcionario._id]?.[codigoExame]?.progress || 0) + 10;
            if (currentProgress >= 100) {
              clearInterval(interval);
              resolve(null);
              return {
                ...prev,
                [funcionario._id]: {
                  ...prev[funcionario._id],
                  [codigoExame]: {
                    ...prev[funcionario._id]?.[codigoExame],
                    isUploading: false,
                    progress: 100
                  }
                }
              };
            }
            return {
              ...prev,
              [funcionario._id]: {
                ...prev[funcionario._id],
                [codigoExame]: {
                  ...prev[funcionario._id]?.[codigoExame],
                  progress: currentProgress
                }
              }
            };
          });
        }, 200);
      });

      // Atualizar lista após upload bem-sucedido
      await carregarFuncionarios();
      
      // Limpar estado de upload após 2 segundos
      setTimeout(() => {
        setUploadStates(prev => {
          const newState = { ...prev };
          if (newState[funcionario._id]?.[codigoExame]) {
            delete newState[funcionario._id][codigoExame];
          }
          return newState;
        });
      }, 2000);

      alert('Resultado enviado com sucesso!');

    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload do arquivo. Tente novamente.');
      setUploadStates(prev => ({
        ...prev,
        [funcionario._id]: {
          ...prev[funcionario._id],
          [codigoExame]: {
            ...prev[funcionario._id]?.[codigoExame],
            isUploading: false,
            progress: 0
          }
        }
      }));
    }
  };

  const funcionariosFiltrados = funcionarios.filter(funcionario => {
    const matchesSearch = funcionario.NOME.toLowerCase().includes(filtro.toLowerCase()) ||
                         funcionario.CPFFUNCIONARIO.includes(filtro);
    
    if (filtroApenasPendentes) {
      return matchesSearch && funcionario.EXAMES.some(exame => 
        exame.status === 'PENDENTE' && TIPOS_EXAME[Object.keys(TIPOS_EXAME).find(key => 
          TIPOS_EXAME[key as keyof typeof TIPOS_EXAME].codigo === exame.codigoExame
        ) as keyof typeof TIPOS_EXAME]?.podeUpload
      );
    }
    
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return 'bg-green-100 text-green-800';
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'EM_ANDAMENTO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return 'Concluído';
      case 'PENDENTE':
        return 'Pendente';
      case 'EM_ANDAMENTO':
        return 'Em Andamento';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resultados de Exames</h1>
          <p className="mt-2 text-sm text-gray-600">
            Acompanhe e envie os resultados dos exames laboratoriais e de imagem
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar funcionário
              </label>
              <input
                type="text"
                id="search"
                placeholder="Nome ou CPF..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filtroApenasPendentes}
                  onChange={(e) => setFiltroApenasPendentes(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Mostrar apenas com pendências</span>
              </label>
            </div>

            <div className="flex items-end justify-end">
              <span className="text-sm text-gray-500">
                {funcionariosFiltrados.length} funcionário(s) encontrado(s)
              </span>
            </div>
          </div>
        </div>

        {/* Lista de Funcionários */}
        <div className="space-y-6">
          {funcionariosFiltrados.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Nenhum funcionário encontrado.</p>
            </div>
          ) : (
            funcionariosFiltrados.map((funcionario) => (
              <FuncionarioCard
                key={funcionario._id}
                funcionario={funcionario}
                uploadStates={uploadStates[funcionario._id] || {}}
                onFileSelect={(codigoExame, file) => handleFileSelect(funcionario._id, codigoExame, file)}
                onUpload={(codigoExame) => handleUpload(funcionario, codigoExame)}
                exameSelecionado={exameSelecionado}
                onSelecionarExame={(codigoExame) => setExameSelecionado(
                  exameSelecionado?.codigoExame === codigoExame && exameSelecionado.funcionarioId === funcionario._id 
                    ? null 
                    : { funcionarioId: funcionario._id, codigoExame }
                )}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para cada card de funcionário
interface FuncionarioCardProps {
  funcionario: Funcionario;
  uploadStates: { [codigoExame: string]: any };
  onFileSelect: (codigoExame: string, file: File) => void;
  onUpload: (codigoExame: string) => void;
  exameSelecionado: {funcionarioId: string, codigoExame: string} | null;
  onSelecionarExame: (codigoExame: string) => void;
}

function FuncionarioCard({ 
  funcionario, 
  uploadStates, 
  onFileSelect, 
  onUpload,
  exameSelecionado,
  onSelecionarExame
}: FuncionarioCardProps) {
  
  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return 'bg-green-100 text-green-800';
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'EM_ANDAMENTO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONCLUIDO':
        return 'Concluído';
      case 'PENDENTE':
        return 'Pendente';
      case 'EM_ANDAMENTO':
        return 'Em Andamento';
      default:
        return status;
    }
  };

  const examesParaUpload = funcionario.EXAMES.filter(exame => 
    Object.values(TIPOS_EXAME).find(tipo => 
      tipo.codigo === exame.codigoExame && tipo.podeUpload
    )
  );

  const examesAutomaticos = funcionario.EXAMES.filter(exame => 
    Object.values(TIPOS_EXAME).find(tipo => 
      tipo.codigo === exame.codigoExame && !tipo.podeUpload
    )
  );

  const isExameSelecionado = (codigoExame: string) => {
    return exameSelecionado?.funcionarioId === funcionario._id && exameSelecionado.codigoExame === codigoExame;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header do Card */}
      <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{funcionario.NOME}</h3>
            <p className="text-sm text-gray-600 mt-1">
              CPF: {formatarCPF(funcionario.CPFFUNCIONARIO)} | 
              Setor: {funcionario.NOMESETOR} | 
              Data: {funcionario.DATAAGENDAMENTO} às {funcionario.HORARIO}
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500 mb-1">
              Código: {funcionario.SCHEDULINGCODE}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {funcionario.TIPOEXAMENOME}
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Exames Automáticos (já salvos) */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Exames Automáticos</h4>
            <div className="space-y-2">
              {examesAutomaticos.map((exame) => (
                <div key={exame.codigoExame} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {Object.values(TIPOS_EXAME).find(t => t.codigo === exame.codigoExame)?.nome || exame.nomeExame}
                    </p>
                    <p className="text-xs text-gray-500">{exame.profissional}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exame.status)}`}>
                      {getStatusText(exame.status)}
                    </span>
                    {exame.url && (
                      <a 
                        href={exame.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        title="Visualizar resultado"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exames para Upload */}
          <div className="xl:col-span-2">
            <h4 className="font-medium text-gray-900 mb-3">Exames para Upload de Resultado</h4>
            <div className="space-y-4">
              {examesParaUpload.map((exame) => {
                const uploadState = uploadStates[exame.codigoExame];
                const tipoExame = Object.values(TIPOS_EXAME).find(t => t.codigo === exame.codigoExame);
                
                return (
                  <div 
                    key={exame.codigoExame} 
                    className={`border rounded-lg transition-all duration-200 ${
                      isExameSelecionado(exame.codigoExame) 
                        ? 'border-blue-500 ring-2 ring-blue-100' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => onSelecionarExame(exame.codigoExame)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {tipoExame?.nome || exame.nomeExame}
                          </h5>
                          <p className="text-sm text-gray-500 mt-1">
                            {exame.preparacao && (
                              <span className="block">Preparo: {exame.preparacao}</span>
                            )}
                            {exame.sala && (
                              <span className="block">Local: {exame.sala}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exame.status)}`}>
                            {getStatusText(exame.status)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelecionarExame(exame.codigoExame);
                            }}
                            className={`p-1 rounded ${
                              isExameSelecionado(exame.codigoExame) 
                                ? 'text-blue-600 bg-blue-50' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Área de Upload (expandida) */}
                    {isExameSelecionado(exame.codigoExame) && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        {exame.url ? (
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center">
                              <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-green-700">Resultado já enviado</span>
                            </div>
                            <a 
                              href={exame.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                            >
                              Visualizar
                            </a>
                          </div>
                        ) : !uploadState ? (
                          <UploadArea
                            exame={exame}
                            onFileSelect={(file) => onFileSelect(exame.codigoExame, file)}
                          />
                        ) : (
                          <UploadProgress
                            exame={exame}
                            uploadState={uploadState}
                            onUpload={() => onUpload(exame.codigoExame)}
                            onCancel={() => onFileSelect(exame.codigoExame, null as any)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Observações */}
        {funcionario.OBSERVACOES && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-md">
            <h5 className="font-medium text-orange-800 text-sm mb-1">Observações:</h5>
            <p className="text-orange-700 text-sm">{funcionario.OBSERVACOES}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente para área de upload
interface UploadAreaProps {
  exame: Exame;
  onFileSelect: (file: File) => void;
}

function UploadArea({ exame, onFileSelect }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center">
        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm text-gray-600 mb-2">
          Arraste o resultado do {exame.nomeExame} em PDF ou clique para selecionar
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Tamanho máximo: 10MB
        </p>
        <label className="cursor-pointer">
          <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
            Selecionar Arquivo PDF
          </span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}

// Componente para progresso do upload
interface UploadProgressProps {
  exame: Exame;
  uploadState: any;
  onUpload: () => void;
  onCancel: () => void;
}

function UploadProgress({ exame, uploadState, onUpload, onCancel }: UploadProgressProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {uploadState.file.name}
            </p>
            <p className="text-xs text-gray-500">
              {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-500"
          disabled={uploadState.isUploading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {uploadState.isUploading && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Enviando...</span>
            <span>{uploadState.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {!uploadState.isUploading && uploadState.progress === 0 && (
        <button
          onClick={onUpload}
          disabled={uploadState.isUploading}
          className="w-full mt-3 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Enviar Resultado
        </button>
      )}

      {uploadState.progress === 100 && (
        <div className="flex items-center justify-center mt-3 p-2 bg-green-50 rounded-lg">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm text-green-700">Upload concluído com sucesso!</span>
        </div>
      )}
    </div>
  );
}