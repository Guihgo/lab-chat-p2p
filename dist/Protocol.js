"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsePayload = exports.GetPayload = exports.ERROR_CODE = exports.OP = void 0;
var OP;
(function (OP) {
    OP["AUTH"] = "AUTH";
    OP["SEND"] = "SEND";
    OP["HANDSHAKE"] = "HANDSHAKE";
    OP["ERROR"] = "ERROR";
})(OP = exports.OP || (exports.OP = {}));
var ERROR_CODE;
(function (ERROR_CODE) {
    ERROR_CODE["NICKNAME_ALREADY_TAKEN"] = "NICKNAME_ALREADY_TAKEN";
})(ERROR_CODE = exports.ERROR_CODE || (exports.ERROR_CODE = {}));
function GetPayload(operation, payload) {
    return Buffer.from(`${operation}=${JSON.stringify(payload)}`);
}
exports.GetPayload = GetPayload;
function ParsePayload(data) {
    const dataAsString = data.toString();
    const equalsIndex = dataAsString.indexOf("=");
    if (equalsIndex === -1)
        throw new Error("Invalid data");
    const op = dataAsString.slice(0, equalsIndex);
    let operation = null;
    switch (op) {
        case OP.AUTH:
            operation = OP.AUTH;
            break;
        case OP.ERROR:
            operation = OP.ERROR;
            break;
        case OP.HANDSHAKE:
            operation = OP.HANDSHAKE;
            break;
        case OP.SEND:
            operation = OP.SEND;
            break;
        default:
            throw new Error("Operation not implemented");
    }
    try {
        return {
            operation,
            payload: JSON.parse(dataAsString.slice(equalsIndex + 1))
        };
    }
    catch (e) {
        throw new Error(e);
    }
}
exports.ParsePayload = ParsePayload;
