const Service = require("node-windows").Service;
const join = require("path").join;

// Create a new service object
var svc = new Service({
    name: "JRE Signalling Server",
    description: "Node.js app for JRE signalling server",
    script: join(__dirname, "build/index.js"),
    wait: 2,
    grow: 0.5,
    maxRetries: 5,
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on("install", () => {
    svc.start();
});

switch (process.argv[2]) {
    case "--install":
        svc.install();
        break;

    case "--uninstall":
        svc.uninstall();
        break;

    case "--start":
        svc.start();
        break;

    case "--stop":
        svc.stop();
        break;

    case "--restart":
        svc.restart();
        break;

    default:
        throw new Error("Invalid command");
}
