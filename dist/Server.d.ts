/// <reference types="node" />
import { SocketAddress, Server, Socket } from "net";
export declare const CHAT_SERVER_PREFIX = "[Chat::Server]\t";
interface ServerConfig {
    socketAddress: SocketAddress;
}
export declare class ChatServer {
    config: ServerConfig;
    server: Server;
    constructor(config: ServerConfig);
    init(): Promise<void>;
    onServerError(e: any): void;
    onClientError(e: any, socket: Socket): void;
    connectionListener(socket: Socket): void;
}
export {};
