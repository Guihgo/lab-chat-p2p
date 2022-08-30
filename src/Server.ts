import { SocketAddress, createServer, Server, Socket } from "net"


export const CHAT_SERVER_PREFIX = "[Chat::Server]\t"

interface ServerConfig {
    socketAddress: SocketAddress
}

export class ChatServer {

    public server: Server

    constructor(public config: ServerConfig) {

    }

    async init() {
        this.server = createServer({ keepAlive: true, noDelay: true }, this.connectionListener.bind(this))
        this.server.on("error", this.onServerError.bind(this))
        this.server.listen(this.config.socketAddress.port, this.config.socketAddress.address, 2, () => {
            console.log(`${CHAT_SERVER_PREFIX} Started at ${this.config.socketAddress.address}:${this.config.socketAddress.port}`)
        })
    }

    onServerError(e: any) {
        console.error(`${CHAT_SERVER_PREFIX} Socket Server Error`, e)
    }

    onClientError(e: any, socket: Socket) {
        if (["ECONNREFUSED", "ECONNRESET"].includes(e.code)) {
            setTimeout(() => {
                console.error(`${CHAT_SERVER_PREFIX} Client ${socket.remoteAddress}:${socket.remotePort} disconnected!`)
            }, 1000)
            return
        }
        console.error(`${CHAT_SERVER_PREFIX} Client Error`, e)

    }

    connectionListener(socket: Socket): void {
        console.log(`${CHAT_SERVER_PREFIX} new socket connection from ${socket.remoteAddress}:${socket.remotePort}`)
        socket.on("error", (e) => {
            this.onClientError(e, socket)
        })
    }
}