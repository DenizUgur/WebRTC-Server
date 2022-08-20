import { WebSocketServer } from "ws";
import { Mutex } from "async-mutex";
import * as handler from "./class/websockethandler";
import GameControl from "./class/gamecontrol";

class WSS {
    wss: WebSocketServer;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    getWebsocketServer(): WebSocketServer {
        return this.wss;
    }
}

class WSSignaling extends WSS {
    constructor(mode: string) {
        super();

        this.wss = new WebSocketServer({ noServer: true });
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
    encoderData = {
        read: {}, // read data from encoder
        write: {}, // write data to encoder
    };
    rendererData = {
        read: {}, // read data from renderer
        write: {
            antiAliasing: 2,
            lodBias: 2,
            masterTextureLimit: 0,
            pixelLightCount: 4,
            realtimeReflectionProbes: true,
            shadowCascades: 4,
            shadowDistance: 150,
            softParticles: true,
            vSyncCount: 0,
            targetFrameRate: 60,
        }, // write data to renderer
    };

    gc: GameControl;
    mutex = new Mutex();

    constructor() {
        super();
        this.gc = new GameControl();
        this.wss = new WebSocketServer({ noServer: true });

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
                        ws.send(JSON.stringify(this.encoderData.write));
                    } else if (request.url == "/proxy/game") {
                        let response: { status: string; error?: string } = {
                            status: "ok",
                        };

                        try {
                            if (payload.cmd == "start") await this.gc.start();
                            else if (payload.cmd == "stop")
                                await this.gc.stop();
                            else if (payload.cmd == "change_level")
                                await this.gc.changeLevel(payload.level);
                        } catch (e) {
                            response = { status: "error", error: e.message };
                        }

                        ws.send(JSON.stringify(response));
                    } else if (request.url == "/proxy/renderer") {
                        this.rendererData.read = {
                            ...this.rendererData.read,
                            ...payload,
                        };
                        ws.send(JSON.stringify(this.rendererData.write));
                    } else if (request.url == "/proxy/peer") {
                        this.encoderData.write = {
                            ...this.encoderData.write,
                            ...payload.encoder,
                        };
                        this.rendererData.write = {
                            ...this.rendererData.write,
                            ...payload.renderer,
                        };
                        ws.send(
                            JSON.stringify({
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
