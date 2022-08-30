import { SocketAddress, Socket } from "net"


export const CHAT_CLIENT_PREFIX = "[Chat::Client]\t"

interface ClientConfig {
    socketAddress: SocketAddress
}

export class ChatClient {

    public server: Socket

    constructor(public config: ClientConfig) {

    }

    async init() {
        this.server = new Socket()
        this.server.on("error", this.onServerError.bind(this))
        this.server.on("data", this.onServerData.bind(this))

        this.server.connect({
            host: this.config.socketAddress.address,
            port: this.config.socketAddress.port,
            noDelay: true
        }, () => {
            console.log(`${CHAT_CLIENT_PREFIX} Connected at ${this.config.socketAddress.address}:${this.config.socketAddress.port}`)
        })
    }

    onServerError(e: any) {

        if (["ECONNREFUSED", "ECONNRESET"].includes(e.code)) {
            setTimeout(() => {
                console.error(`${CHAT_CLIENT_PREFIX} Lose server connection. Trying to reconnect...`)
                delete this.server
                this.init()
            }, 1000)
            return
        }
        console.error(`${CHAT_CLIENT_PREFIX} Server Error`, e)
    }

    onServerData(data: any) {
        console.log(`${CHAT_CLIENT_PREFIX} Socket Data`, data)
    }
}