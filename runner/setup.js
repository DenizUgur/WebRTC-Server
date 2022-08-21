const { Service } = require("node-windows");
const { join } = require("path");

var svc = new Service({
    name: "JRE Signalling Server",
    description: "Node.js app for JRE signalling server",
    script: join(__dirname, "build/index.js"),
    wait: 2,
    grow: 0.5,
    maxRetries: 5,
});

const init = () => {
    // Listen for the "install" event, which indicates the
    // process is available as a service.
    svc.on("install", () => {
        svc.start();
    });

    svc.install();
};

const deinit = () => {
    svc.uninstall();
};

const update = () => {
    svc.on("stop", () => {
        svc.start();
    });
    svc.stop();
};

if (process.argv[2] === "--init") {
    init();
} else if (process.argv[2] === "--deinit") {
    deinit();
} else if (process.argv[2] === "--update") {
    update();
} else {
    throw new Error("Invalid command");
}
