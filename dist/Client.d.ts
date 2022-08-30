/// <reference types="node" />
import { SocketAddress, Socket } from "net";
export declare const CHAT_CLIENT_PREFIX = "[Chat::Client]\t";
interface ClientConfig {
    socketAddress: SocketAddress;
}
export declare class ChatClient {
    config: ClientConfig;
    server: Socket;
    constructor(config: ClientConfig);
    init(): Promise<void>;
    onServerError(e: any): void;
    onServerData(data: any): void;
}
export {};
