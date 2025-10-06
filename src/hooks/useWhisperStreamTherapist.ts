// Hook para consumir eventos de transcrição streaming do terapeuta
// Usa whisper_stream para transcrição contínua e salva somente quando is_final === true

import { useEffect, useState, useCallback, useRef } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export interface WhisperSegmentEvent {
  text: string;
  start: number;
  end: number;
  is_final: boolean;
}

export interface UseWhisperStreamTherapistReturn {
  isActive: boolean;
  liveText: string;
  startStream: () => Promise<void>;
  stopStream: () => Promise<void>;
  error: string | null;
}

export function useWhisperStreamTherapist(
  onFinalSegment: (segment: WhisperSegmentEvent) => Promise<void>
): UseWhisperStreamTherapistReturn {
  console.log("🚀 useWhisperStreamTherapist: Hook initialized!");
  
  const [isActive, setIsActive] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Configurar listener para eventos whisper:segment
  useEffect(() => {
    let mounted = true;

    const setupListener = async () => {
      try {
        const unlisten = await listen<WhisperSegmentEvent>(
          "whisper:segment",
          async (event) => {
            if (!mounted) return;

            const segment = event.payload;
            console.log("📝 THERAPIST STREAM: Segment received:", {
              text: segment.text.substring(0, 50) + "...",
              start: segment.start,
              end: segment.end,
              is_final: segment.is_final,
            });
            console.log("📝 THERAPIST STREAM: Full text:", segment.text);

            if (segment.is_final) {
              // Segmento final - persistir no histórico
              console.log("✅ THERAPIST STREAM: Final segment - persisting to history");
              console.log("✅ THERAPIST STREAM: Calling onFinalSegment callback");
              
              try {
                await onFinalSegment(segment);
                setLiveText(""); // Limpar texto parcial
                console.log("✅ THERAPIST STREAM: onFinalSegment completed successfully");
              } catch (err) {
                console.error("❌ THERAPIST STREAM: Failed to persist segment:", err);
                setError(err instanceof Error ? err.message : "Failed to persist segment");
              }
            } else {
              // Segmento parcial - apenas atualizar UI
              console.log("🔄 THERAPIST STREAM: Partial segment - updating UI only");
              setLiveText(segment.text);
            }
          }
        );

        unlistenRef.current = unlisten;
        console.log("✅ THERAPIST STREAM: Event listener setup complete");
      } catch (err) {
        console.error("❌ THERAPIST STREAM: Failed to setup listener:", err);
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to setup listener");
        }
      }
    };

    setupListener();

    return () => {
      mounted = false;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, [onFinalSegment]);

  const startStream = useCallback(async () => {
    try {
      console.log("🚀 THERAPIST STREAM: Starting whisper stream...");
      console.log("🚀 THERAPIST STREAM: Hook is being called!");
      setError(null);
      
      // Buscar índice do microfone salvo
      let micIndex = 0; // Padrão
      try {
        const saved = localStorage.getItem("therapist.micIndex");
        if (saved) {
          const parsedIndex = parseInt(saved, 10);
          if (!isNaN(parsedIndex)) {
            micIndex = parsedIndex;
            console.log("🚀 THERAPIST STREAM: Using saved microphone index:", micIndex);
          } else {
            console.log("🚀 THERAPIST STREAM: Invalid saved microphone index, using default 0");
          }
        } else {
          console.log("🚀 THERAPIST STREAM: No saved microphone, using default index 0");
        }
      } catch (err) {
        console.warn("⚠️ THERAPIST STREAM: Failed to load saved microphone, using default:", err);
      }
      
      console.log("🚀 THERAPIST STREAM: Calling Tauri command with micIndex:", micIndex);
      console.log("🚀 THERAPIST STREAM: About to call invoke('start_terapeuta_stream', { micIndex })");
      await invoke("start_terapeuta_stream", { micIndex });
      console.log("🚀 THERAPIST STREAM: Tauri command completed successfully");
      setIsActive(true);
      console.log("✅ THERAPIST STREAM: Stream started successfully with mic index:", micIndex);
    } catch (err) {
      console.error("❌ THERAPIST STREAM: Failed to start stream:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to start stream";
      setError(errorMsg);
      setIsActive(false);
      throw err;
    }
  }, []);

  const stopStream = useCallback(async () => {
    try {
      console.log("🛑 THERAPIST STREAM: Stopping whisper stream...");
      await invoke("stop_terapeuta_stream");
      setIsActive(false);
      setLiveText("");
      console.log("✅ THERAPIST STREAM: Stream stopped successfully");
    } catch (err) {
      console.error("❌ THERAPIST STREAM: Failed to stop stream:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to stop stream";
      setError(errorMsg);
      throw err;
    }
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (isActive) {
        invoke("stop_terapeuta_stream").catch(console.error);
      }
    };
  }, [isActive]);

  return {
    isActive,
    liveText,
    startStream,
    stopStream,
    error,
  };
}