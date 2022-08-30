import inquirer from "inquirer"
import { ChatServer, CHAT_SERVER_PREFIX } from "./Server"
import { ChatClient, CHAT_CLIENT_PREFIX, ClientConfig } from "./Client"
import { ERROR_CODE } from "./Protocol"

global.__dev = process.argv.find(arg=>(arg==="--dev")) ? true : false

type CLIType = "server" | "client"
const cliType = ((process.argv[2] as CLIType) || "server").toLowerCase()

class ChatCLI {
    async init() {
        switch (cliType) {
            case "server":
                return this.initServer()
            case "client":
                return this.initClient()
            default:
                return this.initServer()
        }
    }

    async initServer() {
        const params = {
            address: "127.0.0.1",
            port: 5535
        }

        if (!global.__dev) {
            const input: typeof params = await inquirer.prompt([
                { type: "input", name: "address", message: "Type the Address [127.0.0.1]:", prefix: CHAT_SERVER_PREFIX },
                { type: "number", name: "port", message: "Type the Port [5535]:", prefix: CHAT_SERVER_PREFIX }
            ])

            if (input.address !== '') params.address = input.address
            if (input.port) params.port = input.port
        }
        
        const server = new ChatServer({
            socketAddress: {
                address: params.address,
                port: params.port,
                family: "ipv4",
                flowlabel: null
            }
        })
        server.init()
    }

    async initClient() {
        const params = {
            address: "127.0.0.1",
            port: 5535,
            nickname: null
        }

        if (!global.__dev) {
            const input: typeof params = await inquirer.prompt([
                { type: "input", name: "address", message: "Type the Address [127.0.0.1]:", prefix: CHAT_CLIENT_PREFIX },
                { type: "number", name: "port", message: "Type the Port [5535]:", prefix: CHAT_CLIENT_PREFIX },
            ])

            if (input.address !== '') params.address = input.address
            if (input.port) params.port = input.port
        }

        async function inputNickname(): Promise<ClientConfig["nickname"]> {
            const { nickname } = await inquirer.prompt([
                { type: "input", name: "nickname", message: "Type your nickname:", prefix: CHAT_CLIENT_PREFIX },
            ])
            if (!nickname || nickname === '') throw new Error("Nickname is required.")
            return nickname
        }
        params.nickname = await inputNickname()

        const client = new ChatClient({
            serverAddress: {
                address: params.address,
                port: params.port,
                family: "ipv4",
                flowlabel: null
            },
            nickname: params.nickname,
            onAuthError: async (e)=>{
                if (e === ERROR_CODE.NICKNAME_ALREADY_TAKEN) {
                    client.setNickname(await inputNickname())
                    client.init()
                }
            }
        })
        client.init()
    }
}


const init = (async ()=>{
    const cli = new ChatCLI()
    cli.init()
    // cli.init().then(()=>{
    //     if (__dev) {
    //         console.info(`Waiting for hot reloading. Ctrl+S to save & reload. Ctrl+C to exit.`)
    //         while (1) {  }
    //     }
    // })
})()