import { Button, Header, Selection } from "@/components";
import { UseSettingsReturn } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { CheckCircleIcon, AlertCircleIcon } from "lucide-react";

export const VoskConfig = ({
  selectedSttProvider,
  onSetSelectedSttProvider,
}: UseSettingsReturn) => {
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const models = await invoke<string[]>("get_available_vosk_models");
      setAvailableModels(models);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load models");
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentModel = () => {
    return selectedSttProvider?.variables?.MODEL || "vosk-model-small-pt-0.3";
  };

  const isVoskSelected = selectedSttProvider?.provider === "vosk-stt";

  if (!isVoskSelected) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Header
        title="VOSK Configuration"
        description="Configure your local VOSK speech recognition model. VOSK runs entirely on your device for maximum privacy."
      />

      <div className="space-y-2">
        <Header
          title="Available Models"
          description="Select the VOSK model to use for speech recognition. The Portuguese model is recommended for Portuguese speech."
        />
        
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Loading available models...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircleIcon className="h-4 w-4" />
            {error}
          </div>
        ) : (
          <Selection
            selected={getCurrentModel()}
            options={availableModels.map((model) => ({
              label: model,
              value: model,
            }))}
            placeholder="Select VOSK model"
            onChange={(value) => {
              if (!selectedSttProvider) return;
              
              onSetSelectedSttProvider({
                ...selectedSttProvider,
                variables: {
                  ...selectedSttProvider.variables,
                  MODEL: value,
                },
              });
            }}
          />
        )}

        <div className="flex gap-2">
          <Button
            onClick={loadAvailableModels}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            Refresh Models
          </Button>
          <Button
            onClick={async () => {
              console.log("🧪 VOSK: Testing VOSK integration...");
              try {
                const models = await invoke<string[]>("get_available_vosk_models");
                console.log("🧪 VOSK: Available models:", models);
                alert(`VOSK Test: Found ${models.length} models: ${models.join(", ")}`);
              } catch (error) {
                console.error("🧪 VOSK: Test failed:", error);
                alert(`VOSK Test failed: ${error}`);
              }
            }}
            variant="default"
            size="sm"
          >
            Test Models
          </Button>
          <Button
            onClick={async () => {
              console.log("🧪 VOSK: Testing transcription...");
              try {
                // Create a dummy audio blob for testing
                new Blob(["dummy audio data"], { type: "audio/wav" });
                const response = await invoke<{
                  success: boolean;
                  transcription?: string;
                  error?: string;
                }>("transcribe_audio_with_vosk", {
                  audioBase64: btoa("dummy audio data"),
                  modelName: "vosk-model-small-pt-0.3",
                });
                console.log("🧪 VOSK: Transcription test result:", response);
                alert(`VOSK Transcription Test: ${response.success ? "SUCCESS" : "FAILED"}\nResult: ${response.transcription || response.error}`);
              } catch (error) {
                console.error("🧪 VOSK: Transcription test failed:", error);
                alert(`VOSK Transcription Test failed: ${error}`);
              }
            }}
            variant="secondary"
            size="sm"
          >
            Test Transcription
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Header
          title="Model Information"
          description="Current model details and recommendations"
        />
        
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Privacy First</span>
          </div>
          <p className="text-xs text-muted-foreground">
            All speech recognition happens locally on your device. No audio data is sent to external servers.
          </p>
          
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Offline Capable</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Works without internet connection once the model is downloaded.
          </p>
          
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Portuguese Support</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Optimized for Portuguese speech recognition with high accuracy.
          </p>
        </div>
      </div>

      {availableModels.length === 0 && !isLoading && !error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircleIcon className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">No Models Found</span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            No VOSK models were found in the models directory. Please ensure the model files are properly extracted.
          </p>
        </div>
      )}
    </div>
  );
};
