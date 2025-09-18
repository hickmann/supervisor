import { Dispatch, SetStateAction } from "react";
import { ScreenshotConfig, TYPE_PROVIDER } from "@/types";
import { CustomizableState } from "@/lib/storage";

export type IContextType = {
  systemPrompt: string;
  setSystemPrompt: Dispatch<SetStateAction<string>>;
  allAiProviders: TYPE_PROVIDER[];
  customAiProviders: TYPE_PROVIDER[];
  selectedAIProvider: {
    provider: string;
    variables: Record<string, string>;
  };
  onSetSelectedAIProvider: ({
    provider,
    variables,
  }: {
    provider: string;
    variables: Record<string, string>;
  }) => void;
  screenshotConfiguration: ScreenshotConfig;
  setScreenshotConfiguration: React.Dispatch<
    React.SetStateAction<ScreenshotConfig>
  >;
  customizable: CustomizableState;
  toggleAppIconVisibility: (isVisible: boolean) => Promise<void>;
  toggleAlwaysOnTop: (isEnabled: boolean) => Promise<void>;
  toggleTitlesVisibility: (isEnabled: boolean) => void;
  loadData: () => void;
  pluelyApiEnabled: boolean;
  setPluelyApiEnabled: (enabled: boolean) => void;
};
