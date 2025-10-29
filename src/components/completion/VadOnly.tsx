import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { fetchWhisperSTT } from "@/lib/functions/stt.function";
import { floatArrayToWav } from "@/lib/utils";
import { invoke } from "@tauri-apps/api/core";
import { safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";

// Helper function to log to backend
const logToBackend = async (level: "info" | "warn" | "error", message: string) => {
  try {
    await invoke("log_from_frontend", { level, message });
  } catch (error) {
    // Silently fail if logging fails
  }
};

interface VadOnlyProps {
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
  systemAudio?: any;
}

export const VadOnly = ({
  setEnableVAD,
  systemAudio,
}: VadOnlyProps) => {
  const [, setIsListening] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("default");
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  // Carregar dispositivo selecionado do storage
  useEffect(() => {
    const loadDeviceId = () => {
      const savedDeviceId = safeLocalStorage.getItem(STORAGE_KEYS.SELECTED_MICROPHONE_DEVICE_ID);
      if (savedDeviceId && savedDeviceId !== "default") {
        setSelectedDeviceId(savedDeviceId);
        console.log("🎤 VadOnly: Using selected microphone:", savedDeviceId);
      } else {
        setSelectedDeviceId("default"); // "default" = usar padrão do sistema
        console.log("🎤 VadOnly: Using default system microphone");
      }
    };

    loadDeviceId();

    // Escutar mudanças na seleção de microfone
    const handleStorageChange = () => {
      loadDeviceId();
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Custom event para mudanças no mesmo contexto
    window.addEventListener("microphoneDeviceChanged", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("microphoneDeviceChanged", handleStorageChange);
    };
  }, []);

  // Criar o stream de áudio quando o deviceId mudar
  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const createStream = async () => {
      // Fechar stream anterior se existir
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }

      try {
        let stream: MediaStream;
        if (selectedDeviceId && selectedDeviceId !== "default") {
          const constraints: MediaStreamConstraints = {
            audio: { deviceId: { exact: selectedDeviceId } },
          };
          console.log("🎤 VadOnly: Creating stream with deviceId:", selectedDeviceId);
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          console.log("🎤 VadOnly: Creating stream with default device");
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        currentStream = stream;
        setAudioStream(stream);
      } catch (error) {
        console.error("❌ VadOnly: Failed to create audio stream:", error);
        setAudioStream(null);
      }
    };

    createStream();

    // Cleanup quando componente desmontar ou deviceId mudar
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId]);

  const vadOptions: any = {
    userSpeakingThreshold: 0.6,
    startOnLoad: true, // Start automatically when component mounts
    onSpeechStart: () => {
      console.log("🎤 VadOnly: Speech detected - VAD activated");
    },
    onSpeechEnd: async (audio: Float32Array) => {
      console.log("🎤 VadOnly: Fim da fala detectado - VAD", audio.length, "samples");
      await logToBackend("info", `VadOnly: Speech detected - ${audio.length} samples`);
      console.log("🎤 VadOnly: Starting transcription process...");
      
      try {
        // Convert float32array to blob
        console.log("🎤 VadOnly: Converting audio to blob...");
        const audioBlob = floatArrayToWav(audio, 16000, "wav");
        console.log("🎤 VadOnly: Audio blob created, size:", audioBlob.size, "bytes");
        console.log("🎤 VadOnly: Audio blob type:", audioBlob.type);

        // Verificar systemAudio
        console.log("🎤 VadOnly: systemAudio available:", !!systemAudio);
        console.log("🎤 VadOnly: processMicrophoneTranscription available:", !!(systemAudio && systemAudio.processMicrophoneTranscription));

        // Usar transcrição simples do Whisper via Tauri
        console.log("🎯 VadOnly: Calling fetchWhisperSTT...");
        await logToBackend("info", `VadOnly: Calling fetchWhisperSTT with ${audioBlob.size} bytes`);
        const transcription = await fetchWhisperSTT(audioBlob);
        console.log("🎯 VadOnly: Transcription received:", transcription ? `"${transcription.substring(0, 50)}..."` : "null/empty");
        await logToBackend("info", `VadOnly: Transcription received - ${transcription ? transcription.length : 0} chars`);

        if (transcription && transcription.trim()) {
          console.log("✅ VadOnly: Valid transcription received!");
          console.log("🎯 VadOnly: Microphone transcription (TERAPEUTA):", transcription);
          console.log("🎯 VadOnly: Transcription length:", transcription.length, "characters");
          
          // SEMPRE usar o sistema de supervisão - Sistema 1 integrado com Sistema 2
          if (systemAudio && systemAudio.processMicrophoneTranscription) {
            console.log("🎯 VadOnly: Sending to psychological supervision system (Sistema 1 → Sistema 2)");
            await systemAudio.processMicrophoneTranscription(transcription);
            console.log("✅ VadOnly: Transcription sent to supervision system successfully");
          } else {
            console.error("❌ VadOnly: Sistema de supervisão não disponível!");
            console.error("   - systemAudio exists:", !!systemAudio);
            console.error("   - processMicrophoneTranscription exists:", !!(systemAudio && systemAudio.processMicrophoneTranscription));
            alert("Sistema de supervisão não disponível. Reinicie a aplicação.");
          }
        } else {
          console.warn("⚠️ VadOnly: Transcription is empty or invalid:", transcription);
        }
      } catch (error) {
        console.error("❌ VadOnly: Failed to transcribe audio:", error);
        console.error("❌ VadOnly: Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined,
        });
        alert(`Erro na transcrição: ${error instanceof Error ? error.message : "Transcription failed"}`);
      }
    },
  };

  // Adicionar stream apenas se estiver disponível
  if (audioStream) {
    vadOptions.stream = audioStream;
  }

  const vad = useMicVAD(vadOptions);
  const hasStartedRef = useRef(false);
  const lastDeviceIdRef = useRef<string | null>(null);

  // Auto-start VAD when component mounts or device changes (sem loop)
  useEffect(() => {
    if (!vad || !audioStream) {
      return; // Aguardar VAD e stream estarem prontos
    }
    
    // Verificar se o dispositivo mudou
    const deviceChanged = lastDeviceIdRef.current !== selectedDeviceId;
    
    if (deviceChanged) {
      console.log("🎤 VadOnly: Device changed from", lastDeviceIdRef.current, "to", selectedDeviceId);
      lastDeviceIdRef.current = selectedDeviceId;
      
      // Se o VAD está rodando, pausar e reiniciar
      if (vad.listening) {
        console.log("🔄 VadOnly: Restarting VAD due to device change...");
        vad.pause();
        setTimeout(() => {
          try {
            vad.start();
            console.log("✅ VadOnly: VAD restarted with new device");
          } catch (error) {
            console.error("❌ VadOnly: Failed to restart VAD:", error);
          }
        }, 100);
      }
      return;
    }
    
    // Iniciar apenas uma vez quando o componente monta
    if (!hasStartedRef.current && !vad.listening) {
      console.log("🎤 VadOnly: Auto-starting VAD on component mount");
      hasStartedRef.current = true;
      lastDeviceIdRef.current = selectedDeviceId;
      try {
        vad.start();
        setIsListening(true);
        console.log("✅ VadOnly: VAD started successfully");
      } catch (error) {
        console.error("❌ VadOnly: Failed to start VAD:", error);
        hasStartedRef.current = false; // Reset se falhar
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId, audioStream]); // Removido 'vad' das dependências para evitar loop - vad é estável

  const handleToggleVAD = () => {
    if (vad.listening) {
      vad.pause();
      setEnableVAD(false);
      setIsListening(false);
    } else {
      vad.start();
      setEnableVAD(true);
      setIsListening(true);
    }
  };

  const getButtonIcon = () => {
    if (vad.userSpeaking) {
      return <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />;
    }
    if (vad.listening) {
      return <MicOffIcon className="h-4 w-4 animate-pulse text-red-500" />;
    }
    return <MicIcon className="h-4 w-4" />;
  };

  const getButtonTitle = () => {
    if (vad.userSpeaking) {
      return "Detectando fala...";
    }
    if (vad.listening) {
      return "Parar detecção de voz (VAD)";
    }
    return "Iniciar detecção de voz (VAD)";
  };

  return (
    <>
      <Button
        size="icon"
        onClick={handleToggleVAD}
        className="cursor-pointer"
        title={getButtonTitle()}
      >
        {getButtonIcon()}
      </Button>
    </>
  );
};
