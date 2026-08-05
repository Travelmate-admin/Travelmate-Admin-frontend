import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Resets scroll to the top on every route change so each page (and each
// step that navigates to a new route) starts from the beginning instead of
// keeping the previous page's scroll position.
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const reset = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      } catch {
        window.scrollTo(0, 0);
      }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const content = document.querySelector(".content");
      if (content) content.scrollTop = 0;
    };
    reset();
    const raf = requestAnimationFrame(reset);
    return () => cancelAnimationFrame(raf);
  }, [pathname, search]);

  return null;
}
