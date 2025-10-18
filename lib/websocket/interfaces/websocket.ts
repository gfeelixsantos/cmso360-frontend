import { IUserWebsocket } from "@/lib/user/interfaces/IUser";
import { WebsocketType } from "../enums/websocket.enum";



export interface IWebsocketHandshake {
    type: WebsocketType
    unidade?: string 
    data?: IUserWebsocket
}


