import { ChildProcess, spawn } from "child_process";

enum State {
    Idle = 1,
    Starting,
    Running,
    Stopping,
}

const clamp = (num: number, min: number, max: number) =>
    Math.min(Math.max(num, min), max);

export default class GameControl {
    private state: State;
    private level: number;
    private game: string;
    private process: ChildProcess;

    constructor(level = 0, game = "FlyDangerous") {
        this.state = State.Idle;
        this.game = game;
        this.level = clamp(level, 0, 15);

        if (process.env.GAME_FD_BIN_PATH === undefined)
            throw new Error("GAME_FD_BIN_PATH is not set");

        if (process.env.GAME_FPS_BIN_PATH === undefined)
            throw new Error("GAME_FPS_BIN_PATH is not set");
    }

    public updateParams(params: { level: number; game: string }): void {
        this.level = clamp(params.level, 0, 15);
        this.game = params.game;
    }

    public async start(): Promise<void> {
        return new Promise((resolve) => {
            if (this.state === State.Idle) {
                this.state = State.Starting;

                const bin_path =
                    this.game === "FlyDangerous"
                        ? process.env.GAME_FD_BIN_PATH
                        : process.env.GAME_FPS_BIN_PATH;

                this.process = spawn(
                    bin_path,
                    [
                        "--level",
                        this.level.toString(),
                        "--send-interval",
                        "0.2",
                        "--update-interval",
                        "0.2",
                    ],
                    { stdio: "ignore" }
                );
                this.state = State.Running;
                resolve();
            } else
                throw new Error("Game is already running or not yet stopped");
        });
    }

    public async stop(): Promise<void> {
        return new Promise((resolve) => {
            if (this.state === State.Running) {
                this.state = State.Stopping;
                this.process.on("exit", () => {
                    this.state = State.Idle;
                    resolve();
                });
                this.process.kill("SIGINT");
            } else throw new Error("Game is not running");
        });
    }

    public async restart(): Promise<void> {
        await this.stop();
        await this.start();
    }
}
