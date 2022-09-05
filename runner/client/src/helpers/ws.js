export class WS {
    static instance;
    ws = {
        peer: null,
        game: null,
        server: null,
    };

    // eslint-disable-next-line no-useless-constructor
    constructor() {}

    static getInstance() {
        if (!WS.instance) {
            WS.instance = new WS();
        }
        return WS.instance;
    }

    async connect() {
        console.log("ws connect");
        const promises = [
            new Promise((resolve) => {
                this.ws.peer = new WebSocket(
                    `ws://${window.location.hostname}:8080/proxy/peer`
                );
                this.ws.peer.onopen = resolve;
            }),
            new Promise((resolve) => {
                this.ws.game = new WebSocket(
                    `ws://${window.location.hostname}:8080/proxy/game`
                );
                this.ws.game.onopen = resolve;
            }),
            new Promise((resolve) => {
                this.ws.server = new WebSocket(
                    `ws://${window.location.hostname}:8080/proxy/server`
                );
                this.ws.server.onopen = resolve;
            }),
        ];
        return Promise.all(promises);
    }

    async disconnect() {
        console.log("ws disconnect");
        const promises = [
            new Promise((resolve) => {
                this.ws.peer.onclose = resolve;
                this.ws.peer.close();
            }),
            new Promise((resolve) => {
                this.ws.game.onclose = resolve;
                this.ws.game.close();
            }),
            new Promise((resolve) => {
                this.ws.server.onclose = resolve;
                this.ws.server.close();
            }),
        ];
        return Promise.all(promises);
    }

    getWS(type) {
        switch (type) {
            case "start":
            case "stop":
            case "restart":
                return this.ws.game;
            case "clear":
                return this.ws.server;
            default:
                return this.ws.peer;
        }
    }

    async command(type, data = {}) {
        console.log("ws command", type, data);
        const conn = this.getWS(type);
        return new Promise((resolve) => {
            conn.onmessage = (e) => {
                resolve(JSON.parse(e.data));
            };

            switch (type) {
                case "start":
                    conn.send(JSON.stringify({ cmd: "start" }));
                    break;
                case "stop":
                    conn.send(JSON.stringify({ cmd: "stop" }));
                    break;
                case "restart":
                    conn.send(JSON.stringify({ cmd: "restart" }));
                    break;
                case "clear":
                    conn.send(JSON.stringify({ cmd: "clear" }));
                    break;

                default:
                    conn.send(JSON.stringify(data));
                    break;
            }
        });
    }
}
