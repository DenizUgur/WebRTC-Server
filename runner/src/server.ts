import express from "express";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import signaling from "./signaling";
import { log, LogLevel } from "./log";
import Options from "./class/options";
import { reset as resetHandler } from "./class/httphandler";
import { DataDefinition, DataLog } from "./class/datalog";

export const createServer = (config: Options): express.Application => {
    const app: express.Application = express();
    resetHandler(config.mode);
    // logging http access
    if (config.logging != "none") {
        app.use(morgan(config.logging));
    }
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.get("/config", (req, res) =>
        res.json({
            useWebSocket: config.websocket,
            startupMode: config.mode,
            logging: config.logging,
            dataConfig: DataDefinition.getConfig(),
        })
    );
    app.get("/datalog", (req, res) => {
        const datalog = DataLog.getInstance();
        if (datalog.getFile()) {
            res.sendFile(datalog.getFile());
        } else {
            res.status(400).send("No datalog has been created yet.");
        }
    });
    app.use("/signaling", signaling);
    app.use(express.static(path.join(__dirname, "../client/build")));
    app.get("/", (req, res) => {
        const indexPagePath: string = path.join(
            __dirname,
            "../client/build/index.html"
        );
        fs.access(indexPagePath, (err) => {
            if (err) {
                log(LogLevel.warn, `Can't find file ' ${indexPagePath}`);
                res.status(404).send(`Can't find file ${indexPagePath}`);
            } else {
                res.sendFile(indexPagePath);
            }
        });
    });
    return app;
};
