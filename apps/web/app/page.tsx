"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function Home() {

  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  return (
    <div>
      <div className="flex h-screen w-screen justify-center items-center gap-4">
        <input className="p-2 rounded-lg border border-slate-500" type="text" value={roomId} placeholder="Room ID" onChange={(e) => {
          setRoomId(e.target.value)
        }} />
        <button className="py-2 px-4 rounded-md border border-black" onClick={() => {
          router.push(`/room/${roomId}`)
        }}>Join Room</button>
      </div>
      
    </div>
  );
}
