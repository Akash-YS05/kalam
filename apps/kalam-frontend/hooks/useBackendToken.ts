"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

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

  const fetchToken = useCallback(async () => {
    // Check localStorage first for cached token
    const cachedToken = localStorage.getItem("backend_token");
    if (cachedToken) {
      setToken(cachedToken);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/token");
      
      if (!response.ok) {
        throw new Error("Failed to get backend token");
      }

      const data = await response.json();
      
      if (data.token) {
        localStorage.setItem("backend_token", data.token);
        setToken(data.token);
      } else {
        throw new Error("No token in response");
      }
    } catch (err) {
      console.error("Error fetching backend token:", err);
      setError(err instanceof Error ? err.message : "Failed to get token");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for session to be determined
    if (status === "loading") {
      return;
    }

    // No session means not authenticated
    if (status === "unauthenticated" || !session) {
      setToken(null);
      setIsLoading(false);
      // Clear both old and new token keys
      localStorage.removeItem("backend_token");
      localStorage.removeItem("token");
      return;
    }

    // Session exists, fetch backend token
    fetchToken();
  }, [session, status, fetchToken]);

  const refetch = useCallback(async () => {
    localStorage.removeItem("backend_token");
    await fetchToken();
  }, [fetchToken]);

  return { token, isLoading: status === "loading" || isLoading, error, refetch };
}
