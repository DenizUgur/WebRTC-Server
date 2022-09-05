export default interface Options {
    secure?: boolean;
    port?: number;
    proxyPort?: number;
    keyfile?: string;
    certfile?: string;
    websocket?: boolean;
    mode?: string;
    encoderRendererProxy?: boolean;
    logging?: string;
}
