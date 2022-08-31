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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const Server_1 = require("./Server");
const Client_1 = require("./Client");
const Protocol_1 = require("./Protocol");
global.__dev = process.argv.find(arg => (arg === "--dev")) ? true : false;
const cliType = (process.argv[2] || "server").toLowerCase();
class ChatCLI {
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            switch (cliType) {
                case "server":
                    return this.initServer();
                case "client":
                    return this.initClient();
                default:
                    return this.initServer();
            }
        });
    }
    initServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                address: "127.0.0.1",
                port: 5535
            };
            if (!global.__dev) {
                const input = yield inquirer_1.default.prompt([
                    { type: "input", name: "address", message: "Type the Address [127.0.0.1]:", prefix: Server_1.CHAT_SERVER_PREFIX },
                    { type: "number", name: "port", message: "Type the Port [5535]:", prefix: Server_1.CHAT_SERVER_PREFIX }
                ]);
                if (input.address !== '')
                    params.address = input.address;
                if (input.port)
                    params.port = input.port;
            }
            const server = new Server_1.ChatServer({
                socketAddress: {
                    address: params.address,
                    port: params.port,
                    family: "ipv4",
                    flowlabel: null
                }
            });
            server.init();
        });
    }
    initClient() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = {
                address: "127.0.0.1",
                port: 5535,
                nickname: null
            };
            if (!global.__dev) {
                const input = yield inquirer_1.default.prompt([
                    { type: "input", name: "address", message: "Type the Address [127.0.0.1]:", prefix: Client_1.CHAT_CLIENT_PREFIX },
                    { type: "number", name: "port", message: "Type the Port [5535]:", prefix: Client_1.CHAT_CLIENT_PREFIX },
                ]);
                if (input.address !== '')
                    params.address = input.address;
                if (input.port)
                    params.port = input.port;
            }
            function inputNickname() {
                return __awaiter(this, void 0, void 0, function* () {
                    const { nickname } = yield inquirer_1.default.prompt([
                        { type: "input", name: "nickname", message: "Type your nickname:", prefix: Client_1.CHAT_CLIENT_PREFIX },
                    ]);
                    if (!nickname || nickname === '')
                        throw new Error("Nickname is required.");
                    return nickname;
                });
            }
            params.nickname = yield inputNickname();
            const client = new Client_1.ChatClient({
                serverAddress: {
                    address: params.address,
                    port: params.port,
                    family: "ipv4",
                    flowlabel: null
                },
                nickname: params.nickname,
                onAuthError: (e) => __awaiter(this, void 0, void 0, function* () {
                    if (e === Protocol_1.ERROR_CODE.NICKNAME_ALREADY_TAKEN) {
                        client.setNickname(yield inputNickname());
                        client.init();
                    }
                }),
                onLoggedIn: () => __awaiter(this, void 0, void 0, function* () {
                    const { message } = yield inquirer_1.default.prompt([
                        { type: "input", name: "message", message: `[${client.config.nickname}]:`, prefix: Client_1.CHAT_CLIENT_PREFIX },
                    ]);
                    client.sendMessage(message);
                    while (1) {
                        yield client.config.onLoggedIn();
                    }
                }),
                onReceive: (payload) => __awaiter(this, void 0, void 0, function* () {
                    process.stdout.clearLine(-1);
                    process.stdout.cursorTo(0);
                    console.log(`${Client_1.CHAT_CLIENT_PREFIX} ${payload.from}: ${payload.message}`);
                })
            });
            client.init();
        });
    }
}
const init = (() => __awaiter(void 0, void 0, void 0, function* () {
    const cli = new ChatCLI();
    cli.init();
    // cli.init().then(()=>{
    //     if (__dev) {
    //         console.info(`Waiting for hot reloading. Ctrl+S to save & reload. Ctrl+C to exit.`)
    //         while (1) {  }
    //     }
    // })
}))();
