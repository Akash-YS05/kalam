"use client";

import { WS_URL } from "@/config";
import { useEffect, useState, useRef, useCallback } from "react";
import Canvas from "./Canvas";
import { getExistingShapes, Shape } from "@/draw/http";

const CONNECTION_TIMEOUT = 10000; // 10 seconds
const MAX_RECONNECT_ATTEMPTS = 5;

export default function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [initialShapes, setInitialShapes] = useState<Shape[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reconnectAttempts = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Prefetch shapes immediately (parallel with WebSocket connection)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token");
      return;
    }

    // Start fetching shapes immediately - don't wait for WebSocket
    getExistingShapes(roomId)
      .then((shapes) => {
        setInitialShapes(shapes);
      })
      .catch((err) => {
        console.error("Failed to prefetch shapes:", err);
        setInitialShapes([]); // Empty array as fallback
      });
  }, [roomId]);

  const connect = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("No authentication token");
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    // Set connection timeout
    timeoutRef.current = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          console.log(`Connection timeout. Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          setTimeout(connect, delay);
        } else {
          setError("Connection timeout. Please check your internet connection.");
        }
      }
    }, CONNECTION_TIMEOUT);

    ws.onopen = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      console.log("WebSocket connected");
      setSocket(ws);
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;

      ws.send(JSON.stringify({ type: "join_room", roomId }));
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = (event) => {
      console.warn("WebSocket closed:", event.code, event.reason);
      setIsConnected(false);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Only attempt reconnection if not intentionally closed
      if (event.code !== 1000 && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        setTimeout(connect, delay);
      } else if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        setError("Connection lost. Please refresh the page.");
      }
    };
  }, [roomId]);

  useEffect(() => {
    connect();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "leave_room", roomId }));
        }
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [connect, roomId]);

  const handleRetry = () => {
    setError(null);
    reconnectAttempts.current = 0;
    connect();
  };

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <p className="text-red-400">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Wait for both WebSocket connection AND initial shapes to be loaded
  if (!isConnected || initialShapes === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-violet-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            ></path>
          </svg>
          <p className="text-lg font-light text-gray-300">
            {!isConnected ? "Connecting to canvas..." : "Loading shapes..."}
          </p>
        </div>
      </div>
    );
  }

  return <Canvas roomId={roomId} socket={socket!} initialShapes={initialShapes} />;
}
