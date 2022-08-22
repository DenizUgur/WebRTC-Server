import React, { useState, useEffect, useRef } from "react";
import styles from "./App.module.scss";

import { Player } from "./components";
import { WS } from "./helpers/ws";

export default function App() {
    const [state, setState] = useState(false);
    const ws = useRef(null);

    useEffect(() => {
        ws.current = WS.getInstance();
        ws.current.connect();

        return () => {
            ws.current.disconnect();
        };
    }, []);

    return (
        <div className={styles.root}>
            <div className={styles.player}>
                <Player state={state} codecMimeType="video/H264" />
                <div>
                    <button onClick={() => setState(!state)}>Play</button>
                    <button onClick={() => ws.current.command("start")}>
                        Start Game
                    </button>
                    <button onClick={() => ws.current.command("stop")}>
                        Stop Game
                    </button>
                    <button
                        onClick={() =>
                            ws.current.command("change_level", { level: 2 })
                        }
                    >
                        Change Level
                    </button>
                    <button onClick={() => ws.current.command("flush")}>
                        Flush Log
                    </button>
                    <button onClick={() => window.open("/datalog", "_blank")}>
                        Download Log
                    </button>
                </div>
            </div>
            <div className={styles.control}></div>
        </div>
    );
}
