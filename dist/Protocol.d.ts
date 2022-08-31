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
export interface OPHandShakePayload {
    issuer?: string;
    publicKey?: string;
    symmetricKey?: string;
}
export declare enum ERROR_CODE {
    NICKNAME_ALREADY_TAKEN = "NICKNAME_ALREADY_TAKEN"
}
export declare function GetPayload(operation: OP, data: any, ...middlwares: Array<(op: OP, data: string) => string>): string;
export declare function ParsePayload(payload: Buffer, ...middlwares: Array<(op: OP, data: string) => string>): {
    operation: OP;
    data: any;
};
