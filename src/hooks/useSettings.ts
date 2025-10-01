import { useEffect, useState } from "react";
import { useWindowResize } from "@/hooks";
import { useApp } from "@/contexts";
import { extractVariables, safeLocalStorage } from "@/lib";
import { STORAGE_KEYS } from "@/config";

export const useSettings = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { resizeWindow } = useWindowResize();
  
  const {
    systemPrompt,
    setSystemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
    conversationBufferConfig,
    setConversationBufferConfig,
    allAiProviders,
    allSttProviders,
    selectedAIProvider,
    selectedSttProvider,
    onSetSelectedAIProvider,
    onSetSelectedSttProvider,
  } = useApp();
  const [variables, setVariables] = useState<{ key: string; value: string }[]>(
    []
  );
  const [sttVariables, setSttVariables] = useState<
    {
      key: string;
      value: string;
    }[]
  >([]);

  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  useEffect(() => {
    resizeWindow(isPopoverOpen);
  }, [isPopoverOpen, resizeWindow]);

  const handleScreenshotModeChange = (value: "auto" | "manual") => {
    const newConfig = { ...screenshotConfiguration, mode: value };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const handleScreenshotPromptChange = (value: string) => {
    const newConfig = { ...screenshotConfiguration, autoPrompt: value };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const handleScreenshotEnabledChange = (enabled: boolean) => {
    const newConfig = { ...screenshotConfiguration, enabled };
    setScreenshotConfiguration(newConfig);
    safeLocalStorage.setItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG,
      JSON.stringify(newConfig)
    );
  };

  const handleConversationBufferMessageCountChange = (messageCount: number) => {
    const newConfig = { ...conversationBufferConfig, messageCount };
    setConversationBufferConfig(newConfig);
  };

  const handleConversationBufferMinTextLengthChange = (minTextLength: number) => {
    const newConfig = { ...conversationBufferConfig, minTextLength };
    setConversationBufferConfig(newConfig);
  };

  useEffect(() => {
    if (selectedAIProvider.provider) {
      const provider = allAiProviders.find(
        (p) => p.id === selectedAIProvider.provider
      );
      if (provider) {
        const variables = extractVariables(provider?.curl);
        console.log("🔧 Settings: Extracted variables for provider", selectedAIProvider.provider, ":", variables);
        setVariables(variables);
      }
    }
  }, [selectedAIProvider.provider, allAiProviders]);

  useEffect(() => {
    if (selectedSttProvider.provider) {
      const provider = allSttProviders.find(
        (p) => p.id === selectedSttProvider.provider
      );
      if (provider) {
        const variables = extractVariables(provider?.curl);
        setSttVariables(variables);
      }
    }
  }, [selectedSttProvider.provider]);

  const handleDeleteAllChatsConfirm = () => {
    safeLocalStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
    setShowDeleteConfirmDialog(false);
  };

  return {
    isPopoverOpen,
    setIsPopoverOpen,
    systemPrompt,
    setSystemPrompt,
    screenshotConfiguration,
    setScreenshotConfiguration,
    handleScreenshotModeChange,
    handleScreenshotPromptChange,
    handleScreenshotEnabledChange,
    conversationBufferConfig,
    setConversationBufferConfig,
    handleConversationBufferMessageCountChange,
    handleConversationBufferMinTextLengthChange,
    allAiProviders,
    allSttProviders,
    selectedAIProvider,
    selectedSttProvider,
    onSetSelectedAIProvider,
    onSetSelectedSttProvider,
    handleDeleteAllChatsConfirm,
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
    variables,
    sttVariables,
  };
};
