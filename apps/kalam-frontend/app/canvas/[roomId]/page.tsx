import RoomCanvas from "@/components/RoomCanvas";

type paramsType = Promise<{ roomId: string }>;

export default async function CanvasPage({ params }: {
    params: paramsType
}) {
    const roomId = (await params).roomId;

    return <RoomCanvas roomId={roomId} />
   
}