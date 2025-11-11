import { Ticket } from "@/lib/ticket/ticket";
import { MongoOperationTypes } from "../enum/scheduling.enum";

export type FileUpload = {
  Name: string;
  Content: string | ArrayBuffer; // string para base64 (agenda C#) e arraybuffer (puro) para transição backend
  Type: string;
  Size: number;
  StoragePath?: string;
  UploadedAt: Date;
  Origin: string;
}

type CompanyRegister = {
  CODIGO: string | null;
  NOMEABREVIADO: string | null;
  RAZAOSOCIALINICIAL: string | null;
  RAZAOSOCIAL: string | null;
  CIDADE: string | null;
  CNPJ: string | null;
  ATIVO: string | null;
  CODIGOINTERNO: string;
}

export type Client = {
  Id: string;
  Name: string;
  Companys: CompanyRegister[];
  Active: boolean;
  Profile: string;
  Phone: string;
  Contract: boolean;
  Email: string;
}

export type RiscosAso = {
  codigo: string,
  risco: string,
  grupo: string,
}


export class ExamRegister {
    codigoExame:string
    nomeExame:string
    status: string
    preparacao:string  = ""
    dataExame: string = ""
    sequencialResultadoExame?:string
    sala?: string
    profissional?:string
    codigoProfissional?: string;
    url:string = ""
    formulario: any
    grupo: string = ""

    constructor(codigoExame:string, nomeExame:string, status:string)
    {
        this.codigoExame = codigoExame
        this.nomeExame = nomeExame
        this.status = status
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
  TICKET: Ticket
  TIPOEXAME: string;
  TIPOEXAMENOME: string;
  UNIDADEATENDIMENTO: string;
  _id: string;
}




export type SchedulingChange = {
  operation: MongoOperationTypes,
  schedule: Scheduling
}
