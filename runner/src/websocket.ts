import { WebSocketServer } from "ws";
import { Mutex } from "async-mutex";
import * as handler from "./class/websockethandler";
import GameControl from "./class/gamecontrol";
import { DataDefinition, DataLog } from "./class/datalog";
import { Server as httpsServer } from "https";
import { Server as httpServer } from "http";

class WSS {
    wss: WebSocketServer;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    getWebsocketServer(): WebSocketServer {
        return this.wss;
    }
}

class WSSignaling extends WSS {
    constructor(mode: string, server: httpsServer | httpServer) {
        super();

        this.wss = new WebSocketServer({ server });
        handler.reset(mode);

        this.wss.on("connection", (ws: WebSocket) => {
            handler.add(ws);

            ws.onclose = (): void => {
                handler.remove(ws);
            };

            ws.onmessage = (event: MessageEvent): void => {
                // type: connect, disconnect JSON Schema
                // connectionId: connect or disconnect connectionId

                // type: offer, answer, candidate JSON Schema
                // from: from connection id
                // to: to connection id
                // data: any message data structure

                const msg = JSON.parse(event.data);
                if (!msg || !this) {
                    return;
                }

                console.log(msg);

                switch (msg.type) {
                    case "connect":
                        handler.onConnect(ws, msg.connectionId);
                        break;
                    case "disconnect":
                        handler.onDisconnect(ws, msg.connectionId);
                        break;
                    case "offer":
                        handler.onOffer(ws, msg.data);
                        break;
                    case "answer":
                        handler.onAnswer(ws, msg.data);
                        break;
                    case "candidate":
                        handler.onCandidate(ws, msg.data);
                        break;
                    default:
                        break;
                }
            };
        });
    }
}

class WSProxy extends WSS {
    gameData = DataDefinition.getInitData("game");
    rendererData = DataDefinition.getInitData("renderer");
    encoderData = DataDefinition.getInitData("encoder");

    health = {
        encoder: {
            alive: false,
            lastAlive: 0,
        },
        renderer: {
            alive: false,
            lastAlive: 0,
        },
    };

    healthCheck(body?): void {
        const now = Date.now();
        const threshold = 5000;

        if (body == null) {
            this.health.encoder.alive = this.health["encoder"].lastAlive + threshold > now;
            this.health.renderer.alive = this.health["renderer"].lastAlive + threshold > now;
            return;
        }

        this.health[body] = {
            alive:  this.health[body].lastAlive + threshold > now,
            lastAlive: now,
        };
    }

    gc: GameControl;
    dl: DataLog;
    mutex = new Mutex();

    constructor(port: number) {
        super();
        this.gc = new GameControl();
        this.dl = DataLog.getInstance();
        this.wss = new WebSocketServer({ port });

        this.wss.on("connection", (ws: WebSocket, request: any) => {
            ws.onmessage = async (event: MessageEvent): Promise<void> => {
                const payload = JSON.parse(event.data);
                if (!payload || !this) {
                    return;
                }

                await this.mutex.runExclusive(async () => {
                    if (request.url == "/proxy/encoder") {
                        this.encoderData.read = {
                            ...this.encoderData.read,
                            ...payload,
                        };
                        this.healthCheck("encoder");
                        this.dl.add(this.encoderData.read, "encoder");
                        ws.send(JSON.stringify(this.encoderData.write));
                    } else if (request.url == "/proxy/renderer") {
                        this.rendererData.read = {
                            ...this.rendererData.read,
                            ...payload,
                        };
                        this.healthCheck("renderer");
                        this.dl.add(this.rendererData.read, "renderer", true);
                        ws.send(JSON.stringify(this.rendererData.write));
                    } else if (request.url == "/proxy/server") {
                        if (payload.cmd == "clear") this.dl.clear();
                        this.healthCheck();
                        ws.send(
                            JSON.stringify({
                                status: "ok",
                                health: this.health,
                            })
                        );
                    } else if (request.url == "/proxy/game") {
                        let response: { status: string; error?: string } = {
                            status: "ok",
                        };

                        this.gc.updateParams(this.gameData.write);

                        try {
                            if (payload.cmd == "start") await this.gc.start();
                            else if (payload.cmd == "stop")
                                await this.gc.stop();
                            else if (payload.cmd == "restart")
                                await this.gc.restart();
                        } catch (e) {
                            response = { status: "error", error: e.message };
                        }

                        ws.send(JSON.stringify(response));
                    } else if (request.url == "/proxy/peer") {
                        this.gameData.write = {
                            ...this.gameData.write,
                            ...payload?.game,
                        };
                        this.encoderData.write = {
                            ...this.encoderData.write,
                            ...payload?.encoder,
                        };
                        this.rendererData.write = {
                            ...this.rendererData.write,
                            ...payload?.renderer,
                        };
                        ws.send(
                            JSON.stringify({
                                ...this.gameData.read,
                                ...this.encoderData.read,
                                ...this.rendererData.read,
                            })
                        );
                    }
                });
            };
        });
    }
}

export { WSSignaling, WSProxy };
