const pm2 = require("pm2");

const init = () => {
    pm2.connect(function (err) {
        if (err) {
            console.error(err);
            process.exit(2);
        }

        pm2.start(
            {
                script: "./build/index.js",
                name: "entry",
            },
            (err) => {
                if (err) {
                    console.error(err);
                    pm2.disconnect();
                    return process.exit(2);
                }
                console.log("Execute 'pm2 startup' followed by 'pm2 save'");
                return pm2.disconnect();
            }
        );
    });
};

const deinit = () => {
    pm2.connect(function (err) {
        if (err) {
            console.error(err);
            process.exit(2);
        }

        pm2.delete({ name: "entry" }, (err) => {
            if (err) {
                console.error(err);
                pm2.disconnect();
                return process.exit(2);
            }
            console.log("Execute 'pm2 save --force'");
            return pm2.disconnect();
        });
    });
};

const update = () => {
    pm2.connect(function (err) {
        if (err) {
            console.error(err);
            process.exit(2);
        }

        pm2.restart({ name: "entry" }, (err) => {
            if (err) {
                console.error(err);
                pm2.disconnect();
                return process.exit(2);
            }
            return pm2.disconnect();
        });
    });
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
