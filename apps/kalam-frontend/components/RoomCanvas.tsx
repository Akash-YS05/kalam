"use client";

import { WS_URL } from "@/config";
import { useEffect, useState, useRef, useCallback } from "react";
import Canvas from "./Canvas";
import { getExistingShapes, Shape } from "@/draw/http";
import { useBackendToken } from "@/hooks/useBackendToken";
import { useRouter } from "next/navigation";

const CONNECTION_TIMEOUT = 45000; // 45 seconds (allows for cold start)
const MAX_RECONNECT_ATTEMPTS = 3;
const COLD_START_THRESHOLD = 5000; // Show cold start message after 5 seconds

type ConnectionStage = "authenticating" | "waking" | "connecting" | "joining" | "loading" | "ready";

export default function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [initialShapes, setInitialShapes] = useState<Shape[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStage, setConnectionStage] = useState<ConnectionStage>("authenticating");
  const [connectionTime, setConnectionTime] = useState(0);
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);
  const reconnectAttempts = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const coldStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const router = useRouter();

  const { token, isLoading: isTokenLoading, error: tokenError } = useBackendToken();

  // Prefetch shapes immediately when token is available
  useEffect(() => {
    if (!token) return;

    setConnectionStage("loading");
    // Start fetching shapes immediately - don't wait for WebSocket
    getExistingShapes(roomId)
      .then((shapes) => {
        setInitialShapes(shapes);
      })
      .catch((err) => {
        console.error("Failed to prefetch shapes:", err);
        setInitialShapes([]); // Empty array as fallback
      });
  }, [roomId, token]);

  // Update stage based on token loading
  useEffect(() => {
    if (isTokenLoading) {
      setConnectionStage("authenticating");
    } else if (token && !isConnected) {
      setConnectionStage("waking");
    }
  }, [isTokenLoading, token, isConnected]);

  const connect = useCallback(() => {
    if (!token) {
      return;
    }

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Reset cold start state
    setShowColdStartMessage(false);
    setConnectionTime(0);
    setConnectionStage("waking");

    // Start connection timer
    const startTime = Date.now();
    connectionTimerRef.current = setInterval(() => {
      setConnectionTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Show cold start message after threshold
    coldStartTimerRef.current = setTimeout(() => {
      setShowColdStartMessage(true);
    }, COLD_START_THRESHOLD);

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    // Set connection timeout
    timeoutRef.current = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        clearTimers();
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          console.log(`Connection timeout. Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
          setTimeout(connect, delay);
        } else {
          setError("Connection timeout. The server may be unavailable.");
        }
      }
    }, CONNECTION_TIMEOUT);

    ws.onopen = () => {
      clearTimers();
      console.log("WebSocket connected");
      setConnectionStage("joining");
      setSocket(ws);
      setIsConnected(true);
      setError(null);
      reconnectAttempts.current = 0;

      ws.send(JSON.stringify({ type: "join_room", roomId }));
      setConnectionStage("ready");
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = (event) => {
      console.warn("WebSocket closed:", event.code, event.reason);
      setIsConnected(false);
      clearTimers();

      // Only attempt reconnection if not intentionally closed
      if (event.code !== 1000 && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(2000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        setTimeout(connect, delay);
      } else if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        setError("Connection lost. Please refresh the page.");
      }
    };
  }, [roomId, token]);

  const clearTimers = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (connectionTimerRef.current) {
      clearInterval(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }
    if (coldStartTimerRef.current) {
      clearTimeout(coldStartTimerRef.current);
      coldStartTimerRef.current = null;
    }
  };

  // Connect when token is ready
  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      clearTimers();
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "leave_room", roomId }));
        }
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [connect, roomId, token]);

  const handleRetry = () => {
    setError(null);
    reconnectAttempts.current = 0;
    connect();
  };

  // Redirect to signin if token error (not authenticated)
  if (tokenError) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center space-y-4">
          <p className="text-red-400">Authentication required</p>
          <button
            onClick={() => router.push("/signin")}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

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

  // Wait for token, WebSocket connection, AND initial shapes to be loaded
  if (isTokenLoading || !isConnected || initialShapes === null) {
    const stageMessages: Record<ConnectionStage, string> = {
      authenticating: "Authenticating...",
      waking: "Connecting to server...",
      connecting: "Establishing connection...",
      joining: "Joining room...",
      loading: "Loading canvas...",
      ready: "Almost ready..."
    };

    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-4">
          {/* Spinner */}
          <div className="relative">
            <svg
              className="animate-spin h-12 w-12 text-violet-400"
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
          </div>

          {/* Stage message */}
          <p className="text-lg font-medium text-gray-200">
            {stageMessages[connectionStage]}
          </p>

          {/* Connection time indicator */}
          {connectionTime > 0 && (
            <p className="text-sm text-gray-400">
              {connectionTime}s
            </p>
          )}

          {/* Cold start explanation */}
          {showColdStartMessage && (
            <div className="mt-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-300">
                The server is waking up from sleep mode. This usually takes 20-30 seconds on first visit.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Tip: The server stays awake for 15 minutes after activity.
              </p>
            </div>
          )}

          {/* Progress dots animation */}
          <div className="flex gap-1 mt-2">
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
          </div>
        </div>
      </div>
    );
  }

  return <Canvas roomId={roomId} socket={socket!} initialShapes={initialShapes} />;
}
