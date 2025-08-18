// hooks/useConnectionMonitor.ts
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { vapiWrapper as vapi } from "@/lib/vapi-wrapper";

export function useConnectionMonitor(
  isActive: boolean,
  onDisconnect: () => void
) {
  const lastActivityRef = useRef<number>(Date.now());
  const monitorIntervalRef = useRef<NodeJS.Timeout>();

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
  };

  useEffect(() => {
    if (isActive) {
      updateActivity(); // Initial activity update

      monitorIntervalRef.current = setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;

        // Warn after 45 seconds of inactivity
        if (timeSinceLastActivity > 45000 && timeSinceLastActivity < 50000) {
          toast.warning(
            "Connection may be unstable due to inactivity. Please check your internet or interact with the page."
          );
        }

        // Disconnect after 60 seconds of inactivity
        if (timeSinceLastActivity > 60000) {
          toast.error(
            "Connection lost due to prolonged inactivity. Please try again."
          );
          onDisconnect();
        }
      }, 5000);

      // Listen for user interaction
      window.addEventListener("mousemove", updateActivity);
      window.addEventListener("keypress", updateActivity);
      window.addEventListener("click", updateActivity);

      // Listen for VAPI speech events as activity indicators
      vapi.on("speech-start", updateActivity);
      vapi.on("speech-end", updateActivity);

      return () => {
        clearInterval(monitorIntervalRef.current);
        window.removeEventListener("mousemove", updateActivity);
        window.removeEventListener("keypress", updateActivity);
        window.removeEventListener("click", updateActivity);
        vapi.off("speech-start", updateActivity);
        vapi.off("speech-end", updateActivity);
      };
    }
  }, [isActive, onDisconnect]);

  return { updateActivity };
}
