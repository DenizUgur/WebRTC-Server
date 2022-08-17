import React, { useState, useEffect } from "react";
import { Player } from "./components";

export default function App() {
    const [state, setState] = useState(false);
    const [codec, setCodec] = useState("video/VP8");

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const codecParam = queryParams.get("codec");
        if (codecParam !== "") setCodec(codecParam);

        return () => {};
    }, []);

    return (
        <div>
            <Player state={state} codecMimeType={codec} />
            <button onClick={() => setState(!state)}>Toggle</button>
        </div>
    );
}
