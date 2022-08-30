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
exports.CHAT_SERVER_PREFIX = "[Chat::Server]\t";
class ChatServer {
    constructor(config) {
        this.config = config;
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
            setTimeout(() => {
                console.error(`${exports.CHAT_SERVER_PREFIX} Client ${socket.remoteAddress}:${socket.remotePort} disconnected!`);
            }, 1000);
            return;
        }
        console.error(`${exports.CHAT_SERVER_PREFIX} Client Error`, e);
    }
    connectionListener(socket) {
        console.log(`${exports.CHAT_SERVER_PREFIX} new socket connection from ${socket.remoteAddress}:${socket.remotePort}`);
        socket.on("error", (e) => {
            this.onClientError(e, socket);
        });
    }
}
exports.ChatServer = ChatServer;
