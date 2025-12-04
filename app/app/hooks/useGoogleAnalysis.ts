import { useEffect } from "react";

const getGAID = () => {
  if (typeof window === "undefined") return "";
  if (window.location.hostname === "dex.orderly.network") {
    return "G-N1SWYG7W4E";
  }
  return "G-7TY9TF6N3K";
};

export function useGoogleAnalysis() {
  useEffect(() => {
    const gaID = getGAID();
    if (!gaID) return;

    // @ts-ignore
    window.dataLayer = window.dataLayer || [];
    // @ts-ignore
    window.gtag =
      // @ts-ignore
      window.gtag ||
      function gtag(..._args: unknown[]) {
        // @ts-ignore
        window.dataLayer.push(arguments);
      };

    // @ts-ignore
    window.gtag("js", new Date());
    // @ts-ignore
    // window.gtag("config", gaID, { 'debug_mode': true });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaID}`;
    document.head.appendChild(script);

    const handleClick = (e: MouseEvent) => {
      let target = e.target as HTMLElement | null;
      const maxDepth = 5;
      let currentDepth = 0;

      while (target && target !== document.body && currentDepth < maxDepth) {
        const tagName = target.tagName;
        const classList = target.classList ? Array.from(target.classList) : [];
        const className =
          target.className && typeof target.className === "string"
            ? target.className
            : "";

        const isButton = tagName === "BUTTON";
        const isLink = tagName === "A";
        const isRoleButton = target.getAttribute("role") === "button";
        const isInputButton =
          tagName === "INPUT" &&
          ["button", "submit"].includes((target as HTMLInputElement).type);
        const hasButtonClass = classList.some(
          cls =>
            cls.includes("btn") ||
            cls.includes("button") ||
            cls.includes("cursor-pointer")
        );
        if (
          isButton ||
          isRoleButton ||
          isInputButton ||
          isLink ||
          hasButtonClass
        ) {
          const buttonText = target.innerText
            ? target.innerText.substring(0, 100)
            : "";
          const elementId = target.id || "";
          const elementClass = className;
          // @ts-ignore
          let linkUrl = target.href || target.getAttribute("data-link") || "";
          if (!linkUrl && target.closest) {
            const parent = target.closest("a");
            if (parent) {
              linkUrl = parent.href || "";
            }
          }

          // @ts-ignore
          window.gtag("event", "element_click", {
            button_text: buttonText,
            element_id: elementId,
            element_class: elementClass,
            link_url: linkUrl,
          });
          break;
        }

        target = target.parentElement;
        currentDepth++;
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.head.removeChild(script);
      document.removeEventListener("click", handleClick);
    };
  }, []);
}
