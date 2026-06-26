"use client";

import { useEffect, useState } from "react";
import {
  Building,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ShieldAlert,
  Users,
  Settings,
  HardHat,
  Network,
  Database,
  Search,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Card,
  CardBody,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Tabs,
  Tab,
  Switch,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem,
  Pagination,
} from "@heroui/react";
import CmsoCircularLoading from "@/components/shared/CmsoCircularLoading";
import { NEST_URL } from "@/config/constants";
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return undefined;
}

function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return cnpj;
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

import { useRouter } from "next/navigation";
import { IUserInfo } from "@/lib/user/interfaces/IUser";

interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

interface AmbienteEdificacao {
  AMBIENTE: string;
  DESCRICAO: string;
}

interface ResponsavelTecnico {
  NOME: string;
  DOCUMENTOS: ('PCMSO' | 'PGR' | 'LTCAT')[];
  REGISTRO: string;
  UF: string;
  DATAINICIO?: string;
  DATAFIM?: string;
}

interface ContratanteEmpresa {
  CNPJ: string;
  RAZAOSOCIAL: string;
  CIDADE: string;
  UF: string;
  LOGRADOURO?: string;
  NUMERO?: string;
  BAIRRO?: string;
  CEP?: string;
  CNAE?: string;
  GRAUDERISCO?: number;
}

interface ContatoEmpresa {
  NOME: string;
  EMAIL: string;
  TELEFONE: string;
  PERFIL: string;
}

interface Company {
  CODIGO: string;
  CNPJ: string;
  RAZAOSOCIAL: string;
  NOMEABREVIADO: string;
  ATIVO: string;
  CNAE?: string;
  RAMO_ATIVIDADE?: string;
  GRAU_RISCO?: number;
  NUMERO_FUNCIONARIOS?: number;
  FONE_FAX?: string;
  CNAESSECUNDARIOS?: string[];
  REPRESENTANTELEGAL?: string;
  CODIGOIBGEMUNICIPIO?: string;
  SITUACAOCADASTRAL?: string;
  EMAIL?: string;
  TELEFONE?: string;
  ENDERECO?: string;
  NUMEROENDERECO?: string;
  COMPLEMENTOENDERECO?: string;
  BAIRRO?: string;
  CIDADE?: string;
  CEP?: string;
  UF?: string;
  AMBIENTESEDIFICACAO?: AmbienteEdificacao[];
  RESPONSAVEISTECNICOS?: ResponsavelTecnico[];
  CONTRATANTES?: ContratanteEmpresa[];
  CONFIGURACOES?: {
    REQUERPSICOLOGA: boolean;
    CREDENCIADASOC: boolean;
    SOMENTECOMPLEMENTARES?: boolean;
    FATURAMENTO?: "CMSO" | "SEGTEC";
    DEVEDOR?: boolean;
    ASORAPIDOAUTOMATICO?: boolean;
    ENTREGADEEPI?: boolean;
  };
  CONTATOS?: ContatoEmpresa[];
  CODIGOINTERNOCLEINTE?: string;
  'CÓD. CLIENTE (INT.)'?: string;
  AVISOS?: string;
  OBSERVACOES?: string;
}

interface EmpresasSectionProps {
  user: IUserInfo;
}

export function EmpresasSection({ user }: EmpresasSectionProps) {
  const router = useRouter();

  // Redirect non-MASTER users
  useEffect(() => {
    if (user?.perfil !== "MASTER") {
      router.replace("/configuracoes");
    }
  }, [user?.perfil, router]);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("dados");
  const [searchString, setSearchString] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Import states
  const [socCompanies, setSocCompanies] = useState<Company[]>([]);
  const [importingSoc, setImportingSoc] = useState(false);
  const [cnpjBusca, setCnpjBusca] = useState("");
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [socSearchTerm, setSocSearchTerm] = useState("");

  const [form, setForm] = useState<Partial<Company>>({
    CODIGO: "",
    CNPJ: "",
    RAZAOSOCIAL: "",
    NOMEABREVIADO: "",
    CNAE: "",
    RAMO_ATIVIDADE: "",
    GRAU_RISCO: 1,
    NUMERO_FUNCIONARIOS: 0,
    FONE_FAX: "",
    ENDERECO: "",
    NUMEROENDERECO: "",
    COMPLEMENTOENDERECO: "",
    BAIRRO: "",
    CIDADE: "",
    CEP: "",
    UF: "",
    CONFIGURACOES: {
      REQUERPSICOLOGA: false,
      CREDENCIADASOC: false,
      SOMENTECOMPLEMENTARES: false,
      FATURAMENTO: "CMSO",
      DEVEDOR: false,
      ASORAPIDOAUTOMATICO: false,
      ENTREGADEEPI: false,
    },
    CODIGOINTERNOCLEINTE: "",
    AVISOS: "",
    OBSERVACOES: "",
  });

  const [ambientes, setAmbientes] = useState<AmbienteEdificacao[]>([]);
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([]);
  const [contratantes, setContratantes] = useState<ContratanteEmpresa[]>([]);
  const [contatos, setContatos] = useState<ContatoEmpresa[]>([]);

  // Temporary row states for adding
  const [newAmbiente, setNewAmbiente] = useState<AmbienteEdificacao>({ AMBIENTE: "", DESCRICAO: "" });
  const [newResponsavel, setNewResponsavel] = useState<ResponsavelTecnico>({
    NOME: "",
    DOCUMENTOS: [],
    REGISTRO: "",
    UF: "",
    DATAINICIO: "",
    DATAFIM: "",
  });
  const [newContratante, setNewContratante] = useState<ContratanteEmpresa>({
    CNPJ: "",
    RAZAOSOCIAL: "",
    CIDADE: "",
    UF: "",
    LOGRADOURO: "",
    NUMERO: "",
    BAIRRO: "",
    CEP: "",
    CNAE: "",
    GRAUDERISCO: 1,
  });
  const [newContato, setNewContato] = useState<ContatoEmpresa>({
    NOME: "",
    EMAIL: "",
    TELEFONE: "",
    PERFIL: "",
  });
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [buscandoContratanteCnpj, setBuscandoContratanteCnpj] = useState(false);
  const [syncingContacts, setSyncingContacts] = useState(false);
  const [initialStateSnapshot, setInitialStateSnapshot] = useState<string>("");

  const getSnapshot = (
    f: Partial<Company>,
    amb: AmbienteEdificacao[],
    resp: ResponsavelTecnico[],
    contr: ContratanteEmpresa[],
    cont: ContatoEmpresa[]
  ) => {
    return JSON.stringify({
      form: f,
      ambientes: amb,
      responsaveis: resp,
      contratantes: contr,
      contatos: cont,
    });
  };

  // Documentos states
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const currentMonthYear = new Date().toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });

  const [newDocData, setNewDocData] = useState({
    categoria: "FATURAMENTO",
    tipoDocumento: "Relatório Faturamento",
    dataReferencia: currentMonthYear,
    observacoes: "",
    comunicarEmail: false,
    contatosNotificados: [] as string[],
  });

  async function fetchDocumentos(codigoEmpresa: string) {
    if (!codigoEmpresa) return;
    setLoadingDocumentos(true);
    try {
      const res = await fetch(`/api/empresas/${codigoEmpresa}/documentos`);
      if (res.ok) {
        const data = await res.json();
        setDocumentos(data);
      }
    } catch (err) {
      console.error("Erro ao buscar documentos:", err);
    } finally {
      setLoadingDocumentos(false);
    }
  }

  async function handleUploadDocumento() {
    if (!newDocFile || !form.CODIGO) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append("file", newDocFile);
      formData.append("categoria", newDocData.categoria);
      formData.append("tipoDocumento", newDocData.tipoDocumento);
      formData.append("dataReferencia", newDocData.dataReferencia);
      formData.append("observacoes", newDocData.observacoes);
      formData.append("comunicarEmail", String(newDocData.comunicarEmail));
      formData.append("contatosNotificados", JSON.stringify(newDocData.contatosNotificados));

      const res = await fetch(`/api/empresas/${form.CODIGO}/documentos`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("Upload concluído com sucesso!");
        setShowUploadForm(false);
        setNewDocFile(null);
        setNewDocData({
          categoria: "FATURAMENTO",
          tipoDocumento: "Relatório Faturamento",
          dataReferencia: currentMonthYear,
          observacoes: "",
          comunicarEmail: false,
          contatosNotificados: [],
        });
        fetchDocumentos(form.CODIGO);
      } else {
        const errData = await res.json();
        alert(errData.message || "Erro no upload.");
      }
    } catch (err) {
      console.error("Erro no upload:", err);
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleDeleteDocumento(docId: string) {
    if (!window.confirm("Deseja realmente excluir este documento?")) return;
    try {
      const res = await fetch(`/api/empresas/${form.CODIGO}/documentos/${docId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchDocumentos(form.CODIGO as string);
      } else {
        alert("Erro ao excluir documento.");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSyncSocContacts() {
    if (!form.CODIGO) {
      alert("Código SOC da empresa não definido.");
      return;
    }
    setSyncingContacts(true);
    try {
      const token = getCookie("auth_token");
      const res = await fetch(`${NEST_URL}soc/empresas/${form.CODIGO}/contatos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((c: any) => ({
            NOME: c.nome || c.nomeContato || c.contato || "Contato SOC",
            EMAIL: c.primeiroEmail || c.email || "",
            TELEFONE: c.telefone || (c.dddTelefone && c.telefone ? `(${c.dddTelefone}) ${c.telefone}` : "") || "",
            PERFIL: c.nomePerfil || c.codigoPerfil || "",
          })).filter((c: any) => c.EMAIL);
          
          if (mapped.length === 0) {
            alert("Nenhum contato com e-mail encontrado no SOC para esta empresa.");
            return;
          }
          
          const novosContatos = [...contatos];
          let adicionados = 0;
          mapped.forEach((c: any) => {
            if (!novosContatos.some((existing) => existing.EMAIL.toLowerCase() === c.EMAIL.toLowerCase())) {
              novosContatos.push(c);
              adicionados++;
            }
          });
          
          setContatos(novosContatos);
          alert(`${adicionados} novos contatos importados do SOC com sucesso.`);
        } else {
          alert("Nenhum contato retornado pelo SOC para esta empresa.");
        }
      } else {
        alert("Erro ao buscar contatos do SOC.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão ao buscar contatos.");
    } finally {
      setSyncingContacts(false);
    }
  }

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchSocCompaniesList() {
    setImportingSoc(true);
    try {
      const token = getCookie("auth_token");
      const res = await fetch(`${NEST_URL}soc/empresas/soc-export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const sorted = Array.isArray(data) 
          ? data.sort((a, b) => (a.RAZAOSOCIAL || "").localeCompare(b.RAZAOSOCIAL || "", "pt-BR"))
          : [];
        setSocCompanies(sorted);
      }
    } catch (err) {
      console.error("Erro ao buscar lista do SOC:", err);
    } finally {
      setImportingSoc(false);
    }
  }

  async function handleImportSoc(codigo: string) {
    const comp = socCompanies.find(c => c.CODIGO === codigo);
    if (!comp) return;
    setForm((prev) => ({
      ...prev,
      CODIGO: comp.CODIGO || "",
      CNPJ: comp.CNPJ || "",
      RAZAOSOCIAL: comp.RAZAOSOCIAL || "",
      NOMEABREVIADO: comp.NOMEABREVIADO || "",
      CNAE: comp.CNAE || "",
      RAMO_ATIVIDADE: comp.RAMO_ATIVIDADE || "",
      ENDERECO: comp.ENDERECO || "",
      NUMEROENDERECO: comp.NUMEROENDERECO || "",
      COMPLEMENTOENDERECO: comp.COMPLEMENTOENDERECO || "",
      BAIRRO: comp.BAIRRO || "",
      CIDADE: comp.CIDADE || "",
      CEP: comp.CEP || "",
      UF: comp.UF || "",
    }));

    try {
      const token = getCookie("auth_token");
      const res = await fetch(`${NEST_URL}soc/empresas/${codigo}/contatos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((c: any) => ({
            NOME: c.nome || c.nomeContato || c.contato || "Contato SOC",
            EMAIL: c.primeiroEmail || c.email || "",
            TELEFONE: c.telefone || (c.dddTelefone && c.telefone ? `(${c.dddTelefone}) ${c.telefone}` : "") || "",
            PERFIL: c.nomePerfil || c.codigoPerfil || "",
          })).filter((c: any) => c.EMAIL);
          setContatos(mapped);
        }
      }
    } catch (err) {
      console.error("Erro ao importar contatos automaticamente do SOC:", err);
    }
  }

  async function handleBuscarCnpj(isFromContratante: boolean = false, customCnpj?: string) {
    const cnpjParaBuscar = customCnpj || form.CNPJ || cnpjBusca;
    const cnpjLimpo = cnpjParaBuscar.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      alert("Por favor, digite um CNPJ com 14 dígitos.");
      return null;
    }
    if (!isFromContratante) {
      setBuscandoCnpj(true);
    }
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      if (!res.ok) {
        alert("CNPJ não encontrado ou erro na API");
        return null;
      }
      const data = await res.json();
      
      // Mapeamento de Grau de Risco estimado baseado na descrição ou CNAE se possível, ou default/esperado.
      // Se a API retornar algum grau de risco ou estimativa, mapeia. Caso contrário, mantém/calcula.
      
      if (isFromContratante) {
        return {
          cnpj: data.cnpj,
          razaoSocial: data.razao_social,
          cidade: data.municipio || "",
          uf: data.uf || "",
          logradouro: data.logradouro || "",
          numero: data.numero || "",
          bairro: data.bairro || "",
          cep: data.cep || "",
          cnae: data.cnae_fiscal ? String(data.cnae_fiscal) : "",
          grauDeRisco: 1, // default
        };
      }

      setForm((prev) => ({
        ...prev,
        CNPJ: data.cnpj,
        RAZAOSOCIAL: data.razao_social,
        NOMEABREVIADO: data.nome_fantasia || data.razao_social || "",
        CNAE: data.cnae_fiscal ? String(data.cnae_fiscal) : "",
        RAMO_ATIVIDADE: data.cnae_fiscal_descricao || "",
        CNAESSECUNDARIOS: Array.isArray(data.cnaes_secundarios) ? data.cnaes_secundarios.map((c: any) => String(c.codigo || "")) : [],
        REPRESENTANTELEGAL: Array.isArray(data.qsa) && data.qsa[0] ? data.qsa[0].nome : "",
        CODIGOIBGEMUNICIPIO: data.codigo_municipio_ibge ? String(data.codigo_municipio_ibge) : "",
        SITUACAOCADASTRAL: data.descricao_situacao_cadastral || "",
        EMAIL: data.email || "",
        TELEFONE: data.ddd_telefone_1 || data.telefone || "",
        ENDERECO: data.logradouro || "",
        NUMEROENDERECO: data.numero || "",
        COMPLEMENTOENDERECO: data.complemento || "",
        BAIRRO: data.bairro || "",
        CIDADE: data.municipio || "",
        UF: data.uf || "",
        CEP: data.cep || "",
      }));
      return data;
    } catch (err) {
      console.error(err);
      alert("Erro na busca de CNPJ.");
      return null;
    } finally {
      if (!isFromContratante) {
        setBuscandoCnpj(false);
      }
    }
  }

  async function fetchCompanies() {
    setLoading(true);
    try {
      const token = getCookie("auth_token");
      const res = await fetch(`${NEST_URL}soc/empresas?local=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (err) {
      console.error("Erro ao buscar empresas:", err);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(company: Company) {
    setIsCreate(false);
    setEditing(company);
    const formValues = {
      CODIGO: company.CODIGO,
      CNPJ: company.CNPJ || "",
      RAZAOSOCIAL: company.RAZAOSOCIAL || "",
      NOMEABREVIADO: company.NOMEABREVIADO || "",
      CNAE: company.CNAE || "",
      RAMO_ATIVIDADE: company.RAMO_ATIVIDADE || "",
      GRAU_RISCO: company.GRAU_RISCO || 1,
      NUMERO_FUNCIONARIOS: company.NUMERO_FUNCIONARIOS || 0,
      FONE_FAX: company.FONE_FAX || "",
      CNAESSECUNDARIOS: company.CNAESSECUNDARIOS || [],
      REPRESENTANTELEGAL: company.REPRESENTANTELEGAL || "",
      CODIGOIBGEMUNICIPIO: company.CODIGOIBGEMUNICIPIO || "",
      SITUACAOCADASTRAL: company.SITUACAOCADASTRAL || "",
      EMAIL: company.EMAIL || "",
      TELEFONE: company.TELEFONE || "",
      ENDERECO: company.ENDERECO || "",
      NUMEROENDERECO: company.NUMEROENDERECO || "",
      COMPLEMENTOENDERECO: company.COMPLEMENTOENDERECO || "",
      BAIRRO: company.BAIRRO || "",
      CIDADE: company.CIDADE || "",
      CEP: company.CEP || "",
      UF: company.UF || "",
      CONFIGURACOES: {
        REQUERPSICOLOGA: company.CONFIGURACOES?.REQUERPSICOLOGA ?? false,
        CREDENCIADASOC: company.CONFIGURACOES?.CREDENCIADASOC ?? false,
        SOMENTECOMPLEMENTARES: company.CONFIGURACOES?.SOMENTECOMPLEMENTARES ?? false,
        FATURAMENTO: company.CONFIGURACOES?.FATURAMENTO ?? "CMSO",
        DEVEDOR: company.CONFIGURACOES?.DEVEDOR ?? false,
        ASORAPIDOAUTOMATICO: company.CONFIGURACOES?.ASORAPIDOAUTOMATICO ?? false,
        ENTREGADEEPI: company.CONFIGURACOES?.ENTREGADEEPI ?? false,
      },
      CODIGOINTERNOCLEINTE: company.CODIGOINTERNOCLEINTE || company["CÓD. CLIENTE (INT.)"] || "",
      AVISOS: company.AVISOS || "",
      OBSERVACOES: company.OBSERVACOES || "",
    };
    setForm(formValues);
    const amb = company.AMBIENTESEDIFICACAO || [];
    const resp = company.RESPONSAVEISTECNICOS || [];
    const contr = company.CONTRATANTES || [];
    const conts = company.CONTATOS || [];
    setAmbientes(amb);
    setResponsaveis(resp);
    setContratantes(contr);
    setContatos(conts);
    setEditingContactIndex(null);
    setNewContato({ nome: "", email: "", telefone: "", perfil: "" });
    setActiveTab("dados");
    setModalOpen(true);
    fetchDocumentos(company.CODIGO);
    setInitialStateSnapshot(getSnapshot(formValues, amb, resp, contr, conts));
  }

  function openCreate() {
    setIsCreate(true);
    setEditing(null);
    const formValues = {
      CODIGO: "",
      CNPJ: "",
      RAZAOSOCIAL: "",
      NOMEABREVIADO: "",
      CNAE: "",
      RAMO_ATIVIDADE: "",
      GRAU_RISCO: 1,
      NUMERO_FUNCIONARIOS: 0,
      FONE_FAX: "",
      CNAESSECUNDARIOS: [],
      REPRESENTANTELEGAL: "",
      CODIGOIBGEMUNICIPIO: "",
      SITUACAOCADASTRAL: "",
      EMAIL: "",
      TELEFONE: "",
      ENDERECO: "",
      NUMEROENDERECO: "",
      COMPLEMENTOENDERECO: "",
      BAIRRO: "",
      CIDADE: "",
      CEP: "",
      UF: "",
      CONFIGURACOES: {
        REQUERPSICOLOGA: false,
        CREDENCIADASOC: false,
        SOMENTECOMPLEMENTARES: false,
        FATURAMENTO: "CMSO" as const,
        DEVEDOR: false,
        ASORAPIDOAUTOMATICO: false,
        ENTREGADEEPI: false,
      },
      CODIGOINTERNOCLEINTE: "",
      AVISOS: "",
      OBSERVACOES: "",
    };
    setForm(formValues);
    setAmbientes([]);
    setResponsaveis([]);
    setContratantes([]);
    setContatos([]);
    setActiveTab("dados");
    setSocCompanies([]);
    setImportingSoc(false);
    setCnpjBusca("");
    setSocSearchTerm("");
    setDocumentos([]);
    setShowUploadForm(false);
    setModalOpen(true);
    fetchSocCompaniesList();
    setInitialStateSnapshot(getSnapshot(formValues, [], [], [], []));
  }

  async function handleSave() {
    if (!isCreate && !editing) return;
    if (isCreate && (!form.CODIGO?.trim() || !form.CNPJ?.trim() || !form.RAZAOSOCIAL?.trim())) {
      alert("Por favor, preencha Código SOC, CNPJ e Razão Social.");
      return;
    }
    setSaving(true);
    try {
      const url = isCreate 
        ? "/api/soc/empresas" 
        : `/api/soc/empresas/${editing?.CODIGO}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          AMBIENTESEDIFICACAO: ambientes,
          RESPONSAVEISTECNICOS: responsaveis,
          CONTRATANTES: contratantes,
          CONTATOS: contatos,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        fetchCompanies();
      } else {
        const errData = await res.json();
        alert(errData.message || "Erro ao salvar cadastro.");
      }
    } catch (err) {
      console.error("Erro ao salvar empresa:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(company: Company) {
    if (!window.confirm(`Deseja realmente excluir a empresa "${company.RAZAOSOCIAL}" (Cód SOC: ${company.CODIGO})?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/soc/empresas/${company.CODIGO}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCompanies();
      } else {
        const errData = await res.json();
        alert(errData.message || "Erro ao excluir empresa.");
      }
    } catch (err) {
      console.error("Erro ao excluir empresa:", err);
    }
  }

  // List Management Helpers
  function addAmbiente() {
    if (!newAmbiente.AMBIENTE.trim() || !newAmbiente.DESCRICAO.trim()) return;
    setAmbientes([...ambientes, newAmbiente]);
    setNewAmbiente({ AMBIENTE: "", DESCRICAO: "" });
  }

  function removeAmbiente(index: number) {
    setAmbientes(ambientes.filter((_, i) => i !== index));
  }

  function addResponsavel() {
    if (!newResponsavel.NOME.trim() || !newResponsavel.REGISTRO.trim() || newResponsavel.DOCUMENTOS.length === 0) {
      alert("Por favor, preencha nome, registro e selecione ao menos um documento.");
      return;
    }
    setResponsaveis([...responsaveis, newResponsavel]);
    setNewResponsavel({
      NOME: "",
      DOCUMENTOS: [],
      REGISTRO: "",
      UF: "",
      DATAINICIO: "",
      DATAFIM: "",
    });
  }

  function removeResponsavel(index: number) {
    setResponsaveis(responsaveis.filter((_, i) => i !== index));
  }

  async function handleBuscarCnpjContratante() {
    if (!newContratante.CNPJ.trim()) return;
    setBuscandoContratanteCnpj(true);
    try {
      const result = await handleBuscarCnpj(true, newContratante.CNPJ);
      if (result) {
        setNewContratante({
          CNPJ: result.cnpj,
          RAZAOSOCIAL: result.razaoSocial,
          CIDADE: result.cidade,
          UF: result.uf,
          LOGRADOURO: result.logradouro,
          NUMERO: result.numero,
          BAIRRO: result.bairro,
          CEP: result.cep,
          CNAE: result.cnae,
          GRAUDERISCO: result.grauDeRisco || 1,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuscandoContratanteCnpj(false);
    }
  }

  function addContratante() {
    if (!newContratante.CNPJ.trim() || !newContratante.RAZAOSOCIAL.trim()) return;
    setContratantes([...contratantes, newContratante]);
    setNewContratante({
      CNPJ: "",
      RAZAOSOCIAL: "",
      CIDADE: "",
      UF: "",
      LOGRADOURO: "",
      NUMERO: "",
      BAIRRO: "",
      CEP: "",
      CNAE: "",
      GRAUDERISCO: 1,
    });
  }

  function removeContratante(index: number) {
    setContratantes(contratantes.filter((_, i) => i !== index));
  }

  function editContato(index: number) {
    const contact = contatos[index];
    if (!contact) return;
    setNewContato({ ...contact });
    setEditingContactIndex(index);
  }

  function cancelEditContato() {
    setEditingContactIndex(null);
    setNewContato({ NOME: "", EMAIL: "", TELEFONE: "", PERFIL: "" });
  }

  function handleSaveContato() {
    if (!newContato.NOME.trim() || !newContato.EMAIL.trim()) {
      alert("Por favor, preencha pelo menos Nome e E-mail.");
      return;
    }

    if (editingContactIndex !== null) {
      const updatedContatos = [...contatos];
      updatedContatos[editingContactIndex] = { ...newContato };
      setContatos(updatedContatos);
      cancelEditContato();
    } else {
      setContatos([...contatos, { ...newContato }]);
      cancelEditContato();
    }
  }

  function removeContato(index: number) {
    setContatos(contatos.filter((_, i) => i !== index));
  }

  const filteredCompanies = companies.filter(
    (c) =>
      c.RAZAOSOCIAL.toLowerCase().includes(searchString.toLowerCase()) ||
      c.NOMEABREVIADO.toLowerCase().includes(searchString.toLowerCase()) ||
      c.CNPJ.includes(searchString),
  );

  const filteredSocCompanies = (searchValue: string) => {
    if (!searchValue) return socCompanies;
    const lowerSearch = searchValue.toLowerCase();
    return socCompanies.filter((comp) =>
      (comp.RAZAOSOCIAL || "").toLowerCase().includes(lowerSearch) ||
      (comp.CNPJ || "").includes(searchValue) ||
      (comp.CODIGO || "").includes(searchValue)
    );
  };

  if (loading) {
    return <CmsoCircularLoading fullHeight={false} />;
  }

  return (
    <>
      <Card className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Building size={28} aria-hidden="true" style={{ color: "#44735e" }} />
              <h2 className="text-xl font-semibold text-gray-800">Cadastro de Empresas</h2>
            </div>
            <div className="flex gap-3 items-center">
              <Input
                placeholder="Pesquisar por CNPJ ou nome..."
                value={searchString}
                onValueChange={(val) => {
                  setSearchString(val);
                  setCurrentPage(1);
                }}
                className="max-w-xs"
                size="sm"
                classNames={{
                  base: "h-9",
                  mainWrapper: "h-9",
                  inputWrapper: "h-9",
                }}
              />
              <Button
                startContent={<Plus size={18} />}
                onPress={openCreate}
                size="sm"
                className="h-9 px-3 bg-[#44735e] text-white hover:bg-[#7FA830] transition-all duration-200 shrink-0"
              >
                Nova Empresa
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <Table aria-label="Empresas cadastradas">
            <TableHeader>
              <TableColumn width={380}>RAZÃO SOCIAL / FANTASIA</TableColumn>
              <TableColumn width={160}>CNPJ</TableColumn>
              <TableColumn width={180}>CONFIGURAÇÕES</TableColumn>
              <TableColumn width={220}>RESPONSÁVEIS & DOCS</TableColumn>
              <TableColumn width={100}>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Nenhuma empresa encontrada">
              {filteredCompanies
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((company) => {
                  const uniqueDocs = Array.from(new Set(
                    (company.RESPONSAVEISTECNICOS || []).flatMap(r => r.documentos || [])
                  ));
                  return (
                    <TableRow key={company.CODIGO}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 line-clamp-1">{company.RAZAOSOCIAL}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-0.5">
                            <span>{company.NOMEABREVIADO || "-"}</span>
                            <span>•</span>
                            <span className="font-mono">SOC: {company.CODIGO}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap">{formatCNPJ(company.CNPJ)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {company.CONFIGURACOES?.DEVEDOR ? (
                            <div className="mt-0.5">
                              <Chip size="sm" color="danger" variant="solid" className="h-5 text-[10px] font-bold animate-pulse">
                                DEVEDOR
                              </Chip>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 text-xs">
                          {company.RESPONSAVEISTECNICOS && company.RESPONSAVEISTECNICOS.length > 0 ? (
                            company.RESPONSAVEISTECNICOS.map((r, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-x-2 gap-y-0.5">
                                <span className="font-semibold text-gray-700 whitespace-normal line-clamp-1" title={r.nome}>
                                  {r.nome}
                                </span>
                                <div className="flex gap-0.5">
                                  {(r.documentos || []).map(doc => (
                                    <span key={doc} className="inline-flex text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/50 px-1 py-0.2 rounded">
                                      {doc}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">-</span>
                          )}
                        </div>
                      </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openEdit(company)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => handleDelete(company)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
          </div>

          {filteredCompanies.length > itemsPerPage && (
            <div className="flex justify-center mt-6">
              <Pagination
                showControls
                color="primary"
                page={currentPage}
                total={Math.ceil(filteredCompanies.length / itemsPerPage)}
                onChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="5xl" classNames={{ base: "max-w-[1400px]" }} isDismissable={false} isKeyboardDismissDisabled={true} scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1.5 border-b border-gray-100 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-bold text-gray-800">
                {isCreate ? "Cadastrar Nova Empresa" : form.RAZAOSOCIAL}
              </span>
              {!isCreate && (
                <div className="flex flex-wrap gap-1">
                  {form.CONFIGURACOES?.requerPsicologa && (
                    <Chip size="sm" color="secondary" variant="flat">Psicologia</Chip>
                  )}
                  {form.CONFIGURACOES?.credenciadaSoc && (
                    <Chip size="sm" color="primary" variant="flat">SOC</Chip>
                  )}
                  {form.CONFIGURACOES?.asoRapidoAutomatico && (
                    <Chip size="sm" color="warning" variant="flat">ASO Auto</Chip>
                  )}
                  {form.CONFIGURACOES?.somenteComplementares && (
                    <Chip size="sm" color="success" variant="flat">Complementar</Chip>
                  )}
                  {form.CONFIGURACOES?.FATURAMENTO && (
                    <Chip size="sm" color="default" variant="flat">Fat: {form.CONFIGURACOES.FATURAMENTO}</Chip>
                  )}
                  {form.CONFIGURACOES?.devedor && (
                    <Chip size="sm" color="danger" variant="solid" className="font-bold animate-pulse">DEVEDOR</Chip>
                  )}
                </div>
              )}
            </div>
            {!isCreate && form.CODIGO && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs font-normal text-gray-400">
                <span>Cód. SOC: <strong className="font-semibold font-mono text-gray-600">{form.CODIGO}</strong></span>
                <span className="hidden sm:inline text-gray-300">|</span>
                <span>CNPJ: <strong className="font-semibold font-mono text-gray-600">{form.CNPJ}</strong></span>
                {responsaveis.length > 0 && (
                  <>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      Docs Ativos: 
                      {Array.from(new Set(responsaveis.flatMap(r => r.documentos || []))).map(doc => (
                        <Chip key={doc} size="sm" variant="bordered" color="warning" className="h-4 text-[9px] py-0 px-1 font-semibold leading-none border-warning-200">
                          {doc}
                        </Chip>
                      ))}
                    </span>
                  </>
                )}
              </div>
            )}
          </ModalHeader>
          <div className="px-6 bg-white border-b border-gray-100 shrink-0">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              aria-label="Dados complementares da empresa"
              variant="underlined"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b-0",
                cursor: "w-full bg-[#44735e]",
                tab: "max-w-fit px-0 h-12 text-sm font-medium",
              }}
            >
              <Tab key="dados" title="Dados Gerais" />
              <Tab key="config" title="Configurações" />
              <Tab key="edificacao" title="Edificação (PGR)" />
              <Tab key="responsaveis" title="Responsáveis Técnicos" />
              <Tab key="contratantes" title="Contratantes" />
              <Tab key="contatos" title="Contatos" />
              <Tab key="documentos" title="Documentos" />
            </Tabs>
          </div>
          <ModalBody className="py-6">
            {activeTab === "dados" && (
              <>
                {isCreate && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100/80 border border-gray-200/50 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-default-500 font-semibold text-xs uppercase tracking-wider">
                      <Database size={14} className="text-[#44735e]" />
                      <span>Importar Dados do SOC (Opcional)</span>
                    </div>
                    <Autocomplete
                      placeholder={importingSoc ? "Carregando empresas..." : "Digite para buscar por razão social, CNPJ ou código SOC..."}
                      size="sm"
                      isLoading={importingSoc}
                      items={filteredSocCompanies(socSearchTerm)}
                      onSelectionChange={(key) => key && handleImportSoc(String(key))}
                      variant="bordered"
                      onInputChange={(value) => setSocSearchTerm(value)}
                      allowsCustomValue={false}
                      classNames={{
                        selectorButton: "bg-white border-gray-200 hover:border-gray-300 focus:border-[#44735e] shadow-none",
                      }}
                    >
                      {(comp) => (
                        <AutocompleteItem key={comp.CODIGO} textValue={`${comp.CODIGO} - ${comp.RAZAOSOCIAL}`}>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">{comp.RAZAOSOCIAL}</span>
                            <span className="text-xs text-gray-400 font-mono">SOC: {comp.CODIGO} | CNPJ: {comp.CNPJ || "-"}</span>
                          </div>
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Input
                    label="Código SOC"
                    value={form.CODIGO}
                    onValueChange={(v) => setForm((f) => ({ ...f, CODIGO: v }))}
                    isDisabled={!isCreate}
                    isRequired
                  />
                  <div className="flex gap-2 items-end">
                    <Input
                      label="CNPJ"
                      value={form.CNPJ}
                      onValueChange={(v) => setForm((f) => ({ ...f, CNPJ: v }))}
                      isDisabled={!isCreate}
                      isRequired
                      className="flex-1"
                    />
                    <Button
                      size="md"
                      variant="solid"
                      onPress={() => handleBuscarCnpj(false)}
                      isLoading={buscandoCnpj}
                      className="bg-[#44735e] text-white min-w-fit h-10 px-4 text-sm font-semibold rounded-xl shadow-sm hover:opacity-90 align-middle"
                    >
                      Buscar
                    </Button>
                  </div>
                  <Input
                    label="Razão Social"
                    value={form.RAZAOSOCIAL}
                    onValueChange={(v) => setForm((f) => ({ ...f, RAZAOSOCIAL: v }))}
                    className="col-span-2"
                    isRequired
                  />
                  <Input
                    label="Nome Abreviado (Fantasia)"
                    value={form.NOMEABREVIADO}
                    onValueChange={(v) => setForm((f) => ({ ...f, NOMEABREVIADO: v }))}
                  />
                  <Input
                    label="Fone / Fax"
                    value={form.FONE_FAX}
                    onValueChange={(v) => setForm((f) => ({ ...f, FONE_FAX: v }))}
                  />
                  <Input
                    label="Código CNAE"
                    value={form.CNAE}
                    onValueChange={(v) => setForm((f) => ({ ...f, CNAE: v }))}
                    placeholder="ex: 77.29-2-03"
                  />
                  <Input
                    label="Grau de Risco"
                    type="number"
                    value={String(form.GRAU_RISCO || 1)}
                    onValueChange={(v) => setForm((f) => ({ ...f, GRAU_RISCO: Number(v) || 1 }))}
                    placeholder="1 a 4"
                  />
                  <Input
                    label="Ramo de Atividade"
                    className="col-span-2"
                    value={form.RAMO_ATIVIDADE}
                    onValueChange={(v) => setForm((f) => ({ ...f, RAMO_ATIVIDADE: v }))}
                  />
                  <Input
                    label="Número de Funcionários"
                    type="number"
                    value={String(form.NUMERO_FUNCIONARIOS || 0)}
                    onValueChange={(v) => setForm((f) => ({ ...f, NUMERO_FUNCIONARIOS: Number(v) || 0 }))}
                  />
                  <Input
                    label="Código Interno Cliente"
                    value={form.CODIGOINTERNOCLEINTE}
                    onValueChange={(v) => setForm((f) => ({ ...f, CODIGOINTERNOCLEINTE: v }))}
                  />
                  <Input
                    label="E-mail de Contato"
                    value={form.EMAIL}
                    onValueChange={(v) => setForm((f) => ({ ...f, EMAIL: v }))}
                  />
                  <Input
                    label="Telefone Adicional"
                    value={form.TELEFONE}
                    onValueChange={(v) => setForm((f) => ({ ...f, TELEFONE: v }))}
                  />
                  <Input
                    label="Representante Legal"
                    value={form.REPRESENTANTELEGAL}
                    onValueChange={(v) => setForm((f) => ({ ...f, REPRESENTANTELEGAL: v }))}
                  />
                  <Input
                    label="Situação Cadastral"
                    value={form.SITUACAOCADASTRAL}
                    onValueChange={(v) => setForm((f) => ({ ...f, SITUACAOCADASTRAL: v }))}
                    placeholder="ATIVA, BAILADA, INAPTA"
                  />
                  <Input
                    label="Código IBGE Município"
                    value={form.CODIGOIBGEMUNICIPIO}
                    onValueChange={(v) => setForm((f) => ({ ...f, CODIGOIBGEMUNICIPIO: v }))}
                    placeholder="ex: 3550308"
                  />
                  {/* Seção de Endereço */}
                  <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                      <MapPin size={16} className="text-[#44735e]" />
                      Endereço da Empresa
                    </h3>
                  </div>
                  <Input
                    label="CEP"
                    value={form.CEP}
                    onValueChange={(v) => setForm((f) => ({ ...f, CEP: v }))}
                  />
                  <Input
                    label="Endereço"
                    value={form.ENDERECO}
                    onValueChange={(v) => setForm((f) => ({ ...f, ENDERECO: v }))}
                  />
                  <Input
                    label="Número"
                    value={form.NUMEROENDERECO}
                    onValueChange={(v) => setForm((f) => ({ ...f, NUMEROENDERECO: v }))}
                  />
                  <Input
                    label="Complemento"
                    value={form.COMPLEMENTOENDERECO}
                    onValueChange={(v) => setForm((f) => ({ ...f, COMPLEMENTOENDERECO: v }))}
                  />
                  <Input
                    label="Bairro"
                    value={form.BAIRRO}
                    onValueChange={(v) => setForm((f) => ({ ...f, BAIRRO: v }))}
                  />
                  <Input
                    label="Cidade"
                    value={form.CIDADE}
                    onValueChange={(v) => setForm((f) => ({ ...f, CIDADE: v }))}
                  />
                  <Input
                    label="UF"
                    value={form.UF}
                    onValueChange={(v) => setForm((f) => ({ ...f, UF: v }))}
                    maxLength={2}
                  />
                  <Textarea
                    label="Avisos"
                    placeholder="Digite avisos importantes sobre esta empresa..."
                    value={form.AVISOS}
                    onValueChange={(v) => setForm((f) => ({ ...f, AVISOS: v }))}
                    className="col-span-2"
                  />
                  <Textarea
                    label="Observações"
                    placeholder="Digite observações complementares..."
                    value={form.OBSERVACOES}
                    onValueChange={(v) => setForm((f) => ({ ...f, OBSERVACOES: v }))}
                    className="col-span-2"
                  />
                  {form.CNAESSECUNDARIOS && form.CNAESSECUNDARIOS.length > 0 && (
                    <div className="col-span-2 p-3 bg-gray-50 rounded-lg border border-gray-100 mt-1">
                      <span className="text-xs font-semibold text-gray-500 block mb-1">CNAEs Secundários</span>
                      <div className="flex flex-wrap gap-1.5">
                        {form.CNAESSECUNDARIOS.map((cnae) => (
                          <Chip key={cnae} size="sm" variant="flat" color="secondary" className="font-mono text-xs">
                            {cnae}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "config" && (
                <div className="flex flex-col gap-6 pt-6 pl-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">ASO Rápido Automático</span>
                      <span className="text-xs text-gray-400">Gera ASO no SOC automaticamente ao realizar agendamento</span>
                    </div>
                    <Switch
                      isSelected={form.CONFIGURACOES?.ASORAPIDOAUTOMATICO || false}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          CONFIGURACOES: { ...f.CONFIGURACOES!, ASORAPIDOAUTOMATICO: v },
                        }))
                      }
                      color="success"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">Complementar</span>
                      <span className="text-xs text-gray-400">Clientes que optam somente por exames complementares</span>
                    </div>
                    <Switch
                      isSelected={form.CONFIGURACOES?.SOMENTECOMPLEMENTARES}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          CONFIGURACOES: { ...f.CONFIGURACOES!, SOMENTECOMPLEMENTARES: v },
                        }))
                      }
                      color="success"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">Credenciada SOC</span>
                      <span className="text-xs text-gray-400">Indica que a empresa opera via credenciamento direto SOC</span>
                    </div>
                    <Switch
                      isSelected={form.CONFIGURACOES?.CREDENCIADASOC}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          CONFIGURACOES: { ...f.CONFIGURACOES!, CREDENCIADASOC: v },
                        }))
                      }
                      color="success"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">Devedor</span>
                      <span className="text-xs text-gray-400">Bloqueia atendimento e faturamento por inadimplência</span>
                    </div>
                    <Switch
                      isSelected={form.CONFIGURACOES?.DEVEDOR || false}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          CONFIGURACOES: { ...f.CONFIGURACOES!, DEVEDOR: v },
                        }))
                      }
                      color="danger"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">Entrega de EPI</span>
                      <span className="text-xs text-gray-400">Habilita o uso da funcionalidade entrega de EPI</span>
                    </div>
                    <Switch
                      isSelected={form.CONFIGURACOES?.ENTREGADEEPI || false}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          CONFIGURACOES: { ...f.CONFIGURACOES!, ENTREGADEEPI: v },
                        }))
                      }
                      color="success"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">Entrevista para Avaliação Psicossocial</span>
                      <span className="text-xs text-gray-400">Ativa o encaminhamento obrigatório para psicóloga</span>
                    </div>
                    <Switch
                      isSelected={form.CONFIGURACOES?.REQUERPSICOLOGA}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          CONFIGURACOES: { ...f.CONFIGURACOES!, REQUERPSICOLOGA: v },
                        }))
                      }
                      color="success"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">Faturamento</span>
                      <span className="text-xs text-gray-400 font-medium">Integração para cobranças</span>
                    </div>
                    <Select
                      placeholder="Selecione a integração..."
                      selectedKeys={form.CONFIGURACOES?.FATURAMENTO ? [form.CONFIGURACOES.FATURAMENTO] : []}
                      size="sm"
                      className="max-w-[200px]"
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as "CMSO" | "SEGTEC";
                        setForm((f) => ({
                          ...f,
                          CONFIGURACOES: { ...f.CONFIGURACOES!, FATURAMENTO: val },
                        }));
                      }}
                    >
                      <SelectItem key="CMSO">CMSO</SelectItem>
                      <SelectItem key="SEGTEC">SEGTEC</SelectItem>
                    </Select>
                  </div>
                </div>
              )}

              {activeTab === "edificacao" && (
                <div className="pt-4 space-y-4">
                  <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Input
                      label="Ambiente / Item"
                      placeholder="Ex: Piso, Parede, Teto"
                      value={newAmbiente.AMBIENTE}
                      onValueChange={(v) => setNewAmbiente((a) => ({ ...a, AMBIENTE: v }))}
                      size="sm"
                    />
                    <Input
                      label="Descrição Física"
                      placeholder="Ex: Piso cerâmico antiderrapante..."
                      value={newAmbiente.DESCRICAO}
                      onValueChange={(v) => setNewAmbiente((a) => ({ ...a, DESCRICAO: v }))}
                      size="sm"
                    />
                    <Button color="primary" onPress={addAmbiente} startContent={<Plus size={16} />} size="md" className="bg-[#44735e]">
                      Adicionar
                    </Button>
                  </div>

                  <Table aria-label="Lista de ambientes físicos" className="mt-2" shadow="none" removeWrapper>
                    <TableHeader>
                      <TableColumn>AMBIENTE / ITEM</TableColumn>
                      <TableColumn>DESCRIÇÃO</TableColumn>
                      <TableColumn width={80}>AÇÕES</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="Nenhum ambiente ou descrição cadastrada">
                      {ambientes.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-semibold text-gray-700">{item.AMBIENTE}</TableCell>
                          <TableCell className="text-gray-500">{item.DESCRICAO}</TableCell>
                          <TableCell>
                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeAmbiente(index)}>
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === "responsaveis" && (
                <div className="pt-4 space-y-4">
                  <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-3">
                        <Input
                          label="Nome"
                          placeholder="Nome do profissional"
                          value={newResponsavel.NOME}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, NOME: v }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Select
                          label="Documentos"
                          placeholder="Selecione os documentos..."
                          selectionMode="multiple"
                          selectedKeys={new Set(newResponsavel.DOCUMENTOS)}
                          onSelectionChange={(keys) =>
                            setNewResponsavel((r) => ({ ...r, DOCUMENTOS: Array.from(keys) as any[] }))
                          }
                        >
                          <SelectItem key="PCMSO">PCMSO</SelectItem>
                          <SelectItem key="PGR">PGR</SelectItem>
                          <SelectItem key="LTCAT">LTCAT</SelectItem>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <Input
                          label="Registro"
                          placeholder="CREA/CRM/MTE"
                          value={newResponsavel.REGISTRO}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, REGISTRO: v }))}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-1">
                        <Input
                          label="UF"
                          placeholder="SP"
                          value={newResponsavel.UF}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, UF: v }))}
                          maxLength={2}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          label="Data Início"
                          type="date"
                          value={newResponsavel.DATAINICIO || ""}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, DATAINICIO: v }))}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          label="Data Fim"
                          type="date"
                          value={newResponsavel.DATAFIM || ""}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, DATAFIM: v }))}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button 
                        color="primary" 
                        onPress={addResponsavel} 
                        startContent={<Plus size={16} />} 
                        className="bg-[#44735e] px-8"
                      >
                        Adicionar Responsável
                      </Button>
                    </div>
                  </div>

                  <Table aria-label="Lista de responsáveis técnicos" className="mt-2" shadow="none" removeWrapper>
                    <TableHeader>
                      <TableColumn>NOME</TableColumn>
                      <TableColumn>DOCUMENTOS</TableColumn>
                      <TableColumn>REGISTRO / UF</TableColumn>
                      <TableColumn>VIGÊNCIA</TableColumn>
                      <TableColumn width={80}>AÇÕES</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="Nenhum responsável técnico cadastrado">
                      {responsaveis.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-semibold text-gray-700">{item.NOME}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(item.DOCUMENTOS || []).map((doc) => (
                                <Chip key={doc} size="sm" variant="flat" color="secondary">
                                  {doc}
                                </Chip>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 font-mono text-xs">
                            {item.REGISTRO} - {item.UF.toUpperCase()}
                          </TableCell>
                          <TableCell className="text-gray-500 text-xs">
                            {item.DATAINICIO ? new Date(item.DATAINICIO + "T00:00:00").toLocaleDateString("pt-BR") : "-"} até {item.DATAFIM ? new Date(item.DATAFIM + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
                          </TableCell>
                          <TableCell>
                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeResponsavel(index)}>
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === "contratantes" && (
                <div className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="col-span-1 md:col-span-2 flex gap-2 items-end">
                      <Input
                        label="CNPJ"
                        placeholder="CNPJ da contratante"
                        value={newContratante.CNPJ}
                        onValueChange={(v) => setNewContratante((c) => ({ ...c, CNPJ: v }))}
                        size="sm"
                      />
                      <Button
                        size="md"
                        variant="solid"
                        onPress={handleBuscarCnpjContratante}
                        isLoading={buscandoContratanteCnpj}
                        className="bg-[#44735e] text-white font-semibold shadow-sm hover:opacity-90"
                      >
                        Buscar
                      </Button>
                    </div>

                    <Input
                      label="Razão Social"
                      placeholder="Nome da empresa"
                      value={newContratante.RAZAOSOCIAL}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, RAZAOSOCIAL: v }))}
                      size="sm"
                      className="col-span-1 md:col-span-2"
                    />

                    <Input
                      label="CEP"
                      placeholder="00000-000"
                      value={newContratante.CEP}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, CEP: v }))}
                      size="sm"
                    />

                    <Input
                      label="Logradouro"
                      placeholder="Rua / Av"
                      value={newContratante.LOGRADOURO}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, LOGRADOURO: v }))}
                      size="sm"
                      className="col-span-1 md:col-span-2"
                    />

                    <Input
                      label="Número"
                      placeholder="123"
                      value={newContratante.NUMERO}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, NUMERO: v }))}
                      size="sm"
                    />

                    <Input
                      label="Bairro"
                      placeholder="Bairro"
                      value={newContratante.BAIRRO}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, BAIRRO: v }))}
                      size="sm"
                    />

                    <Input
                      label="Cidade"
                      placeholder="Cidade"
                      value={newContratante.CIDADE}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, CIDADE: v }))}
                      size="sm"
                    />

                    <Input
                      label="UF"
                      placeholder="SP"
                      value={newContratante.UF}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, UF: v }))}
                      size="sm"
                      maxLength={2}
                    />

                    <Input
                      label="CNAE"
                      placeholder="CNAE"
                      value={newContratante.CNAE}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, CNAE: v }))}
                      size="sm"
                    />

                    <Input
                      label="Grau de Risco"
                      placeholder="1 a 4"
                      type="number"
                      value={String(newContratante.GRAUDERISCO || 1)}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, GRAUDERISCO: Number(v) || 1 }))}
                      size="sm"
                    />

                    <div className="col-span-1 md:col-span-4 flex justify-end">
                      <Button color="primary" onPress={addContratante} startContent={<Plus size={16} />} size="md" className="bg-[#44735e] px-8">
                        Adicionar Contratante
                      </Button>
                    </div>
                  </div>

                  <Table aria-label="Lista de contratantes vinculadas" className="mt-2" shadow="none" removeWrapper>
                    <TableHeader>
                      <TableColumn>RAZÃO SOCIAL</TableColumn>
                      <TableColumn>CNPJ</TableColumn>
                      <TableColumn>CNAE / RISCO</TableColumn>
                      <TableColumn>LOCALIZAÇÃO / ENDEREÇO</TableColumn>
                      <TableColumn width={80}>AÇÕES</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="Nenhuma empresa contratante vinculada">
                      {contratantes.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-semibold text-gray-700">{item.RAZAOSOCIAL}</TableCell>
                          <TableCell className="font-mono text-xs">{item.CNPJ}</TableCell>
                          <TableCell className="text-xs">
                            CNAE: {item.CNAE || "-"} / Risco: {item.GRAUDERISCO || 1}
                          </TableCell>
                          <TableCell className="text-gray-500 text-xs">
                            {item.LOGRADOURO ? `${item.LOGRADOURO}, ${item.NUMERO || "S/N"} - ` : ""}{item.CIDADE} - {item.UF.toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeContratante(index)}>
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === "contatos" && (
                <div className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <Input
                      label="Nome"
                      placeholder="Nome do contato"
                      value={newContato.NOME}
                      onValueChange={(v) => setNewContato((c) => ({ ...c, NOME: v }))}
                      size="sm"
                    />
                    <Input
                      label="E-mail"
                      placeholder="email@empresa.com"
                      value={newContato.EMAIL}
                      onValueChange={(v) => setNewContato((c) => ({ ...c, EMAIL: v }))}
                      size="sm"
                    />
                    <Input
                      label="Telefone"
                      placeholder="(00) 00000-0000"
                      value={newContato.TELEFONE}
                      onValueChange={(v) => setNewContato((c) => ({ ...c, TELEFONE: v }))}
                      size="sm"
                    />
                    <Input
                      label="Perfil (SOC)"
                      placeholder="Nome do perfil (ex: ASO)"
                      value={newContato.PERFIL}
                      onValueChange={(v) => setNewContato((c) => ({ ...c, PERFIL: v }))}
                      size="sm"
                    />
                    <div className="col-span-1 md:col-span-4 flex justify-between items-center gap-2">
                      <Button
                        variant="flat"
                        color="secondary"
                        onPress={handleSyncSocContacts}
                        isLoading={syncingContacts}
                        startContent={<Database size={16} />}
                        size="md"
                        className="px-6 font-semibold"
                      >
                        Importar do SOC
                      </Button>
                      <div className="flex gap-2">
                        {editingContactIndex !== null && (
                          <Button variant="flat" color="default" onPress={cancelEditContato} size="md">
                            Cancelar
                          </Button>
                        )}
                        <Button color="primary" onPress={handleSaveContato} startContent={<Plus size={16} />} size="md" className="bg-[#44735e] px-8">
                          {editingContactIndex !== null ? "Salvar Contato" : "Adicionar Contato"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Table aria-label="Lista de contatos da empresa" className="mt-2" shadow="none" removeWrapper>
                    <TableHeader>
                      <TableColumn>NOME</TableColumn>
                      <TableColumn>E-MAIL</TableColumn>
                      <TableColumn>TELEFONE</TableColumn>
                      <TableColumn>PERFIL (SOC)</TableColumn>
                      <TableColumn width={80}>AÇÕES</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="Nenhum contato vinculado">
                      {contatos.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-semibold text-gray-700">{item.NOME}</TableCell>
                          <TableCell className="text-gray-500 font-mono text-xs">{item.EMAIL}</TableCell>
                          <TableCell className="text-gray-500 text-xs">{item.TELEFONE || "-"}</TableCell>
                          <TableCell className="text-gray-500 text-xs font-mono">{item.PERFIL || "-"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button isIconOnly size="sm" variant="light" onPress={() => editContato(index)}>
                                <Pencil size={16} />
                              </Button>
                              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeContato(index)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === "documentos" && (
                <div className="pt-6 space-y-4">
                  {showUploadForm ? (
                    <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700">Novo Documento</h3>
                      
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#44735e] hover:bg-[#44735e]/5 transition-colors"
                        onClick={() => document.getElementById("doc-file-input")?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-[#44735e]", "bg-[#44735e]/5"); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove("border-[#44735e]", "bg-[#44735e]/5"); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove("border-[#44735e]", "bg-[#44735e]/5");
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            setNewDocFile(e.dataTransfer.files[0]);
                          }
                        }}
                      >
                        <input
                          id="doc-file-input"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setNewDocFile(e.target.files[0]);
                            }
                          }}
                        />
                        {newDocFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-[#44735e]/10 flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#44735e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{newDocFile.name}</span>
                            <span className="text-xs text-gray-400">{(newDocFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            <Button size="sm" variant="flat" color="danger" onPress={() => setNewDocFile(null)}>
                              Remover arquivo
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-500 font-medium">Clique ou arraste o arquivo aqui</span>
                            <span className="text-xs text-gray-400">PDF, PNG, JPG, XLSX (máx. 10 MB)</span>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                          label="Tipo de Documento"
                          selectedKeys={[newDocData.tipoDocumento]}
                          onSelectionChange={(keys) => setNewDocData({ ...newDocData, tipoDocumento: Array.from(keys)[0] as string })}
                        >
                          <SelectItem key="Relatório Faturamento">Relatório Faturamento</SelectItem>
                        </Select>

                        <Input
                          label="Data de Referência (Mês/Ano)"
                          placeholder="Ex: 04/2026"
                          value={newDocData.dataReferencia}
                          onValueChange={(v) => setNewDocData({ ...newDocData, dataReferencia: v })}
                        />
                      </div>

                      <Textarea
                        label="Observações"
                        placeholder="Informações adicionais..."
                        value={newDocData.observacoes}
                        onValueChange={(v) => setNewDocData({ ...newDocData, observacoes: v })}
                      />

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={newDocData.comunicarEmail}
                            onValueChange={(v) => setNewDocData({ ...newDocData, comunicarEmail: v })}
                            color="success"
                          />
                          <span className="text-sm font-semibold text-gray-700">Comunicar por E-mail</span>
                        </div>
                        {newDocData.comunicarEmail && (
                          <Select
                            label="Contatos para notificação"
                            placeholder="Selecione os contatos da empresa"
                            selectionMode="multiple"
                            items={[
                              {
                                kind: "all" as const,
                                email: "__all__",
                                nome: "Todos os Contatos",
                                textValue: "Todos os Contatos",
                                descricao: "Enviar para todos os contatos registrados",
                              },
                              ...contatos.map((c) => ({
                                kind: "contact" as const,
                                ...c,
                                textValue: `${c.NOME} (${c.EMAIL})`,
                              })),
                            ]}
                            selectedKeys={
                              contatos.length > 0 &&
                              newDocData.contatosNotificados.length === contatos.length &&
                              contatos.every(c => newDocData.contatosNotificados.includes(c.EMAIL))
                                ? new Set(['__all__'])
                                : new Set(newDocData.contatosNotificados)
                            }
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys) as string[];
                              if (selected.includes('__all__')) {
                                const allSelected = contatos.length > 0 &&
                                  newDocData.contatosNotificados.length === contatos.length &&
                                  contatos.every(c => newDocData.contatosNotificados.includes(c.EMAIL));
                                setNewDocData({
                                  ...newDocData,
                                  contatosNotificados: allSelected ? [] : contatos.map(c => c.EMAIL),
                                });
                              } else {
                                  setNewDocData({ ...newDocData, contatosNotificados: selected });
                                }
                              }}
                            >
                              {(c) =>
                                c.kind === "all" ? (
                                  <SelectItem key="__all__" textValue={c.textValue}>
                                    <div className="flex flex-col">
                                      <span className="font-semibold">{c.nome}</span>
                                      <span className="text-tiny text-default-400">{c.descricao}</span>
                                    </div>
                                  </SelectItem>
                                ) : (
                                  <SelectItem key={c.EMAIL} textValue={c.textValue}>
                                    <div className="flex flex-col">
                                      <span>{c.NOME}</span>
                                      <span className="text-tiny text-default-400">{c.EMAIL}</span>
                                    </div>
                                  </SelectItem>
                                )
                              }
                          </Select>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="flat" onPress={() => setShowUploadForm(false)}>
                          Cancelar
                        </Button>
                        <Button
                          color="primary"
                          className="bg-[#44735e]"
                          isLoading={uploadingDoc}
                          onPress={handleUploadDocumento}
                        >
                          Salvar Documento
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Gerencie os documentos da empresa.</span>
                        <Button color="primary" className="bg-[#44735e]" startContent={<Plus size={16} />} onPress={() => setShowUploadForm(true)}>
                          Novo Upload
                        </Button>
                      </div>
                      <Table aria-label="Lista de documentos da empresa" shadow="none" removeWrapper>
                        <TableHeader>
                          <TableColumn>DOCUMENTO</TableColumn>
                          <TableColumn>REFERÊNCIA</TableColumn>
                          <TableColumn>DATA UPLOAD</TableColumn>
                          <TableColumn>CRIADO POR</TableColumn>
                          <TableColumn width={100}>AÇÕES</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent={loadingDocumentos ? "Carregando..." : "Nenhum documento encontrado."}>
                          {documentos.map((doc, idx) => (
                            <TableRow key={doc._id || idx}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-700">{doc.TIPODOCUMENTO}</span>
                                  <span className="text-xs text-gray-400 font-mono">{doc.NOMEARQUIVOORIGINAL}</span>
                                </div>
                              </TableCell>
                              <TableCell>{doc.DATAREFERENCIA || "-"}</TableCell>
                              <TableCell>{doc.CRIADOEM ? new Date(doc.CRIADOEM).toLocaleDateString("pt-BR") : "-"}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs">{doc.CRIADOPOR}</span>
                                  {doc.COMUNICAREMAIL && <Chip size="sm" color="success" variant="flat" className="text-[10px] h-4 mt-0.5">Notificado</Chip>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button isIconOnly size="sm" variant="light" as="a" href={doc.BLOBURL} target="_blank" rel="noopener noreferrer">
                                    <Search size={16} className="text-gray-500" />
                                  </Button>
                                  <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => handleDeleteDocumento(doc._id)}>
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </div>
              )}
          </ModalBody>
          <ModalFooter className="border-t border-gray-100">
            <Button variant="flat" onPress={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={saving}
              isDisabled={!isCreate && getSnapshot(form, ambientes, responsaveis, contratantes, contatos) === initialStateSnapshot}
              style={{ backgroundColor: "#44735e" }}
            >
              Salvar Alterações
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
