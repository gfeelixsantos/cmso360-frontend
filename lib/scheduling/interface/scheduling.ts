import { MongoOperationTypes } from "../enum/scheduling.enum";

import { Ticket } from "@/lib/ticket/ticket";

export type FileUpload = {
  Name: string;
  Content: string | ArrayBuffer; // string para base64 (agenda C#) e arraybuffer (puro) para transição backend
  Type: string;
  Size: number;
  StoragePath?: string;
  UploadedAt: Date;
  Origin: string;
};

type CompanyRegister = {
  CODIGO: string | null;
  NOMEABREVIADO: string | null;
  RAZAOSOCIALINICIAL: string | null;
  RAZAOSOCIAL: string | null;
  CIDADE: string | null;
  CNPJ: string | null;
  ATIVO: string | null;
  CODIGOINTERNO: string;
};

export type Client = {
  Id: string;
  Name: string;
  Companys: CompanyRegister[];
  Active: boolean;
  Profile: string;
  Phone: string;
  Contract: boolean;
  Email: string;
};

export type RiscosAso = {
  codigo: string;
  risco: string;
  grupo: string;
};

export type SignatureStatus =
  // Padrão Final PT-BR
  | "NAO_REQUER_ASSINATURA"
  | "AGUARDANDO_AUTENTICACAO"
  | "AGUARDANDO_REPROCESSAMENTO"
  | "PROCESSANDO_ASSINATURA"
  | "ASSINADO"
  | "FALHA_ASSINATURA"
  // Transitório EN (Compatibilidade)
  | "NOT_REQUIRED"
  | "WAITING_AUTH"
  | "PENDING_RETRY"
  | "PROCESSING"
  | "SIGNED"
  | "FAILED";

export type SignatureInfo = {
  status: SignatureStatus;
  provider?: string;
  lastAttempt?: Date;
  nextRetryAt?: Date;
  retryCount: number;
  lastError?: string;
  lastErrorCategory?: string;
  signedAt?: Date;
};

export type AsoInfo = {
  asoUrl?: string;
  validacaoUrl?: string;
  url?: string;
  validacao?: string;
  status?: string;
  tipoAssinatura?: string;
  assinatura?: string;
  updatedAt?: { $date: string } | string;
  error?: string | null;
  retry?: {
    retryCount: number;
    lastAttempt: Date;
    nextRetryAt: Date;
    lastError: string;
  };
};

export class ExamRegister {
  id?: string;
  codigoExame: string;
  nomeExame: string;
  status: string;
  preparacao: string = "";
  dataExame: string = "";
  sequencialResultadoExame?: string = "";
  sala?: string = "";
  profissional?: string = "";
  codigoProfissional?: string = "";
  url: string = "";
  formulario: any;
  grupo: string = "";
  signatureInfo?: SignatureInfo;

  constructor(
    codigoExame: string,
    nomeExame: string,
    status: string,
    id?: string,
  ) {
    this.codigoExame = codigoExame;
    this.nomeExame = nomeExame;
    this.status = status;
    if (id) this.id = id;
  }
}

export type Scheduling = {
  ANEXOS: FileUpload[];
  ANOTACOES: string | null;
  ASOSTATUS: string;
  ATENDIMENTOSTATUS: string;
  CNPJEMPRESA: string;
  CLIENT?: Client;
  CODIGO: string;
  CODIGOCARGO: string;
  CODIGOEMPRESA: string;
  CODIGOINTERNOEMPRESA: string | null;
  CODIGOPRONTUARIO: string;
  CODIGOSETOR: string;
  CODIGOUNIDADE: string;
  CPFEMPRESA: string;
  CPFFUNCIONARIO: string;
  // CREATED: { $date: { $numberLong: number } };
  DATAAGENDAMENTO: string;
  DATAAGENDAMENTO_DATE: Date;
  DATANASCIMENTO: string | null;
  EXAMES: ExamRegister[];
  HORARIO: string;
  MATRICULAFUNCIONARIO: string;
  MEDICO: string;
  NOME: string;
  NOMECARGO: string;
  NOMEEMPRESA: string;
  NOMESETOR: string;
  NOMEUNIDADE: string;
  OBSERVACOES: string | null;
  PARECERMEDICO: string | null;
  PRONTUARIOSVINCULADOS: string[];
  RECOMENDACAOMEDICA: string | null;
  RISCOSASO: RiscosAso[] | null;
  SCHEDULINGCODE: string;
  SEQUENCIAFICHA: string;
  SITUACAO: string;
  SUBGRUPOEMPRESA: string | null;
  TELEFONE?: string;
  // TERM: boolean;
  TICKET: Ticket;
  TIPOEXAME: string;
  TIPOEXAMENOME: string;
  UNIDADEATENDIMENTO: string;
  ASOINFO?: AsoInfo;
  _id: string;
};

export type SchedulingChange = {
  operation: MongoOperationTypes;
  schedule: Scheduling;
};
