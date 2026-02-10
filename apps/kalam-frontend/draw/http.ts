import { HTTP_URL } from "@/config";
import axios from "axios";

export type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "pencil";
    points: { x: number; y: number }[];
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isArrow: boolean;
};

export async function getExistingShapes(roomId: string): Promise<Shape[]> {
    // Check for backend token (NextAuth flow) or legacy token
    const token = localStorage.getItem("backend_token") || localStorage.getItem("token");
    if (!token) {
        throw new Error("No authentication token available");
    }

    const res = await axios.get(`${HTTP_URL}/chats/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const messages = res.data.messages;

    const shapes = messages
        .map((x: { message: string }) => {
            try {
                const messageData = JSON.parse(x.message);
                return messageData.shape;
            } catch {
                return null;
            }
        })
        .filter((shape: Shape | null): shape is Shape => shape !== null && shape !== undefined);

    return shapes;
}
