"use client";

import { WS_URL, HTTP_URL } from "@/config";
import { useEffect, useState, useRef, useCallback } from "react";
import Canvas from "./Canvas";
import { getExistingShapes, Shape } from "@/draw/http";
import { useBackendToken } from "@/hooks/useBackendToken";
import { useRouter } from "next/navigation";

const CONNECTION_TIMEOUT = 60000; // 60 seconds (allows for cold start)
const MAX_RECONNECT_ATTEMPTS = 5;
const COLD_START_THRESHOLD = 3000; // Show cold start message after 3 seconds
const WAKE_UP_TIMEOUT = 45000; // 45 seconds for wake-up call
const INITIAL_RETRY_DELAY = 1000; // Start with 1 second delay

type ConnectionStage = "authenticating" | "waking" | "connecting" | "joining" | "loading" | "ready";

// Wake up the server before attempting WebSocket connection
async function wakeUpServer(signal?: AbortSignal): Promise<boolean> {
  try {
    // Simple health check / ping to wake up the HTTP server
    // The HTTP and WS servers are usually on the same instance
    const response = await fetch(`${HTTP_URL}/health`, { 
      signal,
      // Don't cache this request
      cache: 'no-store',
    });
    return response.ok;
  } catch (error) {
    // If there's no /health endpoint, try the root or any lightweight endpoint
    try {
      const response = await fetch(`${HTTP_URL}/`, { 
        signal,
        method: 'HEAD',
        cache: 'no-store',
      });
      return response.ok || response.status === 404; // 404 is fine, server is awake
    } catch {
      return false;
    }
  }
}

export default function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [initialShapes, setInitialShapes] = useState<Shape[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStage, setConnectionStage] = useState<ConnectionStage>("authenticating");
  const [connectionTime, setConnectionTime] = useState(0);
  const [showColdStartMessage, setShowColdStartMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const reconnectAttempts = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const coldStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isConnectingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
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

  const clearTimers = useCallback(() => {
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!token || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Reset state
    setShowColdStartMessage(false);
    setConnectionTime(0);
    setConnectionStage("waking");
    setError(null);

    // Create abort controller for wake-up request
    abortControllerRef.current = new AbortController();

    // Start connection timer
    const startTime = Date.now();
    connectionTimerRef.current = setInterval(() => {
      setConnectionTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Show cold start message after threshold
    coldStartTimerRef.current = setTimeout(() => {
      setShowColdStartMessage(true);
    }, COLD_START_THRESHOLD);

    try {
      // Step 1: Wake up the server first with HTTP request
      console.log("Waking up server...");
      const wakeUpPromise = wakeUpServer(abortControllerRef.current.signal);
      const wakeUpTimeout = new Promise<boolean>((resolve) => 
        setTimeout(() => resolve(false), WAKE_UP_TIMEOUT)
      );
      
      const isAwake = await Promise.race([wakeUpPromise, wakeUpTimeout]);
      
      if (!isAwake) {
        console.log("Server wake-up timed out, attempting WebSocket anyway...");
      } else {
        console.log("Server is awake, connecting WebSocket...");
      }

      // Step 2: Now attempt WebSocket connection
      setConnectionStage("connecting");
      
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      wsRef.current = ws;

      // Set connection timeout
      timeoutRef.current = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log("WebSocket connection timeout");
          ws.close();
          isConnectingRef.current = false;
          clearTimers();
          
          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            // Exponential backoff with jitter
            const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, reconnectAttempts.current);
            const jitter = Math.random() * 1000;
            const delay = Math.min(baseDelay + jitter, 30000);
            reconnectAttempts.current++;
            setRetryCount(reconnectAttempts.current);
            console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
            setTimeout(connect, delay);
          } else {
            setError("Unable to connect to the server. Please try again later.");
          }
        }
      }, CONNECTION_TIMEOUT);

      ws.onopen = () => {
        clearTimers();
        console.log("WebSocket connected successfully");
        setConnectionStage("joining");
        setSocket(ws);
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        setRetryCount(0);
        isConnectingRef.current = false;

        ws.send(JSON.stringify({ type: "join_room", roomId }));
        setConnectionStage("ready");
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        // Don't set error here - let onclose handle reconnection
      };

      ws.onclose = (event) => {
        console.warn("WebSocket closed:", event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        isConnectingRef.current = false;
        
        // Don't clear timers here if we're still in initial connection phase
        if (event.code !== 1000) {
          clearTimers();
        }

        // Only attempt reconnection for unexpected closures
        // Code 1000 = normal closure, 1001 = going away (navigation)
        if (event.code !== 1000 && event.code !== 1001 && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, reconnectAttempts.current);
          const jitter = Math.random() * 1000;
          const delay = Math.min(baseDelay + jitter, 30000);
          reconnectAttempts.current++;
          setRetryCount(reconnectAttempts.current);
          console.log(`Connection lost. Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`);
          setTimeout(connect, delay);
        } else if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
          setError("Connection lost after multiple attempts. Please refresh the page.");
        }
      };

    } catch (err) {
      console.error("Connection error:", err);
      isConnectingRef.current = false;
      clearTimers();
      
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, reconnectAttempts.current);
        const jitter = Math.random() * 1000;
        const delay = Math.min(baseDelay + jitter, 30000);
        reconnectAttempts.current++;
        setRetryCount(reconnectAttempts.current);
        setTimeout(connect, delay);
      } else {
        setError("Failed to connect. Please check your connection and try again.");
      }
    }
  }, [roomId, token, clearTimers]);

  // Connect when token is ready
  useEffect(() => {
    if (token && !isConnected && !isConnectingRef.current) {
      connect();
    }

    return () => {
      clearTimers();
      isConnectingRef.current = false;
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "leave_room", roomId }));
        }
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [connect, roomId, token, isConnected, clearTimers]);

  const handleRetry = () => {
    setError(null);
    reconnectAttempts.current = 0;
    setRetryCount(0);
    isConnectingRef.current = false;
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
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-red-400 text-lg">{error}</div>
          <p className="text-gray-400 text-sm">
            This might be due to a cold start. The server needs a moment to wake up.
          </p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="block mx-auto text-gray-400 hover:text-white text-sm transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Wait for token, WebSocket connection, AND initial shapes to be loaded
  if (isTokenLoading || !isConnected || initialShapes === null) {
    const stageMessages: Record<ConnectionStage, string> = {
      authenticating: "Authenticating...",
      waking: "Waking up server...",
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

          {/* Connection time and retry count */}
          <div className="flex items-center gap-3 text-sm text-gray-400">
            {connectionTime > 0 && (
              <span>{connectionTime}s</span>
            )}
            {retryCount > 0 && (
              <span className="px-2 py-0.5 bg-gray-800 rounded text-xs">
                Attempt {retryCount}/{MAX_RECONNECT_ATTEMPTS}
              </span>
            )}
          </div>

          {/* Cold start explanation */}
          {showColdStartMessage && (
            <div className="mt-2 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-300">
                The server is waking up from sleep mode. This typically takes 15-30 seconds on first visit.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Free-tier servers sleep after 15 minutes of inactivity.
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
