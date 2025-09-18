import { useState, useEffect, useCallback, useRef } from "react";
import { get } from "../utils/apiClient";
import { useAuth } from "../context/AuthContext";

interface RateLimitStatus {
  isRateLimited: boolean;
  remainingCooldownSeconds: number;
  cooldownMinutes: number;
  message: string;
}

interface UseRateLimitCountdownResult {
  isRateLimited: boolean;
  remainingSeconds: number;
  formattedTime: string;
  checkRateLimit: () => Promise<void>;
  isChecking: boolean;
}

/**
 * Hook to manage DEX deployment rate limiting countdown
 * Checks rate limit status and provides countdown timer
 */
export function useRateLimitCountdown(
  enabled: boolean = true
): UseRateLimitCountdownResult {
  const { token, isAuthenticated } = useAuth();
  const [rateLimitStatus, setRateLimitStatus] =
    useState<RateLimitStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }, []);

  const checkRateLimit = useCallback(async () => {
    if (!enabled || !isAuthenticated || !token) {
      return;
    }

    setIsChecking(true);
    try {
      const status = await get<RateLimitStatus>(
        "api/dex/rate-limit-status",
        token,
        { showToastOnError: false }
      );

      setRateLimitStatus(status);
      setRemainingSeconds(status.remainingCooldownSeconds);
    } catch (error) {
      console.debug("Error checking rate limit:", error);
    } finally {
      setIsChecking(false);
    }
  }, [enabled, isAuthenticated, token]);

  const debouncedCheckRateLimit = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      checkRateLimit();
    }, 500);
  }, [checkRateLimit]);

  useEffect(() => {
    if (!enabled || !rateLimitStatus?.isRateLimited || remainingSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        const newValue = prev - 1;

        if (newValue <= 0) {
          setTimeout(() => checkRateLimit(), 100);
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, rateLimitStatus?.isRateLimited, checkRateLimit]);

  useEffect(() => {
    if (enabled && isAuthenticated && token) {
      checkRateLimit();
    }
  }, [enabled, isAuthenticated, token, checkRateLimit]);

  useEffect(() => {
    if (!enabled || !isAuthenticated || !token) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        debouncedCheckRateLimit();
      }
    };

    const handleWindowFocus = () => {
      debouncedCheckRateLimit();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [enabled, isAuthenticated, token, debouncedCheckRateLimit]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    isRateLimited: Boolean(
      enabled && rateLimitStatus?.isRateLimited && remainingSeconds > 0
    ),
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    checkRateLimit,
    isChecking,
  };
}
