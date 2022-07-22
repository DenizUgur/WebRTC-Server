export default interface Options {
    secure?: boolean;
    port?: number;
    keyfile?: string;
    certfile?: string;
    websocket?: boolean;
    mode?: string;
    encoderRendererProxy?: boolean;
    logging?: string;
}
