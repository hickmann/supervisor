import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { floatArrayToWav } from "@/lib/utils";
import { useSystemAudio } from "@/hooks/useSystemAudio";
import { transcribeAudioWithHttp } from "@/lib/whisper-http-client";

interface AutoSpeechVADProps {
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const AutoSpeechVAD = ({
  setEnableVAD,
}: AutoSpeechVADProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const systemAudio = useSystemAudio();

  const vad = useMicVAD({
    // Configurações ajustadas para igualar os chunks do paciente
    // Paciente usa: SILENCE_CHUNKS: 45 (~1.7s), MIN_SPEECH_CHUNKS: 10 (~0.21s), PRE_SPEECH_CHUNKS: 25 (~0.53s)
    positiveSpeechThreshold: 0.8,          // Threshold para detectar fala (similar ao SPEECH_PEAK_THRESHOLD)
    negativeSpeechThreshold: 0.8 - 0.15,   // Threshold para detectar silêncio
    redemptionFrames: 45,                  // Frames de silêncio antes de finalizar (~1.7s como o paciente)
    preSpeechPadFrames: 25,                // Buffer pré-fala (~0.53s como o paciente)
    minSpeechFrames: 10,                   // Duração mínima de fala (~0.21s como o paciente)
    startOnLoad: false,
    onSpeechEnd: async (audio) => {
      try {
        console.log("🎤 VAD: Speech detected, starting transcription...");
        const audioBlob = floatArrayToWav(audio, 16000, "wav");
        console.log("🎤 VAD: Audio blob size:", audioBlob.size);

        setIsTranscribing(true);

        // Usar transcrição via HTTP (whisper_server) - MESMO MÉTODO QUE O PACIENTE
        console.log("🎤 VAD: Using whisper_server HTTP (same as patient)");
        const transcription = await transcribeAudioWithHttp(audioBlob);
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
