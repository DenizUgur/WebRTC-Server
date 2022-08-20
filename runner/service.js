import { Service } from "node-windows";
import { join } from "path";

// Create a new service object
var svc = new Service({
    name: "JRE Signalling Server",
    description: "Node.js app for JRE signalling server",
    script: join(__dirname, "build/index.js"),
    wait: 2,
    grow: 0.5,
    maxRetries: 5,
    env: [
        {
            name: "PORT",
            value: 8080,
        },
        {
            name: "WEBSOCKET",
            value: true,
        },
        {
            name: "ENCODER_RENDERER_PROXY",
            value: true,
        },
    ],
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on("install", function () {
    svc.start();
});

svc.install();
