import { createCipheriv, createDecipheriv, createHmac, createSign, generateKeyPair, privateDecrypt, publicEncrypt, randomBytes, RSAKeyPairOptions, sign } from "crypto"
import { SocketAddress, Socket } from "net"
import { ERROR_CODE, GetPayload, OP, OPAuthPayload, OPErrorPayload, OPHandShakePayload, OPSendPayload, ParsePayload } from "./Protocol"

export const CHAT_CLIENT_PREFIX = "[Chat::Client]\t"

export interface ClientConfig {
    serverAddress: SocketAddress
    nickname: string
    passphrase?: string
    onAuthError?: (e: ERROR_CODE) => any
    onLoggedIn?: () => any
    onReceive?: (payload: OPSendPayload) => any
}

interface KeyPair {
    publicKey: string,
    privateKey: string
}

export class ChatClient {

    public server: Socket

    protected keyPair: KeyPair = { privateKey: null, publicKey: null }

    protected symmetricKey: string = null

    constructor(public config: ClientConfig) {
        this.config.passphrase = config.passphrase || "private_key_passphrase"
    }

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

    onServerData(payload: any) {
        // console.log(`${CHAT_CLIENT_PREFIX} Server Data`)
        try {

            const { operation, data } = ParsePayload(payload, this.decryptSymmetric.bind(this))

            switch (operation) {
                case OP.AUTH:
                    console.log(`${CHAT_CLIENT_PREFIX} ${data.message}`)
                    if (!this.symmetricKey) this.server.write(GetPayload(OP.HANDSHAKE, {} as OPHandShakePayload))
                    if (this.config.onLoggedIn) this.config.onLoggedIn()
                    break
                case OP.ERROR:
                    console.error(`${CHAT_CLIENT_PREFIX} Error. Server says: ${data.message}`)
                    switch ((data as OPErrorPayload).code) {
                        case ERROR_CODE.NICKNAME_ALREADY_TAKEN:
                            this.server.destroy()
                            if (this.config.onAuthError) this.config.onAuthError(ERROR_CODE.NICKNAME_ALREADY_TAKEN)
                            break
                    }
                    break
                case OP.SEND:
                    if (this.config.onReceive) this.config.onReceive(data)
                    break
                case OP.HANDSHAKE:
                    this.handShake((data as OPHandShakePayload))
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
        this.server.write(GetPayload(OP.SEND, { from: this.config.nickname, message } as OPSendPayload, this.encryptSymetric.bind(this)))
    }

    generateKeyPair(): Promise<KeyPair> {
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
                passphrase: this.config.passphrase
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

    handShake(payload?: OPHandShakePayload) {
        if (payload.issuer && payload.publicKey) {
            /* encrypt symmetric key with issuer public key  */
            const encryptedData = publicEncrypt(payload.publicKey, Buffer.from(this.symmetricKey))

            this.server.write(GetPayload(OP.HANDSHAKE, {
                issuer: payload.issuer,
                symmetricKey: encryptedData.toString("hex")
            } as OPHandShakePayload))
            return
        }

        if ((payload as OPHandShakePayload).issuer && (payload as OPHandShakePayload).symmetricKey) {
            const decryptedData = privateDecrypt({
                key: this.keyPair.privateKey,
                passphrase: this.config.passphrase,
            }, Buffer.from((payload as OPHandShakePayload).symmetricKey, "hex"))
            this.symmetricKey = decryptedData.toString()
            console.log(CHAT_CLIENT_PREFIX, "HandShaked SymmetricKey: ", decryptedData.toString())
            return
        }

        this.symmetricKey = randomBytes(32).toString("hex")
        console.log(CHAT_CLIENT_PREFIX, "Generated SymmetricKey: ", this.symmetricKey)
    }

    encryptSymetric(op: OP, data: string): string {
        if (this.symmetricKey !== null && op === OP.SEND) {
            // console.log("symmetric encrypt", data)

            const key = Buffer.alloc(32, this.symmetricKey)
            const iv = randomBytes(12).toString("hex")
            const cipher = createCipheriv("aes-256-gcm", key, iv)

            const dataBuffer = Buffer.from(cipher.update(Buffer.from(data), undefined, "hex"))
            const finalBuffer = Buffer.from(cipher.final("hex"))

            const enc = `${iv}:${Buffer.concat([dataBuffer, finalBuffer]).toString()}`
            const hash = this.hash(data)

            return `${enc},${hash}`
        }

        return data
    }

    decryptSymmetric(op: OP, data: string): string {
        if (this.symmetricKey !== null && op === OP.SEND) {
            const key = Buffer.alloc(32, this.symmetricKey)
            const iv = data.split(":")[0]
            const decipher = createDecipheriv("aes-256-gcm", key, iv)
            data = data.split(":")[1]

            const receivedHash = data.split(",")[1]
            data = data.split(",")[0]

            const dataBuffer = Buffer.from(decipher.update(data, "hex"))
            /* const finalBuffer = Buffer.from(decipher.final()) */

            const dec = Buffer.concat([dataBuffer/* , finalBuffer */]).toString()

            /* compare hash's: integrity  */
            if (receivedHash !== this.hash(dec)) {
                throw new Error("[Integrity message error] Message was adulterate")
            }

            return JSON.parse(dec)
        }

        return data
    }

    hash(message: Buffer | string) {
        if (this.symmetricKey === null) throw new Error("Handshake failed.")
        return createHmac("SHA256", this.symmetricKey).update(message).digest("hex")
    }

    _testComputerCost() {
        const messageToSign = Buffer.from("lorem ipsum message here")

        /* digital cert: sign with private key */
        const time = new Date().getTime()
        const asymmetricSign = createSign("SHA256")
        asymmetricSign.write(messageToSign)
        asymmetricSign.end()
        const messageSigned = asymmetricSign.sign({ key: this.keyPair.privateKey, passphrase: this.config.passphrase }, "hex")
        console.log(`Sign time:`, new Date().getTime() - time)
        console.log(messageSigned)

        /* HMAC: hash-based message authencation code */
        const _time = new Date().getTime()
        const hash = createHmac("SHA256", this.keyPair.privateKey).update(messageToSign).digest("hex")
        console.log(`HMAC time:`, new Date().getTime() - _time)
        console.log(hash)
    }
}