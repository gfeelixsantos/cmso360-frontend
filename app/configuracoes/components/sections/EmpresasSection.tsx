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
  ambiente: string;
  descricao: string;
}

interface ResponsavelTecnico {
  nome: string;
  documentos: ("PCMSO" | "PGR" | "LTCAT")[];
  registro: string;
  uf: string;
  dataInicio?: string;
  dataFim?: string;
}

interface ContratanteEmpresa {
  cnpj: string;
  razaoSocial: string;
  cidade: string;
  uf: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  cnae?: string;
  grauDeRisco?: number;
}

interface ContatoEmpresa {
  nome: string;
  email: string;
  telefone: string;
  perfil: string;
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
  cnaesSecundarios?: string[];
  representanteLegal?: string;
  codigoIbgeMunicipio?: string;
  situacaoCadastral?: string;
  email?: string;
  telefone?: string;
  endereco?: Endereco;
  ENDERECO?: string;
  NUMEROENDERECO?: string;
  COMPLEMENTOENDERECO?: string;
  BAIRRO?: string;
  CIDADE?: string;
  CEP?: string;
  UF?: string;
  ambientesEdificacao?: AmbienteEdificacao[];
  responsaveisTecnicos?: ResponsavelTecnico[];
  contratantes?: ContratanteEmpresa[];
  configuracoes?: {
    requerPsicologa: boolean;
    credenciadaSoc: boolean;
    somenteComplementares?: boolean;
    faturamento?: "CMSO" | "SEGTEC";
    devedor?: boolean;
    asoRapidoAutomatico?: boolean;
  };
  contatos?: ContatoEmpresa[];
  documentosUrl?: string[];
  codigoInternoCliente?: string;
  'CÓD. CLIENTE (INT.)'?: string;
  avisos?: string;
  observacoes?: string;
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
    configuracoes: {
      requerPsicologa: false,
      credenciadaSoc: false,
      somenteComplementares: false,
      faturamento: "CMSO",
      devedor: false,
      asoRapidoAutomatico: false,
    },
    codigoInternoCliente: "",
    avisos: "",
    observacoes: "",
  });

  const [ambientes, setAmbientes] = useState<AmbienteEdificacao[]>([]);
  const [responsaveis, setResponsaveis] = useState<ResponsavelTecnico[]>([]);
  const [contratantes, setContratantes] = useState<ContratanteEmpresa[]>([]);
  const [contatos, setContatos] = useState<ContatoEmpresa[]>([]);

  // Temporary row states for adding
  const [newAmbiente, setNewAmbiente] = useState<AmbienteEdificacao>({ ambiente: "", descricao: "" });
  const [newResponsavel, setNewResponsavel] = useState<ResponsavelTecnico>({
    nome: "",
    documentos: [],
    registro: "",
    uf: "",
    dataInicio: "",
    dataFim: "",
  });
  const [newContratante, setNewContratante] = useState<ContratanteEmpresa>({
    cnpj: "",
    razaoSocial: "",
    cidade: "",
    uf: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cep: "",
    cnae: "",
    grauDeRisco: 1,
  });
  const [newContato, setNewContato] = useState<ContatoEmpresa>({
    nome: "",
    email: "",
    telefone: "",
    perfil: "",
  });
  const [buscandoContratanteCnpj, setBuscandoContratanteCnpj] = useState(false);
  const [syncingContacts, setSyncingContacts] = useState(false);

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
            nome: c.nome || c.nomeContato || c.contato || "Contato SOC",
            email: c.primeiroEmail || c.email || "",
            telefone: c.telefone || (c.dddTelefone && c.telefone ? `(${c.dddTelefone}) ${c.telefone}` : "") || "",
            perfil: c.nomePerfil || c.codigoPerfil || "",
          })).filter(c => c.email);
          
          if (mapped.length === 0) {
            alert("Nenhum contato com e-mail encontrado no SOC para esta empresa.");
            return;
          }
          
          const novosContatos = [...contatos];
          let adicionados = 0;
          mapped.forEach((c) => {
            if (!novosContatos.some((existing) => existing.email.toLowerCase() === c.email.toLowerCase())) {
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
            nome: c.nome || c.nomeContato || c.contato || "Contato SOC",
            email: c.primeiroEmail || c.email || "",
            telefone: c.telefone || (c.dddTelefone && c.telefone ? `(${c.dddTelefone}) ${c.telefone}` : "") || "",
            perfil: c.nomePerfil || c.codigoPerfil || "",
          })).filter(c => c.email);
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
        cnaesSecundarios: Array.isArray(data.cnaes_secundarios) ? data.cnaes_secundarios.map((c: any) => String(c.codigo || "")) : [],
        representanteLegal: Array.isArray(data.qsa) && data.qsa[0] ? data.qsa[0].nome : "",
        codigoIbgeMunicipio: data.codigo_municipio_ibge ? String(data.codigo_municipio_ibge) : "",
        situacaoCadastral: data.descricao_situacao_cadastral || "",
        email: data.email || "",
        telefone: data.ddd_telefone_1 || data.telefone || "",
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
    setForm({
      CODIGO: company.CODIGO,
      CNPJ: company.CNPJ || "",
      RAZAOSOCIAL: company.RAZAOSOCIAL || "",
      NOMEABREVIADO: company.NOMEABREVIADO || "",
      CNAE: company.CNAE || "",
      RAMO_ATIVIDADE: company.RAMO_ATIVIDADE || "",
      GRAU_RISCO: company.GRAU_RISCO || 1,
      NUMERO_FUNCIONARIOS: company.NUMERO_FUNCIONARIOS || 0,
      FONE_FAX: company.FONE_FAX || "",
      cnaesSecundarios: company.cnaesSecundarios || [],
      representanteLegal: company.representanteLegal || "",
      codigoIbgeMunicipio: company.codigoIbgeMunicipio || "",
      situacaoCadastral: company.situacaoCadastral || "",
      email: company.email || "",
      telefone: company.telefone || "",
      ENDERECO: company.ENDERECO || "",
      NUMEROENDERECO: company.NUMEROENDERECO || "",
      COMPLEMENTOENDERECO: company.COMPLEMENTOENDERECO || "",
      BAIRRO: company.BAIRRO || "",
      CIDADE: company.CIDADE || "",
      CEP: company.CEP || "",
      UF: company.UF || "",
      configuracoes: {
        requerPsicologa: company.configuracoes?.requerPsicologa ?? false,
        credenciadaSoc: company.configuracoes?.credenciadaSoc ?? false,
        somenteComplementares: company.configuracoes?.somenteComplementares ?? false,
        faturamento: company.configuracoes?.faturamento ?? "CMSO",
        devedor: company.configuracoes?.devedor ?? false,
        asoRapidoAutomatico: company.configuracoes?.asoRapidoAutomatico ?? false,
      },
      codigoInternoCliente: company.codigoInternoCliente || company["CÓD. CLIENTE (INT.)"] || "",
      avisos: company.avisos || "",
      observacoes: company.observacoes || "",
    });
    setAmbientes(company.ambientesEdificacao || []);
    setResponsaveis(company.responsaveisTecnicos || []);
    setContratantes(company.contratantes || []);
    setContatos(company.contatos || []);
    setActiveTab("dados");
    setModalOpen(true);
    fetchDocumentos(company.CODIGO);
  }

  function openCreate() {
    setIsCreate(true);
    setEditing(null);
    setForm({
      CODIGO: "",
      CNPJ: "",
      RAZAOSOCIAL: "",
      NOMEABREVIADO: "",
      CNAE: "",
      RAMO_ATIVIDADE: "",
      GRAU_RISCO: 1,
      NUMERO_FUNCIONARIOS: 0,
      FONE_FAX: "",
      cnaesSecundarios: [],
      representanteLegal: "",
      codigoIbgeMunicipio: "",
      situacaoCadastral: "",
      email: "",
      telefone: "",
      ENDERECO: "",
      NUMEROENDERECO: "",
      COMPLEMENTOENDERECO: "",
      BAIRRO: "",
      CIDADE: "",
      CEP: "",
      UF: "",
      configuracoes: {
        requerPsicologa: false,
        credenciadaSoc: false,
        somenteComplementares: false,
        faturamento: "CMSO",
        devedor: false,
        asoRapidoAutomatico: false,
      },
      codigoInternoCliente: "",
      avisos: "",
      observacoes: "",
    });
    setAmbientes([]);
    setResponsaveis([]);
    setContratantes([]);
    setContatos([]);
    setActiveTab("dados");
    setSocCompanies([]);
    setImportingSoc(false);
    setCnpjBusca("");
    setDocumentos([]);
    setShowUploadForm(false);
    setModalOpen(true);
    fetchSocCompaniesList();
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
          ambientesEdificacao: ambientes,
          responsaveisTecnicos: responsaveis,
          contratantes: contratantes,
          contatos: contatos,
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
    if (!newAmbiente.ambiente.trim() || !newAmbiente.descricao.trim()) return;
    setAmbientes([...ambientes, newAmbiente]);
    setNewAmbiente({ ambiente: "", descricao: "" });
  }

  function removeAmbiente(index: number) {
    setAmbientes(ambientes.filter((_, i) => i !== index));
  }

  function addResponsavel() {
    if (!newResponsavel.nome.trim() || !newResponsavel.registro.trim() || newResponsavel.documentos.length === 0) {
      alert("Por favor, preencha nome, registro e selecione ao menos um documento.");
      return;
    }
    setResponsaveis([...responsaveis, newResponsavel]);
    setNewResponsavel({
      nome: "",
      documentos: [],
      registro: "",
      uf: "",
      dataInicio: "",
      dataFim: "",
    });
  }

  function removeResponsavel(index: number) {
    setResponsaveis(responsaveis.filter((_, i) => i !== index));
  }

  async function handleBuscarCnpjContratante() {
    if (!newContratante.cnpj.trim()) return;
    setBuscandoContratanteCnpj(true);
    try {
      const result = await handleBuscarCnpj(true, newContratante.cnpj);
      if (result) {
        setNewContratante({
          cnpj: result.cnpj,
          razaoSocial: result.razaoSocial,
          cidade: result.cidade,
          uf: result.uf,
          logradouro: result.logradouro,
          numero: result.numero,
          bairro: result.bairro,
          cep: result.cep,
          cnae: result.cnae,
          grauDeRisco: result.grauDeRisco || 1,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuscandoContratanteCnpj(false);
    }
  }

  function addContratante() {
    if (!newContratante.cnpj.trim() || !newContratante.razaoSocial.trim()) return;
    setContratantes([...contratantes, newContratante]);
    setNewContratante({
      cnpj: "",
      razaoSocial: "",
      cidade: "",
      uf: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cep: "",
      cnae: "",
      grauDeRisco: 1,
    });
  }

  function removeContratante(index: number) {
    setContratantes(contratantes.filter((_, i) => i !== index));
  }

  function addContato() {
    if (!newContato.nome.trim() || !newContato.email.trim()) {
      alert("Por favor, preencha pelo menos Nome e E-mail.");
      return;
    }
    setContatos([...contatos, newContato]);
    setNewContato({ nome: "", email: "", telefone: "", perfil: "" });
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
                  inputWrapper: "h-9",
                }}
              />
              <Button
                color="primary"
                onPress={openCreate}
                startContent={<Plus size={16} />}
                className="bg-[#44735e] h-9 text-xs font-semibold"
              >
                Nova Empresa
              </Button>
            </div>
          </div>

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
                    (company.responsaveisTecnicos || []).flatMap(r => r.documentos || [])
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
                          {company.configuracoes?.devedor ? (
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
                          {company.responsaveisTecnicos && company.responsaveisTecnicos.length > 0 ? (
                            company.responsaveisTecnicos.map((r, idx) => (
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

      <Modal isOpen={modalOpen} onOpenChange={setModalOpen} size="5xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1.5 border-b border-gray-100 pb-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-bold text-gray-800">
                {isCreate ? "Cadastrar Nova Empresa" : form.RAZAOSOCIAL}
              </span>
              {!isCreate && (
                <div className="flex flex-wrap gap-1">
                  {form.configuracoes?.requerPsicologa && (
                    <Chip size="sm" color="secondary" variant="flat">Psicologia</Chip>
                  )}
                  {form.configuracoes?.credenciadaSoc && (
                    <Chip size="sm" color="primary" variant="flat">SOC</Chip>
                  )}
                  {form.configuracoes?.asoRapidoAutomatico && (
                    <Chip size="sm" color="warning" variant="flat">ASO Auto</Chip>
                  )}
                  {form.configuracoes?.somenteComplementares && (
                    <Chip size="sm" color="success" variant="flat">Complementar</Chip>
                  )}
                  {form.configuracoes?.faturamento && (
                    <Chip size="sm" color="default" variant="flat">Fat: {form.configuracoes.faturamento}</Chip>
                  )}
                  {form.configuracoes?.devedor && (
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
          <ModalBody className="py-6">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as string)}
              aria-label="Dados complementares da empresa"
              classNames={{
                tabList: "sticky top-0 z-50 bg-white w-full border-b border-gray-100 py-1.5",
              }}
            >
              <Tab key="dados" title="Dados Gerais">
                {isCreate && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-gray-100/80 border border-gray-200/50 shadow-sm flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-default-500 font-semibold text-xs uppercase tracking-wider">
                      <Database size={14} className="text-[#44735e]" />
                      <span>Importar Dados do SOC (Opcional)</span>
                    </div>
                    <Select
                      placeholder={importingSoc ? "Carregando empresas..." : "Selecione uma empresa da lista do SOC..."}
                      size="sm"
                      isLoading={importingSoc}
                      items={socCompanies}
                      onChange={(e) => handleImportSoc(e.target.value)}
                      variant="bordered"
                      classNames={{
                        trigger: "bg-white border-gray-200 hover:border-gray-300 focus:border-[#44735e] shadow-none",
                      }}
                    >
                      {(comp) => (
                        <SelectItem key={comp.CODIGO} textValue={`${comp.CODIGO} - ${comp.RAZAOSOCIAL}`}>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-800">{comp.RAZAOSOCIAL}</span>
                            <span className="text-xs text-gray-400 font-mono">SOC: {comp.CODIGO} | CNPJ: {comp.CNPJ || "-"}</span>
                          </div>
                        </SelectItem>
                      )}
                    </Select>
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
                    value={form.codigoInternoCliente}
                    onValueChange={(v) => setForm((f) => ({ ...f, codigoInternoCliente: v }))}
                  />
                  <Input
                    label="E-mail de Contato"
                    value={form.email}
                    onValueChange={(v) => setForm((f) => ({ ...f, email: v }))}
                  />
                  <Input
                    label="Telefone Adicional"
                    value={form.telefone}
                    onValueChange={(v) => setForm((f) => ({ ...f, telefone: v }))}
                  />
                  <Input
                    label="Representante Legal"
                    value={form.representanteLegal}
                    onValueChange={(v) => setForm((f) => ({ ...f, representanteLegal: v }))}
                  />
                  <Input
                    label="Situação Cadastral"
                    value={form.situacaoCadastral}
                    onValueChange={(v) => setForm((f) => ({ ...f, situacaoCadastral: v }))}
                    placeholder="ATIVA, BAILADA, INAPTA"
                  />
                  <Input
                    label="Código IBGE Município"
                    value={form.codigoIbgeMunicipio}
                    onValueChange={(v) => setForm((f) => ({ ...f, codigoIbgeMunicipio: v }))}
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
                    value={form.avisos}
                    onValueChange={(v) => setForm((f) => ({ ...f, avisos: v }))}
                    className="col-span-2"
                  />
                  <Textarea
                    label="Observações"
                    placeholder="Digite observações complementares..."
                    value={form.observacoes}
                    onValueChange={(v) => setForm((f) => ({ ...f, observacoes: v }))}
                    className="col-span-2"
                  />
                  {form.cnaesSecundarios && form.cnaesSecundarios.length > 0 && (
                    <div className="col-span-2 p-3 bg-gray-50 rounded-lg border border-gray-100 mt-1">
                      <span className="text-xs font-semibold text-gray-500 block mb-1">CNAEs Secundários</span>
                      <div className="flex flex-wrap gap-1.5">
                        {form.cnaesSecundarios.map((cnae) => (
                          <Chip key={cnae} size="sm" variant="flat" color="secondary" className="font-mono text-xs">
                            {cnae}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Tab>

              <Tab key="config" title="Configurações">
                <div className="flex flex-col gap-6 pt-6 pl-2">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">Entrevista para Avaliação Psicossocial</span>
                      <span className="text-xs text-gray-400">Ativa o encaminhamento obrigatório para psicóloga</span>
                    </div>
                    <Switch
                      isSelected={form.configuracoes?.requerPsicologa}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          configuracoes: { ...f.configuracoes!, requerPsicologa: v },
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
                      isSelected={form.configuracoes?.credenciadaSoc}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          configuracoes: { ...f.configuracoes!, credenciadaSoc: v },
                        }))
                      }
                      color="success"
                    />
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">ASO Rápido Automático</span>
                      <span className="text-xs text-gray-400">Gera ASO no SOC automaticamente ao realizar agendamento</span>
                    </div>
                    <Switch
                      isSelected={form.configuracoes?.asoRapidoAutomatico || false}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          configuracoes: { ...f.configuracoes!, asoRapidoAutomatico: v },
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
                      isSelected={form.configuracoes?.somenteComplementares}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          configuracoes: { ...f.configuracoes!, somenteComplementares: v },
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
                      selectedKeys={form.configuracoes?.faturamento ? [form.configuracoes.faturamento] : []}
                      size="sm"
                      className="max-w-[200px]"
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as "CMSO" | "SEGTEC";
                        setForm((f) => ({
                          ...f,
                          configuracoes: { ...f.configuracoes!, faturamento: val },
                        }));
                      }}
                    >
                      <SelectItem key="CMSO">CMSO</SelectItem>
                      <SelectItem key="SEGTEC">SEGTEC</SelectItem>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-gray-700">Devedor</span>
                      <span className="text-xs text-gray-400">Bloqueia atendimento e faturamento por inadimplência</span>
                    </div>
                    <Switch
                      isSelected={form.configuracoes?.devedor || false}
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          configuracoes: { ...f.configuracoes!, devedor: v },
                        }))
                      }
                      color="danger"
                    />
                  </div>
                </div>
              </Tab>

              <Tab key="edificacao" title="Edificação (PGR)">
                <div className="pt-4 space-y-4">
                  <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <Input
                      label="Ambiente / Item"
                      placeholder="Ex: Piso, Parede, Teto"
                      value={newAmbiente.ambiente}
                      onValueChange={(v) => setNewAmbiente((a) => ({ ...a, ambiente: v }))}
                      size="sm"
                    />
                    <Input
                      label="Descrição Física"
                      placeholder="Ex: Piso cerâmico antiderrapante..."
                      value={newAmbiente.descricao}
                      onValueChange={(v) => setNewAmbiente((a) => ({ ...a, descricao: v }))}
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
                          <TableCell className="font-semibold text-gray-700">{item.ambiente}</TableCell>
                          <TableCell className="text-gray-500">{item.descricao}</TableCell>
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
              </Tab>

              <Tab key="responsaveis" title="Responsáveis Técnicos">
                <div className="pt-4 space-y-4">
                  <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-3">
                        <Input
                          label="Nome"
                          placeholder="Nome do profissional"
                          value={newResponsavel.nome}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, nome: v }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Select
                          label="Documentos"
                          placeholder="Selecione os documentos..."
                          selectionMode="multiple"
                          selectedKeys={new Set(newResponsavel.documentos)}
                          onSelectionChange={(keys) =>
                            setNewResponsavel((r) => ({ ...r, documentos: Array.from(keys) as any[] }))
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
                          value={newResponsavel.registro}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, registro: v }))}
                        />
                      </div>
                      <div className="col-span-1 md:col-span-1">
                        <Input
                          label="UF"
                          placeholder="SP"
                          value={newResponsavel.uf}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, uf: v }))}
                          maxLength={2}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          label="Data Início"
                          type="date"
                          value={newResponsavel.dataInicio || ""}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, dataInicio: v }))}
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          label="Data Fim"
                          type="date"
                          value={newResponsavel.dataFim || ""}
                          onValueChange={(v) => setNewResponsavel((r) => ({ ...r, dataFim: v }))}
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
                          <TableCell className="font-semibold text-gray-700">{item.nome}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(item.documentos || []).map((doc) => (
                                <Chip key={doc} size="sm" variant="flat" color="secondary">
                                  {doc}
                                </Chip>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500 font-mono text-xs">
                            {item.registro} - {item.uf.toUpperCase()}
                          </TableCell>
                          <TableCell className="text-gray-500 text-xs">
                            {item.dataInicio ? new Date(item.dataInicio + "T00:00:00").toLocaleDateString("pt-BR") : "-"} até {item.dataFim ? new Date(item.dataFim + "T00:00:00").toLocaleDateString("pt-BR") : "-"}
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
              </Tab>

              <Tab key="contratantes" title="Contratantes">
                <div className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="col-span-1 md:col-span-2 flex gap-2 items-end">
                      <Input
                        label="CNPJ"
                        placeholder="CNPJ da contratante"
                        value={newContratante.cnpj}
                        onValueChange={(v) => setNewContratante((c) => ({ ...c, cnpj: v }))}
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
                      value={newContratante.razaoSocial}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, razaoSocial: v }))}
                      size="sm"
                      className="col-span-1 md:col-span-2"
                    />

                    <Input
                      label="CEP"
                      placeholder="00000-000"
                      value={newContratante.cep}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, cep: v }))}
                      size="sm"
                    />

                    <Input
                      label="Logradouro"
                      placeholder="Rua / Av"
                      value={newContratante.logradouro}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, logradouro: v }))}
                      size="sm"
                      className="col-span-1 md:col-span-2"
                    />

                    <Input
                      label="Número"
                      placeholder="123"
                      value={newContratante.numero}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, numero: v }))}
                      size="sm"
                    />

                    <Input
                      label="Bairro"
                      placeholder="Bairro"
                      value={newContratante.bairro}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, bairro: v }))}
                      size="sm"
                    />

                    <Input
                      label="Cidade"
                      placeholder="Cidade"
                      value={newContratante.cidade}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, cidade: v }))}
                      size="sm"
                    />

                    <Input
                      label="UF"
                      placeholder="SP"
                      value={newContratante.uf}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, uf: v }))}
                      size="sm"
                      maxLength={2}
                    />

                    <Input
                      label="CNAE"
                      placeholder="CNAE"
                      value={newContratante.cnae}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, cnae: v }))}
                      size="sm"
                    />

                    <Input
                      label="Grau de Risco"
                      placeholder="1 a 4"
                      type="number"
                      value={String(newContratante.grauDeRisco || 1)}
                      onValueChange={(v) => setNewContratante((c) => ({ ...c, grauDeRisco: Number(v) || 1 }))}
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
                          <TableCell className="font-semibold text-gray-700">{item.razaoSocial}</TableCell>
                          <TableCell className="font-mono text-xs">{item.cnpj}</TableCell>
                          <TableCell className="text-xs">
                            CNAE: {item.cnae || "-"} / Risco: {item.grauDeRisco || 1}
                          </TableCell>
                          <TableCell className="text-gray-500 text-xs">
                            {item.logradouro ? `${item.logradouro}, ${item.numero || "S/N"} - ` : ""}{item.cidade} - {item.uf.toUpperCase()}
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
              </Tab>

              <Tab key="contatos" title="Contatos">
                <div className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <Input
                      label="Nome"
                      placeholder="Nome do contato"
                      value={newContato.nome}
                      onValueChange={(v) => setNewContato((c) => ({ ...c, nome: v }))}
                      size="sm"
                    />
                    <Input
                      label="E-mail"
                      placeholder="email@empresa.com"
                      value={newContato.email}
                      onValueChange={(v) => setNewContato((c) => ({ ...c, email: v }))}
                      size="sm"
                    />
                    <Input
                      label="Telefone"
                      placeholder="(00) 00000-0000"
                      value={newContato.telefone}
                      onValueChange={(v) => setNewContato((c) => ({ ...c, telefone: v }))}
                      size="sm"
                    />
                    <Input
                      label="Perfil (SOC)"
                      placeholder="Nome do perfil (ex: ASO)"
                      value={newContato.perfil}
                      onValueChange={(v) => setNewContato((c) => ({ ...c, perfil: v }))}
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
                      <Button color="primary" onPress={addContato} startContent={<Plus size={16} />} size="md" className="bg-[#44735e] px-8">
                        Adicionar Contato
                      </Button>
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
                          <TableCell className="font-semibold text-gray-700">{item.nome}</TableCell>
                          <TableCell className="text-gray-500 font-mono text-xs">{item.email}</TableCell>
                          <TableCell className="text-gray-500 text-xs">{item.telefone || "-"}</TableCell>
                          <TableCell className="text-gray-500 text-xs font-mono">{item.perfil || "-"}</TableCell>
                          <TableCell>
                            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => removeContato(index)}>
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Tab>

              <Tab key="documentos" title="Documentos">
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
                                email: "__all__",
                                nome: "Todos os Contatos",
                                textValue: "Todos os Contatos",
                                descricao: "Enviar para todos os contatos registrados",
                              },
                              ...contatos.map((c) => ({
                                ...c,
                                textValue: `${c.nome} (${c.email})`,
                              })),
                            ]}
                            selectedKeys={
                              contatos.length > 0 &&
                              newDocData.contatosNotificados.length === contatos.length &&
                              contatos.every(c => newDocData.contatosNotificados.includes(c.email))
                                ? new Set(['__all__'])
                                : new Set(newDocData.contatosNotificados)
                            }
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys) as string[];
                              if (selected.includes('__all__')) {
                                const allSelected = contatos.length > 0 &&
                                  newDocData.contatosNotificados.length === contatos.length &&
                                  contatos.every(c => newDocData.contatosNotificados.includes(c.email));
                                setNewDocData({
                                  ...newDocData,
                                  contatosNotificados: allSelected ? [] : contatos.map(c => c.email),
                                });
                                } else {
                                  setNewDocData({ ...newDocData, contatosNotificados: selected });
                                }
                              }}
                            >
                            {(c) =>
                              c.email === "__all__" ? (
                                <SelectItem key="__all__" textValue={c.textValue}>
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{c.nome}</span>
                                    <span className="text-tiny text-default-400">{c.descricao}</span>
                                  </div>
                                </SelectItem>
                              ) : (
                                <SelectItem key={c.email} textValue={c.textValue}>
                                  <div className="flex flex-col">
                                    <span>{c.nome}</span>
                                    <span className="text-tiny text-default-400">{c.email}</span>
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
                                  <span className="font-semibold text-gray-700">{doc.tipoDocumento}</span>
                                  <span className="text-xs text-gray-400 font-mono">{doc.nomeArquivoOriginal}</span>
                                </div>
                              </TableCell>
                              <TableCell>{doc.dataReferencia || "-"}</TableCell>
                              <TableCell>{doc.criadoEm ? new Date(doc.criadoEm).toLocaleDateString("pt-BR") : "-"}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs">{doc.criadoPor}</span>
                                  {doc.comunicarEmail && <Chip size="sm" color="success" variant="flat" className="text-[10px] h-4 mt-0.5">Notificado</Chip>}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button isIconOnly size="sm" variant="light" as="a" href={doc.blobUrl} target="_blank" rel="noopener noreferrer">
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
              </Tab>
            </Tabs>
          </ModalBody>
          <ModalFooter className="border-t border-gray-100">
            <Button variant="flat" onPress={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={saving}
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
