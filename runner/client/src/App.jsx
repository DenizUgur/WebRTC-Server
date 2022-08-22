import React, { useState, useEffect, useRef } from "react";
import styles from "./App.module.scss";

import { Control, Player } from "./components";
import { WS } from "./helpers/ws";

export default function App() {
    const [state, setState] = useState(false);
    const [config, setConfig] = useState(null);
    const ws = useRef(null);

    useEffect(() => {
        ws.current = WS.getInstance();
        ws.current.connect();

        fetch("/config")
            .then((res) => res.json())
            .then(setConfig);

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
            <div className={styles.control}>
                {config &&
                    Object.keys(config.dataConfig).map((type) => {
                        const items = Object.keys(config.dataConfig[type]).map(
                            (key) => {
                                return (
                                    <Control
                                        key={key}
                                        name={key}
                                        type={type}
                                        data={config.dataConfig[type][key]}
                                    />
                                );
                            }
                        );
                        return (
                            <div key={type}>
                                <h3>{type} settings</h3>
                                <div>{items}</div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
