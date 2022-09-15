import fs from "fs";
import os from "os";
import path from "path";

type DefaultDict = {
    [key: string]: {
        value: number | string | boolean;
        range: {
            min?: number;
            max?: number;
            valid?: number[] | string[];
            boolean?: boolean;
        };
    };
};

export class DataDefinition {
    private static readonly game: DefaultDict = {
        level: { value: 0, range: { min: 0, max: 15 } },
        game: {
            value: "FlyDangerous",
            range: { valid: ["FlyDangerous", "FPS"] },
        },
    };

    private static readonly renderer: DefaultDict = {
        antiAliasing: { value: 2, range: { valid: [0, 2, 4, 8] } },
        lodBias: { value: 2, range: { min: 0 } },
        masterTextureLimit: { value: 0, range: { min: 0 } },
        pixelLightCount: { value: 4, range: { min: 0 } },
        realtimeReflectionProbes: { value: true, range: { boolean: true } },
        shadowCascades: { value: 4, range: { min: 0 } },
        shadowDistance: { value: 150, range: { min: 0 } },
        softParticles: { value: true, range: { boolean: true } },
        vSyncCount: { value: 0, range: { valid: [0, 1, 2, 3, 4] } },
        targetFrameRate: { value: 60, range: { min: 0, max: 170 } },
    };

    private static readonly encoder: DefaultDict = {
        encoder_fps: { value: 30, range: { min: 1, max: 60 } },
        encoder_bitrate: { value: 4e6, range: { min: 0, max: 9e7 } },
        encoder_bandwidth_allocation: {
            value: 4e6,
            range: { min: 0, max: 9e7 },
        },
    };

    public static getInitData(type: "game" | "renderer" | "encoder"): any {
        const tmp = {};
        for (const key in DataDefinition[type]) {
            tmp[key] = DataDefinition[type][key].value;
        }

        return Object.assign({}, { read: {}, write: tmp });
    }

    public static getConfig(): any {
        return {
            game: DataDefinition.game,
            renderer: DataDefinition.renderer,
            encoder: DataDefinition.encoder,
        };
    }
}

export class DataLog {
    private static _instance: DataLog;

    private dumpFile: { path: string; init: boolean };
    private headers: { renderer: string[]; encoder: string[] };
    private data: { renderer: any[]; encoder: any[] };

    private constructor() {
        this.dumpFile = {
            path: path.join(os.tmpdir(), "datalog.csv"),
            init: false,
        };
        this.headers = { renderer: [], encoder: [] };
        this.data = { renderer: [], encoder: [] };

        if (fs.existsSync(this.dumpFile.path)) {
            fs.rmSync(this.dumpFile.path);
        }
    }

    public static getInstance(): DataLog {
        if (!DataLog._instance) {
            DataLog._instance = new DataLog();
        }
        return DataLog._instance;
    }

    private initFile(): void {
        const headers = [...this.headers.renderer, ...this.headers.encoder];
        fs.writeFileSync(this.dumpFile.path, headers.join(",") + "\n");
        this.dumpFile.init = true;
    }

    private appendFile(): void {
        const data = [
            ...Object.values(this.data.renderer[this.data.renderer.length - 1]),
            ...Object.values(this.data.encoder[this.data.encoder.length - 1]),
        ];
        fs.appendFileSync(this.dumpFile.path, data.join(",") + "\n");
    }

    public getFile(): any {
        if (!this.dumpFile.init) return false;
        if (!fs.existsSync(this.dumpFile.path)) return false;
        return this.dumpFile.path;
    }

    public clear(): void {
        this.initFile();
    }

    public add(
        payload: any,
        type: "renderer" | "encoder",
        append = false
    ): void {
        if (this.headers[type].length === 0)
            this.headers[type].push(...Object.keys(payload));

        this.data[type].push(payload);

        if (this.data[type].length > 100)
            this.data[type].splice(0, this.data[type].length - 100);

        if (
            this.headers.renderer.length > 0 &&
            this.headers.encoder.length > 0 &&
            !this.dumpFile.init
        )
            this.initFile();

        if (
            this.data.renderer.length > 0 &&
            this.data.encoder.length > 0 &&
            this.dumpFile.init &&
            append
        ) {
            this.appendFile();
            this.data.encoder = [];
            this.data.renderer = [];
        }
    }
}
