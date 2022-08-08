import React, { useEffect, useRef, useState } from "react";
import styles from "./Player.module.scss";

import { Receiver } from "../../lib/receiver.js";
import { getServerConfig } from "../../lib/internal/config.js";

const supportsSetCodecPreferences =
    window.RTCRtpTransceiver &&
    "setCodecPreferences" in window.RTCRtpTransceiver.prototype;

function gatherCodecs() {
    let ret_codecs = [];
    if (!supportsSetCodecPreferences) return ret_codecs;

    const codecs = RTCRtpSender.getCapabilities("video").codecs;
    codecs.forEach((codec) => {
        if (["video/red", "video/ulpfec", "video/rtx"].includes(codec.mimeType))
            return;

        ret_codecs.push({
            mimeType: codec.mimeType,
            sdpFmtpLine: codec.sdpFmtpLine,
            value: (codec.mimeType + " " + (codec.sdpFmtpLine || "")).trim(),
        });
    });
    return ret_codecs;
}

async function setupVideoPlayer(elements, codecs, codecMimeType) {
    const receiver = new Receiver(elements);

    const res = await getServerConfig();
    let useWebSocket = res.useWebSocket;

    let selectedCodecs = null;
    if (supportsSetCodecPreferences) {
        const preferredCodec = codecs.filter(
            (codec) => codec.mimeType === codecMimeType
        )[0];
        if (preferredCodec.value !== "") {
            const { mimeType, sdpFmtpLine } = preferredCodec;
            const { codecs } = RTCRtpSender.getCapabilities("video");
            console.error(codecs);
            const selectedCodecIndex = codecs.findIndex(
                (c) => c.mimeType === mimeType && c.sdpFmtpLine === sdpFmtpLine
            );
            const selectCodec = codecs[selectedCodecIndex];
            selectedCodecs = [selectCodec];
        }
    }

    await receiver.setupConnection(useWebSocket, selectedCodecs);
    console.log(receiver);
    return receiver;
}

function Player(props) {
    const { state, codecMimeType } = props;
    const [receiver, setReceiver] = useState(null);
    const player = useRef(null);

    async function play() {
        const codecs = gatherCodecs();
        await setupVideoPlayer(player.current, codecs, codecMimeType).then(
            (receiver) => {
                setReceiver(receiver);
                window.addEventListener(
                    "resize",
                    function () {
                        receiver.resizeVideo();
                    },
                    true
                );
                window.addEventListener(
                    "beforeunload",
                    async () => {
                        await receiver.stop();
                    },
                    true
                );
            }
        );
    }

    function stop() {
        if (receiver === null) return;
        let element = player.current;
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        receiver.stop();
        element.load();
        setReceiver(null);
    }

    useEffect(() => {
        if (state) play();
        else stop();
        return () => {};
    }, [state]);

    return <video ref={player} />;
}

export default Player;
