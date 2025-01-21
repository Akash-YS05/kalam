import axios from "axios";
import { BACKEND_URL } from "../../config";
import ChatRoom from "../../../components/ChatRoom";

async function getRoom(slug: string) {
    const res = await axios.get(`${BACKEND_URL}/room/${slug}`)
    return res.data.room.id
}

export default async function Chat({
    params
}: {
    params: {
        slug: string;
    } 
}) {
    const slug = (await params).slug;
    const roomId = await getRoom(slug);

    return <ChatRoom id={roomId}/>
    
}
