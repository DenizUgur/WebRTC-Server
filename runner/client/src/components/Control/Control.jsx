import React, { useEffect, useRef, useState } from "react";
import { WS } from "../../helpers/ws";

export default function Control(props) {
    const { name, type, data } = props;
    const [state, setState] = useState(data.value);
    const ws = useRef(null);

    useEffect(() => {
        ws.current = WS.getInstance();
        return () => {};
    }, []);

    const handler = (input) => {
        if (input === "checkbox") {
            return (e) => {
                ws.current.command("peer", {
                    [type]: { [name]: e.target.checked },
                });
            };
        } else {
            return (e) => {
                setState(parseInt(e.target.value));
                ws.current.command("peer", {
                    [type]: { [name]: parseInt(e.target.value) },
                });
            };
        }
    };

    let control;

    if (data.range.boolean) {
        control = (
            <input
                type="checkbox"
                onChange={handler("checkbox")}
                defaultChecked={data.value}
            />
        );
    } else if (data.range.valid) {
        control = (
            <select onChange={handler()} defaultValue={data.value}>
                {data.range.valid.map((v) => (
                    <option key={v} value={v}>
                        {v}
                    </option>
                ))}
            </select>
        );
    } else {
        control = (
            <input
                type="number"
                min={data.range.min}
                {...(data.range.max && { max: data.range.max })}
                defaultValue={data.value}
                onChange={handler()}
            />
        );
    }

    return (
        <div>
            <label>{name}: </label>
            {control}
        </div>
    );
}
