"use client";

import { ThemeProvider } from "@/context/ThemeContext";
import { UIProvider } from "@/context/UIContext";
import { ToastProvider } from "@/context/ToastContext";
import { ModalProvider } from "@/context/ModalContext";
import { RevealObserver } from "@/hooks/useReveal";
import { SmoothScroll } from "./SmoothScroll";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UIProvider>
        <ToastProvider>
          <ModalProvider>
            <SmoothScroll />
            <RevealObserver />
            {children}
          </ModalProvider>
        </ToastProvider>
      </UIProvider>
    </ThemeProvider>
  );
}
