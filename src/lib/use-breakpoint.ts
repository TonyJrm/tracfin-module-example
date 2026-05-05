"use client";

import { useEffect, useState } from "react";

const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>("");

  useEffect(() => {
    const updateBreakpoint = () => {
      if (window.matchMedia(`(min-width: ${breakpoints["2xl"]})`).matches) {
        setCurrentBreakpoint("2xl");
      } else if (window.matchMedia(`(min-width: ${breakpoints.xl})`).matches) {
        setCurrentBreakpoint("xl");
      } else if (window.matchMedia(`(min-width: ${breakpoints.lg})`).matches) {
        setCurrentBreakpoint("lg");
      } else if (window.matchMedia(`(min-width: ${breakpoints.md})`).matches) {
        setCurrentBreakpoint("md");
      } else if (window.matchMedia(`(min-width: ${breakpoints.sm})`).matches) {
        setCurrentBreakpoint("sm");
      } else {
        setCurrentBreakpoint("xs");
      }
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);
    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  return currentBreakpoint;
}
