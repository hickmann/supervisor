import {
  deepVariableReplacer,
  getByPath,
  blobToBase64,
} from "./common.function";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { invoke } from "@tauri-apps/api/core";

import { TYPE_PROVIDER } from "@/types";
import curl2Json from "@bany/curl-to-json";
import { shouldUsePluelyAPI } from "./pluely.api";

// Pluely STT function
export async function fetchPluelySTT(audio: File | Blob): Promise<string> {
  try {
    // Convert audio to base64
    const audioBase64 = await blobToBase64(audio);

    // Call Tauri command
    const response = await invoke<{
      success: boolean;
      transcription?: string;
      error?: string;
    }>("transcribe_audio", {
      audioBase64,
    });

    if (response.success && response.transcription) {
      return response.transcription;
    } else {
      return response.error || "Transcription failed";
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return `Pluely STT Error: ${errorMessage}`;
  }
}

// VOSK STT function
export async function fetchVoskSTT(audio: File | Blob, modelName?: string): Promise<string> {
  console.log("🎤 VOSK STT: Starting transcription...");
  console.log("📊 VOSK STT: Audio size:", audio.size, "bytes");
  console.log("🤖 VOSK STT: Model:", modelName || "vosk-model-small-pt-0.3");
  
  try {
    // Convert audio to base64
    console.log("🔄 VOSK STT: Converting audio to base64...");
    const audioBase64 = await blobToBase64(audio);
    console.log("✅ VOSK STT: Audio converted to base64, length:", audioBase64.length);

    // Call Tauri VOSK command
    console.log("📡 VOSK STT: Calling Tauri VOSK command...");
    const response = await invoke<{
      success: boolean;
      transcription?: string;
      error?: string;
    }>("transcribe_audio_with_vosk", {
      audioBase64,
      modelName: modelName || "vosk-model-small-pt-0.3",
    });

    console.log("📥 VOSK STT: Response received:", response);

            if (response.success && response.transcription) {
              console.log("✅ VOSK STT: Transcription successful!");
              console.log("📝 VOSK STT: TRANSCRIBED TEXT:", response.transcription);
              console.log("📝 VOSK STT: Text length:", response.transcription.length, "characters");
              console.log("📝 VOSK STT: Text preview:", response.transcription.substring(0, 100) + (response.transcription.length > 100 ? "..." : ""));
              return response.transcription;
            } else {
              console.warn("⚠️ VOSK STT: Transcription failed:", response.error);
              return response.error || "VOSK transcription failed";
            }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ VOSK STT: Error:", errorMessage);
    return `VOSK STT Error: ${errorMessage}`;
  }
}

export interface STTParams {
  provider: TYPE_PROVIDER | undefined;
  selectedProvider: {
    provider: string;
    variables: Record<string, string>;
  };
  audio: File | Blob;
}

/**
 * Transcribes audio and returns either the transcription or an error/warning message as a single string.
 */
export async function fetchSTT(params: STTParams): Promise<string> {
  let warnings: string[] = [];

  console.log("🚀 STT: fetchSTT called with params:", {
    providerId: params.provider?.id,
    selectedProvider: params.selectedProvider?.provider,
    audioSize: params.audio?.size
  });

  try {
    const { audio } = params;

    if (!audio) throw new Error("Audio file is required");

    // FORÇAR USO DO VOSK - SEMPRE USAR VOSK
    console.log("🎯 STT: FORCING VOSK usage - no other providers allowed");
    const modelName = "vosk-model-small-pt-0.3";
    return await fetchVoskSTT(audio, modelName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(msg);
  }
}
