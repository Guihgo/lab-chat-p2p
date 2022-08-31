# Chat P2P 

A simple chat P2P using NodeJS

## Proposal

[**Checkout** the proposal (.pdf)](/proposal/Seguran_a___APNP___Atividade_2-1.pdf)

## Feature

1. P2P Chat
2. Auth by unique nickname
3. HandShake ( Asymmetric )
4. Secure & Privacy ( Symmetric cryptography P2P )

## Report

1. [Report (pdf)](https://github.com/Guihgo/lab-chat-p2p/blob/main/reports/Report.pdf)
2. [Report (high definition)](https://docs.google.com/document/d/1Zfm_dHIph-4h6ijZ5iXqx_O0AoHUHNnUFds2n3A-5Fc/edit?usp=sharing)

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
