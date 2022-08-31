export enum OP {
    AUTH = "AUTH",
    SEND = "SEND",
    HANDSHAKE = "HANDSHAKE",
    ERROR = "ERROR",
}

export interface OPAuthPayload {
    nickname: string
    publicKey: string
}
export interface OPSendPayload {
    from: string
    message: string
}
export interface OPErrorPayload {
    message: string
    code: ERROR_CODE
}
export interface OPHandShakePayload {
    issuer?: string
    publicKey?: string
    symmetricKey?: string
}

export enum ERROR_CODE {
    NICKNAME_ALREADY_TAKEN = "NICKNAME_ALREADY_TAKEN"
}

export function GetPayload(operation: OP, data: any, ...middlwares: Array<(op: OP, data: string) => string>): string {
    
    if (typeof data !== "string") data =  JSON.stringify(data)
    
    middlwares.forEach(middlware => {
        data = middlware(operation, data)
    })

    return `${operation}=${data}`


}

export function ParsePayload(payload: Buffer, ...middlwares: Array<(op: OP, data: string) => string>): {
    operation: OP,
    data: any
} {
    const payloadAsString = payload.toString()

    const equalsIndex = payloadAsString.indexOf("=")

    if (equalsIndex === -1) throw new Error("Invalid data")

    const op = payloadAsString.slice(0, equalsIndex)
    let operation: OP = null
    switch (op) {
        case OP.AUTH:
            operation = OP.AUTH
            break
        case OP.ERROR:
            operation = OP.ERROR
            break
        case OP.HANDSHAKE:
            operation = OP.HANDSHAKE
            break
        case OP.SEND:
            operation = OP.SEND
            break
        default:
            throw new Error("Operation not implemented")
    }
    try {
        let data = payloadAsString.slice(equalsIndex + 1)

        middlwares.forEach(middlware => {
            data = middlware(operation, data)
        })

        return {
            operation,
            data: (operation === OP.SEND) ? data : JSON.parse(data) 
        }
    } catch (e) {
        throw new Error(e)
    }
}