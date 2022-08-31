import { SocketAddress, createServer, Server, Socket } from "net"
import { ERROR_CODE, GetPayload, OP, OPAuthPayload, OPErrorPayload, OPReceivePayload, ParsePayload } from "./Protocol"


export const CHAT_SERVER_PREFIX = "[Chat::Server]\t"

export interface ServerConfig {
    socketAddress: SocketAddress
}

interface Client {
    socket: Socket
    nickname: string
    publicKey?: string | Buffer
}

interface Room {
    name: string
    clients: {
        [id: string]: Client
    }
}

export class ChatServer {

    public server: Server

    public genesisRoom: Room

    public rooms : Array<Room>

    constructor(public config: ServerConfig) {
        this.genesisRoom = {
            name: "GenesisRoom",
            clients: {}
        }
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
            if (this.genesisRoom.clients[this.getClientId(socket)]) {
                console.error(`${CHAT_SERVER_PREFIX} Client ${this.genesisRoom.clients[this.getClientId(socket)].nickname}@${socket.remoteAddress}:${socket.remotePort} disconnected!`)
                delete this.genesisRoom.clients[this.getClientId(socket)]
            } else {
                console.error(`${CHAT_SERVER_PREFIX} Client ${socket.remoteAddress}:${socket.remotePort} disconnected without login!`)
            }
            return
        }
        console.error(`${CHAT_SERVER_PREFIX} Client Error`, e)

    }

    connectionListener(socket: Socket): void {
        console.log(`${CHAT_SERVER_PREFIX} new client connection from ${socket.remoteAddress}:${socket.remotePort}`)

        socket.on("error", (e) => {
            this.onClientError(e, socket)
        })

        socket.on("data", (data) => {
            // console.log(`${CHAT_SERVER_PREFIX} Data from ${socket.remoteAddress}:${socket.remotePort}`)

            try {
                const { operation, payload } = ParsePayload(data)
                switch (operation) {
                    case OP.AUTH:
                        if (!(payload as OPAuthPayload).nickname) throw new Error("No nickname defined.")
                        this.authClient({
                            socket,
                            nickname: payload.nickname,
                            publicKey: payload.publicKey
                        })
                        break
                    case OP.SEND:
                        this.sendMessage(this.genesisRoom.clients[this.getClientId(socket)].nickname, payload)
                        break
                }
            } catch (e) {
                console.error(`${CHAT_SERVER_PREFIX} Client Data Error`, e)
            }
        })
    }

    getClientId(socket: Socket) {
        return `${socket.remoteAddress}:${socket.remotePort}`
    }

    authClient(client: Client) {
        const id = this.getClientId(client.socket)
        if (Object.keys(this.genesisRoom.clients).find(k => (this.genesisRoom.clients[k].nickname === client.nickname))) {
            console.error(`${CHAT_SERVER_PREFIX} Client ${id} trying to use already taken nickname @${client.nickname}`)
            client.socket.write(GetPayload(OP.ERROR, { message: "Nickname already taken", code: ERROR_CODE.NICKNAME_ALREADY_TAKEN } as OPErrorPayload))
            return
        }

        this.genesisRoom.clients[id] = client
        client.socket.write(GetPayload(OP.AUTH, { message: `Logged as @${client.nickname} with success!` }))
        console.log(`${CHAT_SERVER_PREFIX} Client ${client.nickname}@${client.socket.remoteAddress}:${client.socket.remotePort} logged in. Now: ${Object.keys(this.genesisRoom.clients).length} clients.`, Object.keys(this.genesisRoom.clients).map(k => `${this.genesisRoom.clients[k].nickname}@${k}`))
    }

    sendMessage(from: Client["nickname"], { message }) {
        /* @TODO: add multi room feature here */
        Object.keys(this.genesisRoom.clients).map(k => this.genesisRoom.clients[k]).forEach((client)=>{
            if (from === client.nickname) return

            client.socket.write(GetPayload(OP.SEND, {
                from,
                message
            } as OPReceivePayload))
        })
    }
}