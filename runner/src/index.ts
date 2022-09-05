import { Command } from "commander";
import express from "express";
import https from "https";
import { Server } from "http";
import fs from "fs";
import os from "os";
import path from "path";
import { createServer } from "./server";
import { AddressInfo } from "net";
import { WSSignaling, WSProxy } from "./websocket";
import Options from "./class/options";

require("dotenv").config({ path: path.join(__dirname, "../.env") });

export class RenderStreaming {
    public static run(argv: string[]): RenderStreaming {
        const program = new Command();
        const readOptions = (): Options => {
            if (Array.isArray(argv)) {
                program
                    .usage("[options] <apps...>")
                    .option(
                        "-p, --port <n>",
                        "Port to start the server and proxy on. Note: ports are seperated by comma",
                        process.env.PORT || `80,8080`
                    )
                    .option(
                        "-s, --secure",
                        "Enable HTTPS (you need server.key and server.cert)",
                        process.env.SECURE || false
                    )
                    .option(
                        "-k, --keyfile <path>",
                        "https key file (default server.key)",
                        process.env.KEYFILE || "server.key"
                    )
                    .option(
                        "-c, --certfile <path>",
                        "https cert file (default server.cert)",
                        process.env.CERTFILE || "server.cert"
                    )
                    .option(
                        "-w, --websocket",
                        "Enable Websocket Signaling",
                        process.env.WEBSOCKET || false
                    )
                    .option(
                        "-m, --mode <type>",
                        "Choose Communication mode public or private (default public)",
                        process.env.MODE || "public"
                    )
                    .option(
                        "--encoder-renderer-proxy",
                        "Create proxy from renderer and encoder",
                        process.env.ENCODER_RENDERER_PROXY || false
                    )
                    .option(
                        "-l, --logging <type>",
                        "Choose http logging type combined, dev, short, tiny or none.(default dev)",
                        process.env.LOGGING || "dev"
                    )
                    .parse(argv);
                const option = program.opts();
                const ports = option.port
                    .split(",")
                    .map((x: string) => parseInt(x));
                return {
                    port: ports[0],
                    proxyPort: ports[1],
                    secure: option.secure == undefined ? false : option.secure,
                    keyfile: option.keyfile,
                    certfile: option.certfile,
                    websocket:
                        option.websocket == undefined
                            ? false
                            : option.websocket,
                    mode: option.mode,
                    encoderRendererProxy: option.encoderRendererProxy,
                    logging: option.logging,
                };
            }
        };
        const options = readOptions();
        return new RenderStreaming(options);
    }

    public app: express.Application;

    public server?: Server;

    public options: Options;

    private WSSignalingInstance: WSSignaling;
    private WSProxyInstance: WSProxy;

    constructor(options: Options) {
        this.options = options;
        this.app = createServer(this.options);
        if (this.options.secure) {
            this.server = https
                .createServer(
                    {
                        key: fs.readFileSync(options.keyfile),
                        cert: fs.readFileSync(options.certfile),
                    },
                    this.app
                )
                .listen(this.options.port, () => {
                    const { port } = this.server.address() as AddressInfo;
                    const addresses = this.getIPAddress();
                    for (const address of addresses) {
                        console.log(`https://${address}:${port}`);
                    }
                });
        } else {
            this.server = this.app.listen(this.options.port, () => {
                const { port } = this.server.address() as AddressInfo;
                const addresses = this.getIPAddress();
                for (const address of addresses) {
                    console.log(`http://${address}:${port}`);
                }
            });
        }

        if (this.options.websocket) {
            console.log(
                `start websocket signaling server ws://${
                    this.getIPAddress()[0]
                }:${this.options.port}`
            );
            //Start Websocket Signaling server
            this.WSSignalingInstance = new WSSignaling(
                this.options.mode,
                this.server
            );
        }

        if (this.options.encoderRendererProxy) {
            console.log(
                `start websocket proxy server ws://${this.getIPAddress()[0]}:${
                    this.options.proxyPort
                }`
            );
            //Start Websocket Proxy server
            this.WSProxyInstance = new WSProxy(this.options.proxyPort);
        }

        console.log(`start as ${this.options.mode} mode`);
    }

    getIPAddress(): string[] {
        const interfaces = os.networkInterfaces();
        const addresses: string[] = [];
        for (const k in interfaces) {
            for (const k2 in interfaces[k]) {
                const address = interfaces[k][k2];
                if (address.family === "IPv4") {
                    addresses.push(address.address);
                }
            }
        }
        return addresses;
    }
}

RenderStreaming.run(process.argv);
