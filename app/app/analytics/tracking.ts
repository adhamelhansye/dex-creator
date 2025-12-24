/**
 * Event-driven analytics tracking system
 *
 * Business code should use `trackEvent()` to emit analytics events.
 * All GA operations are handled centrally in `useGoogleAnalysis` hook.
 */

export const APP_ANALYTICS_EVENT = "app:analytics";

/**
 * Analytics event structure
 */
export interface AnalyticsEvent {
  eventName: string;
  params: Record<string, any>;
}

/**
 * Generic event tracking function
 * Dispatches a CustomEvent that will be caught by useGoogleAnalysis
 *
 * @param eventName - The event identifier (will be used as GA event name)
 * @param params - Event parameters (will be passed directly to GA)
 *
 * @example
 * trackEvent("connect_wallet_success", { address: "0x123..." });
 * trackEvent("user_action", { action_type: "deposit", amount: 100 });
 */
export function trackEvent(
  eventName: string,
  params: Record<string, any> = {}
): void {
  // SSR-safe: no-op if window is undefined
  if (typeof window === "undefined") {
    return;
  }

  const event = new CustomEvent<AnalyticsEvent>(APP_ANALYTICS_EVENT, {
    detail: {
      eventName,
      params,
    },
  });

  window.dispatchEvent(event);
}

/**
 * Type augmentation for window event map
 * This enables TypeScript to recognize our custom event type
 */
declare global {
  interface WindowEventMap {
    [APP_ANALYTICS_EVENT]: CustomEvent<AnalyticsEvent>;
  }
}
