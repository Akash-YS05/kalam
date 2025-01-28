"use client";

import { WS_URL } from "@/config";
import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";

export default function Canvas({roomId} : {roomId: string}) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            setSocket(ws);
        }
    }, [])

    useEffect(() => {

        if (canvasRef.current) {
            
            initDraw(canvasRef.current, roomId);
            
        }

    }, [canvasRef])

    if (!socket) {
        return <div>
            Connecting to server...
        </div>
    }
    return (
        <canvas ref={canvasRef} height={1000} width={2000}></canvas>
    )
}