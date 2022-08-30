import { SocketAddress, Socket } from "net"
import inquirer from "inquirer"
import { ERROR_CODE, GetPayload, OP, ParsePayload } from "./Protocol"

export const CHAT_CLIENT_PREFIX = "[Chat::Client]\t"

export interface ClientConfig {
    serverAddress: SocketAddress,
    nickname: string,
    onAuthError?: (e: ERROR_CODE) => any
}

export class ChatClient {

    public server: Socket

    constructor(public config: ClientConfig) {
        this.server = new Socket()
    }

    async init() {
        this.server.removeAllListeners()
        
        this.server.on("error", this.onServerError.bind(this))
        this.server.on("data", this.onServerData.bind(this))

        this.server.connect({
            host: this.config.serverAddress.address,
            port: this.config.serverAddress.port,
            noDelay: true
        }, () => {
            console.log(`${CHAT_CLIENT_PREFIX} Connected at ${this.config.serverAddress.address}:${this.config.serverAddress.port}`)
            this.auth()
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
        // console.log(`${CHAT_CLIENT_PREFIX} Server Data`)

        try {
            const { operation, payload } = ParsePayload(data)

            switch (operation) {
                case OP.AUTH:
                    if (payload.error) {
                        console.error(`${CHAT_CLIENT_PREFIX} Error. Server says: ${payload.message}`)
                        if(payload.code === ERROR_CODE.NICKNAME_ALREADY_TAKEN) {
                            this.server.destroy()
                            return this.config.onAuthError(ERROR_CODE.NICKNAME_ALREADY_TAKEN)
                        }
                    } else {
                        console.log(`${CHAT_CLIENT_PREFIX} ${payload.message}`)
                    }
                    break
            }
        } catch (e) {
            console.error(`${CHAT_CLIENT_PREFIX} Server Data Error`, e)
        }  
    }

    async auth() {
        this.server.write(GetPayload(OP.AUTH, {
            nickname: this.config.nickname
        }))
    }

    setNickname(nickname: ClientConfig["nickname"]) {
        this.config.nickname = nickname
    }
}