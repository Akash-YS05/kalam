
import RoomCanvas from "@/components/RoomCanvas";
type CanvasPageProps = {
    params: { roomId: string };
  };

export default function CanvasPage({params} : CanvasPageProps) {

    const roomId = params.roomId;
    console.log(roomId);
    

    return <RoomCanvas roomId={roomId} />
    
}

