import React, { useState, useEffect } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";

export default function App() {
    const [state, setState] = useState({
        loading: false,
        buttons: [true, true, true],
        response: null,
        color: 0,
    });

    // Background color controller
    useEffect(() => {
        let color = "red";
        switch (state.color) {
            case 0:
                color = "red";
                break;
            case 1:
                color = "yellow";
                break;
            case 2:
                color = "green";
                break;
            default:
                break;
        }
        if (document.body.classList.length > 0)
            document.body.classList.remove(document.body.classList[0]);
        document.body.classList.add(color);
        return () => {};
    }, [state]);

    useEffect(() => {
        fetch(`/aws/status`, { cache: "no-cache" })
            .then((res) => res.json())
            .then((res) => {
                if (res.status) {
                    if (res.status === "running") {
                        setState({
                            ...state,
                            buttons: [true, false, false],
                            response: res,
                            color: 2,
                        });
                    } else if (res.status === "stopped") {
                        setState({
                            ...state,
                            buttons: [false, true, true],
                            color: 0,
                        });
                    } else {
                        setState({
                            ...state,
                            buttons: [true, true, true],
                            color: 1,
                        });
                    }
                }
            });
        return;
    }, []);

    const handler = (cmd) => {
        let message = `${cmd === "start" ? "Starting" : "Stopping"} instance`;
        setState({
            ...state,
            loading: message,
            buttons: [true, true, true],
            color: 1,
        });

        if (cmd === "open") {
            if (state.response?.url)
                window.open(`http://${state.response.url}:8080`, "_blank");
            setState({
                ...state,
                loading: false,
                buttons: [true, false, false],
                color: cmd === "start" ? 0 : 2,
            });
            return;
        }

        fetch(`/aws/${cmd}`)
            .then((res) => res.json())
            .then(async (res) => {
                if (!res.hasOwnProperty("status")) {
                    alert(JSON.stringify(res));
                    setState({
                        ...state,
                        loading: false,
                        buttons: [
                            cmd !== "start",
                            cmd !== "stop",
                            cmd !== "stop",
                        ],
                        color: cmd === "start" ? 0 : 2,
                    });
                    return;
                }

                // Wait for status
                let count = 0;
                const stepTime = 2500;
                const check = () =>
                    new Promise((resolve) => {
                        fetch(`/aws/status`, { cache: "no-cache" })
                            .then((res) => res.json())
                            .then((res) => {
                                if (!res.hasOwnProperty("status")) {
                                    alert(JSON.stringify(res));
                                    setState({
                                        ...state,
                                        loading: false,
                                        buttons: [
                                            cmd !== "start",
                                            cmd !== "stop",
                                            cmd !== "stop",
                                        ],
                                        color: cmd === "start" ? 0 : 2,
                                    });
                                    return;
                                }

                                setState({
                                    ...state,
                                    loading: `${message}... ${
                                        (++count * stepTime) / 1000
                                    }s`,
                                    buttons: [true, true, true],
                                    color: 1,
                                });

                                if (
                                    cmd === "start" &&
                                    (!res.hasOwnProperty("url") ||
                                        res.status !== "running")
                                )
                                    return resolve(false);
                                if (cmd === "stop" && res.status !== "stopped")
                                    return resolve(false);

                                setState({
                                    ...state,
                                    loading: false,
                                    buttons: [
                                        cmd !== "stop",
                                        cmd !== "start",
                                        cmd !== "start",
                                    ],
                                    response: res,
                                    color: cmd === "start" ? 2 : 0,
                                });
                                resolve(true);
                            });
                    });

                let interval = () =>
                    new Promise((resolve) => {
                        check().then((exit) => {
                            if (exit) return resolve();
                            setTimeout(interval, stepTime);
                        });
                    });
                await interval();
            });
    };

    return (
        <div className="center">
            <h1>
                Joint Rendering-Encoding
                <br />
                Cloud Gaming
            </h1>
            {state.loading ? (
                <div className="status">
                    <span>{state.loading}</span>
                    <ScaleLoader />
                </div>
            ) : (
                <hr />
            )}
            <div className="buttons">
                <button
                    onClick={() => handler("start")}
                    disabled={state.buttons[0]}
                >
                    Start
                </button>
                <button
                    onClick={() => handler("stop")}
                    disabled={state.buttons[1]}
                >
                    Stop
                </button>
                <button
                    onClick={() => handler("open")}
                    disabled={state.buttons[2]}
                >
                    Open
                </button>
            </div>
        </div>
    );
}
