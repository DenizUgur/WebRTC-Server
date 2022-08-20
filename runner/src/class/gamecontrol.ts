import { ChildProcess, spawn } from "child_process";
import kill from "tree-kill";

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
    private process: ChildProcess;

    constructor(level = 0) {
        this.state = State.Idle;
        this.level = clamp(level, 0, 15);

        if (process.env.GAME_BIN_PATH === undefined)
            throw new Error("GAME_BIN_PATH is not set");
    }

    public async start(): Promise<void> {
        return new Promise((resolve) => {
            if (this.state === State.Idle) {
                this.state = State.Starting;
                this.process = spawn(
                    process.env.GAME_BIN_PATH,
                    ["--level", this.level.toString()],
                    { stdio: "ignore" }
                );
                this.process.on("spawn", () => {
                    this.state = State.Running;
                    resolve();
                });
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
                kill(this.process.pid, "SIGINT");
            } else throw new Error("Game is not running");
        });
    }

    public async changeLevel(level: number): Promise<void> {
        this.level = clamp(level, 0, 15);
        await this.stop();
        await this.start();
    }
}
