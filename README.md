# Chat P2P 

A simple chat P2P using NodeJS

## Proposal

[**Checkout** the proposal (.pdf)](/proposal/Seguran_a___APNP___Atividade_2-1.pdf)

## Feature

1. P2P Chat
2. Auth by unique nickname

## Reports

1. [Introduction](/reports/README.md)
2. [Security](/reports/security.md)

## Requirements 

- NodeJS (>10) 
- NPM

## Get start

1. Install depedencies
```bash
npm install
```
Or if you use yarn
```bash
yarn
```

### Start server

```bash
node dist/cli.js server
```

### Start n clients

```bash
node dist/cli.js client
```

*Default server ip and port: 127.0.0.1:5535*


## Developing

Server
```bash
npm run dev:server
```

Client
```bash
npm run dev:client
```

Building
```bash
npm run build
```

## Contributing

1. Fork this repo
2. Create Pull Request

## TODO

- Multiple rooms

## Author 

- Guilherme Henrique G Oliveira (UTFPR RA: 1913298)
