
// import Canvas from "@/components/Canvas";
import RoomCanvas from "@/components/RoomCanvas";
import { initDraw } from "@/draw";
import { useEffect, useRef } from "react"

export default async function CanvasPage({params} : {
    params: {
        roomId: string
    }
}) {

    const roomId = (await params).roomId;
    console.log(roomId);
    

    return <RoomCanvas roomId={roomId} />
    
}

