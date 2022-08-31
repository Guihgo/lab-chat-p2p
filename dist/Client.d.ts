/// <reference types="node" />
import { SocketAddress, Socket } from "net";
import { ERROR_CODE, OPSendPayload } from "./Protocol";
export declare const CHAT_CLIENT_PREFIX = "[Chat::Client]\t";
export interface ClientConfig {
    serverAddress: SocketAddress;
    nickname: string;
    onAuthError?: (e: ERROR_CODE) => any;
    onLoggedIn?: () => any;
    onReceive?: (payload: OPSendPayload) => any;
}
interface KeyPair {
    publicKey: string;
    privateKey: string;
}
export declare class ChatClient {
    config: ClientConfig;
    server: Socket;
    protected keyPair: KeyPair;
    constructor(config: ClientConfig);
    init(): Promise<void>;
    onServerError(e: any): void;
    onServerData(data: any): void;
    auth(): Promise<void>;
    setNickname(nickname: ClientConfig["nickname"]): void;
    sendMessage(message: string): void;
    generateKeyPair(passphrase?: string): Promise<KeyPair>;
}
export {};
