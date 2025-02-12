"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import Canvas from "./Canvas";

export default function RoomCanvas({roomId} : {roomId: string}) {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYTVhN2ViYi1mYWNhLTQzMDQtYjM0ZC1iNDk5NGU0YjZiOGMiLCJpYXQiOjE3MzgwNzk1NDV9.tVmaWe57lVptBXP6NGD8EEWzyF0aig_N4hFE7PKsMA0`);

        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }))
        }
    }, [])



    if (!socket) {
        return <div>
            Connecting to server...
        </div>
    }
    return (
        <Canvas roomId={roomId} socket={socket}/>
    )
}