"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useRef } from "react";

interface UseBackendTokenResult {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBackendToken(): UseBackendTokenResult {
  const { data: session, status } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSessionId = useRef<string | null>(null);

  const fetchToken = useCallback(async (forceRefresh = false) => {
    // Check localStorage first for cached token (unless force refresh)
    if (!forceRefresh) {
      const cachedToken = localStorage.getItem("backend_token");
      const cachedUserId = localStorage.getItem("backend_token_user_id");
      
      // Only use cached token if it belongs to current user
      if (cachedToken && cachedUserId === session?.user?.id) {
        setToken(cachedToken);
        setIsLoading(false);
        return;
      }
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/token");
      
      if (!response.ok) {
        if (response.status === 401) {
          // Session is invalid, clear everything
          localStorage.removeItem("backend_token");
          localStorage.removeItem("backend_token_user_id");
          localStorage.removeItem("token");
          throw new Error("Session expired, please sign in again");
        }
        throw new Error("Failed to get backend token");
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem("backend_token", data.token);
        // Store which user this token belongs to
        if (session?.user?.id) {
          localStorage.setItem("backend_token_user_id", session.user.id);
        }
        setToken(data.token);
      } else {
        throw new Error("No token in response");
      }
    } catch (err) {
      console.error("Error fetching backend token:", err);
      setError(err instanceof Error ? err.message : "Failed to get token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    // Wait for session to be determined
    if (status === "loading") {
      return;
    }

    // No session means not authenticated
    if (status === "unauthenticated" || !session) {
      setToken(null);
      setIsLoading(false);
      // Clear all token storage
      localStorage.removeItem("backend_token");
      localStorage.removeItem("backend_token_user_id");
      localStorage.removeItem("token");
      return;
    }

    // Check if user has changed (different user signed in)
    const currentUserId = session.user?.id;
    if (lastSessionId.current && lastSessionId.current !== currentUserId) {
      // User changed, force refresh token
      localStorage.removeItem("backend_token");
      localStorage.removeItem("backend_token_user_id");
      localStorage.removeItem("token");
    }
    lastSessionId.current = currentUserId || null;

    // Session exists, fetch backend token
    fetchToken();
  }, [session, status, fetchToken]);

  const refetch = useCallback(async () => {
    localStorage.removeItem("backend_token");
    localStorage.removeItem("backend_token_user_id");
    await fetchToken(true);
  }, [fetchToken]);

  return { token, isLoading: status === "loading" || isLoading, error, refetch };
}
