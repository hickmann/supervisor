import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { floatArrayToWav } from "@/lib/utils";
import { voskLocal } from "@/lib/vosk-local";

interface VadOnlyProps {
  submit: UseCompletionReturn["submit"];
  setState: UseCompletionReturn["setState"];
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
}

export const VadOnly = ({
  submit,
  setState,
  setEnableVAD,
}: VadOnlyProps) => {
  const [, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voskReady, setVoskReady] = useState(false);

  // Initialize Vosk on component mount
  useEffect(() => {
    const initializeVosk = async () => {
      try {
        await voskLocal.initialize();
        setVoskReady(true);
        console.log("Vosk local ready for VAD-only mode");
      } catch (error) {
        console.error("Failed to initialize Vosk:", error);
        setState((prev: any) => ({
          ...prev,
          error: "Failed to initialize local speech recognition.",
        }));
      }
    };

    initializeVosk();
  }, [setState]);

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: false, // Don't start automatically
    onSpeechStart: () => {
      console.log("Speech detected - VAD activated");
      setState((prev: any) => ({ ...prev, error: "" }));
    },
    onSpeechEnd: async (audio) => {
      if (!voskReady) {
        console.warn("Vosk not ready yet");
        setState((prev: any) => ({
          ...prev,
          error: "Speech recognition not ready. Please wait...",
        }));
        return;
      }

      try {
        setIsTranscribing(true);
        console.log("End of speech detected - VAD", audio.length, "samples");

        // Convert float32array to WAV blob
        const audioBlob = floatArrayToWav(audio, 16000, "wav");

        // Transcribe using Vosk local
        const transcription = await voskLocal.transcribe(audioBlob);

        if (transcription && transcription.trim()) {
          console.log("Vosk transcription (VAD-only):", transcription);
          submit(transcription);
        } else {
          console.warn("Empty transcription result in VAD-only mode");
          setState((prev: any) => ({
            ...prev,
            error: "No speech detected. Please try speaking more clearly.",
          }));
        }
      } catch (error) {
        console.error("Failed to transcribe audio in VAD-only mode:", error);
        setState((prev: any) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Transcription failed",
        }));
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  const handleToggleVAD = () => {
    if (!voskReady) {
      console.warn("Vosk not ready yet");
      return;
    }

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
    if (!voskReady) {
      return <LoaderCircleIcon className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (isTranscribing) {
      return <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />;
    }
    if (vad.userSpeaking) {
      return <LoaderCircleIcon className="h-4 w-4 animate-spin text-orange-500" />;
    }
    if (vad.listening) {
      return <MicOffIcon className="h-4 w-4 animate-pulse text-red-500" />;
    }
    return <MicIcon className="h-4 w-4" />;
  };

  const getButtonTitle = () => {
    if (!voskReady) {
      return "Initializing speech recognition...";
    }
    if (isTranscribing) {
      return "Processing speech...";
    }
    if (vad.userSpeaking) {
      return "Detecting speech...";
    }
    if (vad.listening) {
      return "Stop voice detection (VAD)";
    }
    return "Start voice detection (VAD)";
  };

  return (
    <>
      <Button
        size="icon"
        onClick={handleToggleVAD}
        className="cursor-pointer"
        disabled={!voskReady}
        title={getButtonTitle()}
      >
        {getButtonIcon()}
      </Button>
    </>
  );
};
