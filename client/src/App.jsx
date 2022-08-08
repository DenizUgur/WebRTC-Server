import React, { useState } from "react";
import { Player } from "./components";

export default function App() {
    const [state, setState] = useState(false);

    return (
        <div>
            <Player state={state} codecMimeType={"video/VP8"} />
            <button onClick={() => setState(!state)}>Toggle</button>
        </div>
    );
}
