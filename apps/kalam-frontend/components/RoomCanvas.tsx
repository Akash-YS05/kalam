"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import Canvas from "./Canvas";

export default function RoomCanvas({roomId} : {roomId: string}) {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("No token found :(");
            return;
        }

        const ws = new WebSocket(`${WS_URL}?token=${token}`);

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



































