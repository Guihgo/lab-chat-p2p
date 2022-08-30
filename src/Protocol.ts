export enum OP {
    AUTH = "AUTH",
    SYNC = "SYNC",
    SEND = "SEND"
}

export enum ERROR_CODE {
    NICKNAME_ALREADY_TAKEN = "NICKNAME_ALREADY_TAKEN"
}

export function GetPayload(operation: OP, payload: any): Buffer {
    return Buffer.from(`${operation}=${JSON.stringify(payload)}`)
}

export function ParsePayload(data: Buffer): {
    operation: OP,
    payload: any
} {
    const dataAsString = data.toString()

    const equalsIndex = dataAsString.indexOf("=")

    if (equalsIndex === -1) throw new Error("Invalid data")

    const op = dataAsString.slice(0, equalsIndex)
    let operation : OP = null
    switch (op) {
        case OP.AUTH:
            operation = OP.AUTH
            break
        case OP.SYNC:
            operation = OP.SYNC
            break
        case OP.SEND:
            operation = OP.SEND
            break
        default: 
            throw new Error("Operation not implemented")
    }

    try {
        return {
            operation,
            payload: JSON.parse(dataAsString.slice(equalsIndex+1))
        }
    } catch (e){
        throw new Error(e)
    }
}