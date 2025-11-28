import { WebsocketType } from "@/lib/websocket/enums/websocket.enum";

export interface IUserInfo {
  codigo: string;
  nome: string;
  cpf: string;
  conselho?: string;
  ufconselho?: string;
  perfil: string;
}

export interface IUserLogin {
  cpf: string;
  password: string;
}

export interface IUserRegister extends IUserLogin {
  codigo: string;
}

export interface IUserWebsocket {
  unidade: string;
  exame?: string;
  sala: string;
  id?: string;
  nome: string;
  type: WebsocketType;
}
