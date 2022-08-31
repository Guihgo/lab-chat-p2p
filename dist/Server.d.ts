/// <reference types="node" />
import { SocketAddress, Server, Socket } from "net";
import { OPHandShakePayload } from "./Protocol";
export declare const CHAT_SERVER_PREFIX = "[Chat::Server]\t";
export interface ServerConfig {
    socketAddress: SocketAddress;
}
interface Client {
    socket: Socket;
    nickname: string;
    publicKey: string;
}
interface Room {
    name: string;
    clients: {
        [id: string]: Client;
    };
}
export declare class ChatServer {
    config: ServerConfig;
    server: Server;
    genesisRoom: Room;
    rooms: Array<Room>;
    constructor(config: ServerConfig);
    init(): Promise<void>;
    onServerError(e: any): void;
    onClientError(e: any, socket: Socket): void;
    connectionListener(socket: Socket): void;
    getClientId(socket: Socket): string;
    getClient(nickname: string): Client;
    authClient(client: Client): void;
    sendMessage(from: Client["nickname"], { message }: {
        message: any;
    }): void;
    handShake(client: Client, payload?: OPHandShakePayload): void;
}
export {};
