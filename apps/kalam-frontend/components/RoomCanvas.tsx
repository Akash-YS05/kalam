"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import Canvas from "./Canvas";

export default function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found");
      return;
    }

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    setSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connected");
      ws.send(JSON.stringify({
        type: "join_room",
        roomId
      }));
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.warn("WebSocket closed");
    };

    return () => {
      ws.send(JSON.stringify({
        type: "leave_room",
        roomId
      }));
      ws.close();
    };
  }, [roomId]);

  if (!socket) {
    return <div className="h-screen w-full bg-gray-900 text-white text-xl text-center">Connecting to server...</div>;
  }

  return <Canvas roomId={roomId} socket={socket} />;
}
