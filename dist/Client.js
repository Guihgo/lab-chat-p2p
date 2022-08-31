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
const crypto_1 = require("crypto");
const net_1 = require("net");
const Protocol_1 = require("./Protocol");
exports.CHAT_CLIENT_PREFIX = "[Chat::Client]\t";
class ChatClient {
    constructor(config) {
        this.config = config;
        this.keyPair = { privateKey: null, publicKey: null };
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.server = new net_1.Socket();
            this.server.removeAllListeners();
            this.server.on("error", this.onServerError.bind(this));
            this.server.on("data", this.onServerData.bind(this));
            yield this.generateKeyPair();
            this.server.connect({
                host: this.config.serverAddress.address,
                port: this.config.serverAddress.port,
                noDelay: true
            }, () => {
                console.log(`${exports.CHAT_CLIENT_PREFIX} Connected at ${this.config.serverAddress.address}:${this.config.serverAddress.port}`);
                this.auth();
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
        // console.log(`${CHAT_CLIENT_PREFIX} Server Data`)
        try {
            const { operation, payload } = (0, Protocol_1.ParsePayload)(data);
            switch (operation) {
                case Protocol_1.OP.AUTH:
                    console.log(`${exports.CHAT_CLIENT_PREFIX} ${payload.message}`);
                    if (this.config.onLoggedIn)
                        this.config.onLoggedIn();
                    break;
                case Protocol_1.OP.ERROR:
                    console.error(`${exports.CHAT_CLIENT_PREFIX} Error. Server says: ${payload.message}`);
                    switch (payload.code) {
                        case Protocol_1.ERROR_CODE.NICKNAME_ALREADY_TAKEN:
                            this.server.destroy();
                            if (this.config.onAuthError)
                                this.config.onAuthError(Protocol_1.ERROR_CODE.NICKNAME_ALREADY_TAKEN);
                            break;
                    }
                    break;
                case Protocol_1.OP.SEND:
                    if (this.config.onReceive)
                        this.config.onReceive(payload);
                    break;
            }
        }
        catch (e) {
            console.error(`${exports.CHAT_CLIENT_PREFIX} Server Data Error`, e);
        }
    }
    auth() {
        return __awaiter(this, void 0, void 0, function* () {
            this.server.write((0, Protocol_1.GetPayload)(Protocol_1.OP.AUTH, {
                nickname: this.config.nickname,
                publicKey: this.keyPair.publicKey
            }));
        });
    }
    setNickname(nickname) {
        this.config.nickname = nickname;
    }
    sendMessage(message) {
        this.server.write((0, Protocol_1.GetPayload)(Protocol_1.OP.SEND, { from: this.config.nickname, message }));
    }
    generateKeyPair(passphrase = "private_key_passphrase") {
        const options = {
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
        };
        return new Promise((resolve, reject) => {
            (0, crypto_1.generateKeyPair)('rsa', options, (err, publicKey, privateKey) => {
                if (err)
                    return reject(`Error on generate key`);
                this.keyPair.publicKey = publicKey;
                this.keyPair.privateKey = privateKey;
                resolve({
                    publicKey: publicKey,
                    privateKey: privateKey
                });
            });
        });
    }
}
exports.ChatClient = ChatClient;
