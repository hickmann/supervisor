import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { floatArrayToWav } from "@/lib/utils";
import { useSystemAudio } from "@/hooks/useSystemAudio";
import { getBestTranscriptionForTerapeuta } from "@/lib/functions/dual-transcription.function";

interface AutoSpeechVADProps {
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const AutoSpeechVAD = ({
  setEnableVAD,
}: AutoSpeechVADProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const systemAudio = useSystemAudio();

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: false,
    onSpeechEnd: async (audio) => {
      try {
        console.log("🎤 VAD: Speech detected, starting transcription...");
        const audioBlob = floatArrayToWav(audio, 16000, "wav");
        console.log("🎤 VAD: Audio blob size:", audioBlob.size);

        setIsTranscribing(true);

        // Usar transcrição via HTTP (whisper_server) com fallback - MESMO MÉTODO QUE O PACIENTE
        console.log("🎤 VAD: Using getBestTranscriptionForTerapeuta (HTTP + fallback)");
        const transcription = await getBestTranscriptionForTerapeuta(audioBlob);
        console.log("🎤 VAD: Transcription result:", transcription);

        if (transcription && transcription.trim()) {
          console.log("🎯 VAD: Microphone transcription (TERAPEUTA):", transcription);
          
          if (systemAudio && systemAudio.processMicrophoneTranscription) {
            console.log("🎯 VAD: Sending to supervision system");
            await systemAudio.processMicrophoneTranscription(transcription);
          } else {
            console.error("❌ VAD: Supervision system not available");
            alert("Sistema de supervisão não disponível. Reinicie a aplicação.");
          }
        } else {
          console.warn("⚠️ VAD: Empty transcription received");
        }
      } catch (error) {
        console.error("❌ VAD: Transcription failed:", error);
        alert(`Erro na transcrição: ${error instanceof Error ? error.message : "Transcription failed"}`);
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  return (
    <>
      <Button
        size="icon"
        onClick={() => {
          console.log("🎤 AutoSpeechVAD: Button clicked, current state - listening:", vad.listening);
          if (vad.listening) {
            console.log("🎤 AutoSpeechVAD: Pausing VAD");
            vad.pause();
            setEnableVAD(false);
          } else {
            console.log("🎤 AutoSpeechVAD: Starting VAD");
            vad.start();
            setEnableVAD(true);
          }
        }}
        className="cursor-pointer"
      >
        {isTranscribing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        ) : vad.userSpeaking ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : vad.listening ? (
          <MicOffIcon className="h-4 w-4 animate-pulse" />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};
