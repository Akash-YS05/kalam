import RoomCanvas from "@/components/RoomCanvas";

interface CanvasPageProps {
  params: { roomId: string };
}

export default function CanvasPage({ params }: CanvasPageProps) {
  const { roomId } = params;

  return <RoomCanvas roomId={roomId} />;
}
