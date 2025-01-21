import { useEffect, useState } from "react";
import { WS_URL } from "../app/config";

export function useSocket() {

    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyZjIyMWUyZi05ODM1LTRiY2QtYTk1MC0xMGMzYzczMDk1YmEiLCJpYXQiOjE3MzczNzIzNjF9.DNi5w3LoNLFm7oi4jQ0uL_5sSOKi7hOoDwA_G4MsrDg`)
        ws.onopen = () => {
            setLoading(false);
            setSocket(ws);
        }
    }, []);

    return {
        socket,
        loading
    }
}