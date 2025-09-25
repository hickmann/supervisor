import { AlertCircleIcon, LoaderIcon } from "lucide-react";

type Props = {
  setupRequired: boolean;
  error: string;
  isProcessing: boolean;
  isAIProcessing: boolean;
  capturing: boolean;
};

export const StatusIndicator = ({
  setupRequired,
  error,
  isProcessing,
  isAIProcessing,
  capturing,
}: Props) => {
  // Don't show anything if not capturing and no error
  if (!capturing && !error && !isProcessing && !isAIProcessing) {
    return null;
  }

  return (
    <div className="flex flex-1 items-center gap-2 px-3 py-2 justify-end">
      {/* Priority: Error > AI Processing > Transcribing > Listening */}
      {error && !setupRequired ? (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircleIcon className="w-4 h-4" />
          <span className="text-xs font-medium">{error}</span>
        </div>
      ) : isAIProcessing ? (
        <div className="flex items-center gap-2 animate-pulse">
          <LoaderIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Generating response...</span>
        </div>
      ) : isProcessing ? (
        <div className="flex items-center gap-2 animate-pulse">
          <LoaderIcon className="w-4 h-4 animate-spin" />
          <span className="text-xs font-medium">Transcribing...</span>
        </div>
      ) : capturing ? (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-green-600 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium">Listening...</span>
          </div>
          
          {/* Botões com estilo glassmorphism */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
              <span className="text-xs font-medium text-white">Perguntar pra IA</span>
              <div className="flex items-center gap-1">
                <div className="w-6 h-4 border border-white/40 rounded flex items-center justify-center">
                  <span className="text-[10px] text-white/80 font-mono leading-none">
                    {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
                  </span>
                </div>
                <div className="w-4 h-4 border border-white/40 rounded flex items-center justify-center">
                  <span className="text-[10px] text-white/80 font-mono leading-none">↵</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
