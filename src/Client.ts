import { generateKeyPair, RSAKeyPairOptions } from "crypto"
import { SocketAddress, Socket } from "net"
import { ERROR_CODE, GetPayload, OP, OPAuthPayload, OPErrorPayload, OPSendPayload, ParsePayload } from "./Protocol"

export const CHAT_CLIENT_PREFIX = "[Chat::Client]\t"

export interface ClientConfig {
    serverAddress: SocketAddress,
    nickname: string,
    onAuthError?: (e: ERROR_CODE) => any,
    onLoggedIn?: () => any
    onReceive?: (payload: OPSendPayload) => any
}

interface KeyPair {
    publicKey: string,
    privateKey: string
}

export class ChatClient {

    public server: Socket

    protected keyPair : KeyPair = {privateKey: null, publicKey: null}

    constructor(public config: ClientConfig) { }

    async init() {
        this.server = new Socket()
        this.server.removeAllListeners()

        this.server.on("error", this.onServerError.bind(this))
        this.server.on("data", this.onServerData.bind(this))

        await this.generateKeyPair()

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
                    console.log(`${CHAT_CLIENT_PREFIX} ${payload.message}`)
                    if (this.config.onLoggedIn) this.config.onLoggedIn()
                    break
                case OP.ERROR: 
                    console.error(`${CHAT_CLIENT_PREFIX} Error. Server says: ${payload.message}`)
                    switch ((payload as OPErrorPayload).code) {
                        case ERROR_CODE.NICKNAME_ALREADY_TAKEN:
                            this.server.destroy()
                            if (this.config.onAuthError) this.config.onAuthError(ERROR_CODE.NICKNAME_ALREADY_TAKEN)
                            break
                    }
                    break
                case OP.SEND:
                    if (this.config.onReceive) this.config.onReceive(payload)
                    break
            }
        } catch (e) {
            console.error(`${CHAT_CLIENT_PREFIX} Server Data Error`, e)
        }
    }

    async auth() {
        this.server.write(GetPayload(OP.AUTH, {
            nickname: this.config.nickname,
            publicKey: this.keyPair.publicKey
        } as OPAuthPayload))
    }

    setNickname(nickname: ClientConfig["nickname"]) {
        this.config.nickname = nickname
    }

    sendMessage(message: string) {
        this.server.write(GetPayload(OP.SEND, { from: this.config.nickname, message } as OPSendPayload))
    }

    generateKeyPair(passphrase = "private_key_passphrase"): Promise<KeyPair> {
        const options: RSAKeyPairOptions<"pem", "pem"> = {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: "spki",
                format: "pem"
            },
            privateKeyEncoding: {
                type: "pkcs8",
                format: "pem",
                cipher: "aes-256-cbc",
                passphrase
            }
        }

        return new Promise((resolve, reject) => {
            generateKeyPair('rsa', options, (err: Error, publicKey: string, privateKey: string) => {
                if (err) return reject(`Error on generate key`)
                this.keyPair.publicKey = publicKey
                this.keyPair.privateKey = privateKey
                resolve({
                    publicKey: publicKey,
                    privateKey: privateKey
                })
            })
        })

    }
}