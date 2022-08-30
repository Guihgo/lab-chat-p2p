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
exports.ChatClient = exports.CHAT_CLIENT_PREFIX = void 0;
const net_1 = require("net");
exports.CHAT_CLIENT_PREFIX = "[Chat::Client]\t";
class ChatClient {
    constructor(config) {
        this.config = config;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.server = new net_1.Socket();
            this.server.on("error", this.onServerError.bind(this));
            this.server.on("data", this.onServerData.bind(this));
            this.server.connect({
                host: this.config.socketAddress.address,
                port: this.config.socketAddress.port,
                noDelay: true
            }, () => {
                console.log(`${exports.CHAT_CLIENT_PREFIX} Connected at ${this.config.socketAddress.address}:${this.config.socketAddress.port}`);
            });
        });
    }
    onServerError(e) {
        if (["ECONNREFUSED", "ECONNRESET"].includes(e.code)) {
            setTimeout(() => {
                console.error(`${exports.CHAT_CLIENT_PREFIX} Lose server connection. Trying to reconnect...`);
                delete this.server;
                this.init();
            }, 1000);
            return;
        }
        console.error(`${exports.CHAT_CLIENT_PREFIX} Server Error`, e);
    }
    onServerData(data) {
        console.log(`${exports.CHAT_CLIENT_PREFIX} Socket Data`, data);
    }
}
exports.ChatClient = ChatClient;
