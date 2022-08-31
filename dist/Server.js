"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatServer = exports.CHAT_SERVER_PREFIX = void 0;
const net_1 = require("net");
const Protocol_1 = require("./Protocol");
exports.CHAT_SERVER_PREFIX = "[Chat::Server]\t";
class ChatServer {
    constructor(config) {
        this.config = config;
        this.genesisRoom = {
            name: "GenesisRoom",
            clients: {}
        };
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.server = (0, net_1.createServer)({ keepAlive: true, noDelay: true }, this.connectionListener.bind(this));
            this.server.on("error", this.onServerError.bind(this));
            this.server.listen(this.config.socketAddress.port, this.config.socketAddress.address, 2, () => {
                console.log(`${exports.CHAT_SERVER_PREFIX} Started at ${this.config.socketAddress.address}:${this.config.socketAddress.port}`);
            });
        });
    }
    onServerError(e) {
        console.error(`${exports.CHAT_SERVER_PREFIX} Socket Server Error`, e);
    }
    onClientError(e, socket) {
        if (["ECONNREFUSED", "ECONNRESET"].includes(e.code)) {
            if (this.genesisRoom.clients[this.getClientId(socket)]) {
                console.error(`${exports.CHAT_SERVER_PREFIX} Client ${this.genesisRoom.clients[this.getClientId(socket)].nickname}@${socket.remoteAddress}:${socket.remotePort} disconnected!`);
                delete this.genesisRoom.clients[this.getClientId(socket)];
            }
            else {
                console.error(`${exports.CHAT_SERVER_PREFIX} Client ${socket.remoteAddress}:${socket.remotePort} disconnected without login!`);
            }
            return;
        }
        console.error(`${exports.CHAT_SERVER_PREFIX} Client Error`, e);
    }
    connectionListener(socket) {
        console.log(`${exports.CHAT_SERVER_PREFIX} new client connection from ${socket.remoteAddress}:${socket.remotePort}`);
        socket.on("error", (e) => {
            this.onClientError(e, socket);
        });
        socket.on("data", (data) => {
            // console.log(`${CHAT_SERVER_PREFIX} Data from ${socket.remoteAddress}:${socket.remotePort}`)
            try {
                const { operation, payload } = (0, Protocol_1.ParsePayload)(data);
                switch (operation) {
                    case Protocol_1.OP.AUTH:
                        if (!payload.nickname)
                            throw new Error("No nickname defined.");
                        this.authClient({
                            socket,
                            nickname: payload.nickname,
                            publicKey: payload.publicKey
                        });
                        break;
                    case Protocol_1.OP.SEND:
                        this.sendMessage(this.genesisRoom.clients[this.getClientId(socket)].nickname, payload);
                        break;
                }
            }
            catch (e) {
                console.error(`${exports.CHAT_SERVER_PREFIX} Client Data Error`, e);
            }
        });
    }
    getClientId(socket) {
        return `${socket.remoteAddress}:${socket.remotePort}`;
    }
    authClient(client) {
        const id = this.getClientId(client.socket);
        if (Object.keys(this.genesisRoom.clients).find(k => (this.genesisRoom.clients[k].nickname === client.nickname))) {
            console.error(`${exports.CHAT_SERVER_PREFIX} Client ${id} trying to use already taken nickname @${client.nickname}`);
            client.socket.write((0, Protocol_1.GetPayload)(Protocol_1.OP.ERROR, { message: "Nickname already taken", code: Protocol_1.ERROR_CODE.NICKNAME_ALREADY_TAKEN }));
            return;
        }
        this.genesisRoom.clients[id] = client;
        client.socket.write((0, Protocol_1.GetPayload)(Protocol_1.OP.AUTH, { message: `Logged as @${client.nickname} with success!` }));
        console.log(`${exports.CHAT_SERVER_PREFIX} Client ${client.nickname}@${client.socket.remoteAddress}:${client.socket.remotePort} logged in. Now: ${Object.keys(this.genesisRoom.clients).length} clients.`, Object.keys(this.genesisRoom.clients).map(k => `${this.genesisRoom.clients[k].nickname}@${k}`));
    }
    sendMessage(from, { message }) {
        /* @TODO: add multi room feature here */
        Object.keys(this.genesisRoom.clients).map(k => this.genesisRoom.clients[k]).forEach((client) => {
            if (from === client.nickname)
                return;
            client.socket.write((0, Protocol_1.GetPayload)(Protocol_1.OP.SEND, {
                from,
                message
            }));
        });
    }
}
exports.ChatServer = ChatServer;
