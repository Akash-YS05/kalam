
import RoomCanvas from "@/components/RoomCanvas";


export default async function CanvasPage({params} : {
    params: {
        roomId: string
    }
}) {

    const roomId = params.roomId;
    console.log(roomId);
    

    return <RoomCanvas roomId={roomId} />
    
}

