/// <reference types="node" />
export declare enum OP {
    AUTH = "AUTH",
    SEND = "SEND",
    HANDSHAKE = "HANDSHAKE",
    ERROR = "ERROR"
}
export interface OPAuthPayload {
    nickname: string;
    publicKey: string;
}
export interface OPSendPayload {
    from: string;
    message: string;
}
export interface OPErrorPayload {
    message: string;
    code: ERROR_CODE;
}
export declare enum ERROR_CODE {
    NICKNAME_ALREADY_TAKEN = "NICKNAME_ALREADY_TAKEN"
}
export declare function GetPayload(operation: OP, payload: any): Buffer;
export declare function ParsePayload(data: Buffer): {
    operation: OP;
    payload: any;
};
