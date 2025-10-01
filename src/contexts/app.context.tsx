import {
  AI_PROVIDERS,
  DEFAULT_SYSTEM_PROMPT,
  SPEECH_TO_TEXT_PROVIDERS,
  STORAGE_KEYS,
  DEFAULT_SUPABASE_API_KEY,
  CONVERSATION_BUFFER_DEFAULTS,
} from "@/config";
import { forceSupabaseConfig, verifySupabaseConfig } from "@/lib/functions/force-supabase-config";
import { safeLocalStorage } from "@/lib";
import {
  getCustomizableState,
  updateAppIconVisibility,
  updateAlwaysOnTop,
  updateTitlesVisibility,
  CustomizableState,
} from "@/lib/storage";
import { IContextType, ScreenshotConfig, ConversationBufferConfig, TYPE_PROVIDER } from "@/types";
import curl2Json from "@bany/curl-to-json";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const validateAndProcessCurlProviders = (
  providersJson: string,
  providerType: "AI" | "STT"
): TYPE_PROVIDER[] => {
  try {
    const parsed = JSON.parse(providersJson);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((p) => {
        try {
          curl2Json(p.curl);
          return true;
        } catch (e) {
          return false;
        }

        return true;
      })
      .map((p) => {
        const provider = { ...p, isCustom: true };
        if (providerType === "STT" && provider.curl) {
          provider.curl = provider.curl.replace(/AUDIO_BASE64/g, "AUDIO");
        }
        return provider;
      });
  } catch (e) {
    console.warn(`Failed to parse custom ${providerType} providers`, e);
    return [];
  }
};

// Create the context
const AppContext = createContext<IContextType | undefined>(undefined);

// Create the provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [systemPrompt, setSystemPrompt] = useState<string>(
    safeLocalStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT) ||
      DEFAULT_SYSTEM_PROMPT
  );

  // AI Providers
  const [customAiProviders, setCustomAiProviders] = useState<TYPE_PROVIDER[]>(
    []
  );
  const [selectedAIProvider, setSelectedAIProvider] = useState<{
    provider: string;
    variables: Record<string, string>;
  }>({
    provider: "supervision",
    variables: {},
  });

  // STT Providers
  const [customSttProviders, setCustomSttProviders] = useState<TYPE_PROVIDER[]>(
    []
  );
  const [selectedSttProvider, setSelectedSttProvider] = useState<{
    provider: string;
    variables: Record<string, string>;
  }>({
    provider: "",
    variables: {},
  });

  const [screenshotConfiguration, setScreenshotConfiguration] =
    useState<ScreenshotConfig>({
      mode: "manual",
      autoPrompt: "Analyze this screenshot and provide insights",
      enabled: true,
    });

  const [conversationBufferConfig, setConversationBufferConfig] =
    useState<ConversationBufferConfig>({
      messageCount: CONVERSATION_BUFFER_DEFAULTS.MESSAGE_COUNT,
      minTextLength: CONVERSATION_BUFFER_DEFAULTS.MIN_TEXT_LENGTH,
    });

  // Unified Customizable State
  const [customizable, setCustomizable] = useState<CustomizableState>({
    appIcon: { isVisible: true },
    alwaysOnTop: { isEnabled: true },
    titles: { isEnabled: true },
  });

  // CoterapIA API State
  const [coterapiaApiEnabled, setCoterapiaApiEnabledState] = useState<boolean>(
    safeLocalStorage.getItem(STORAGE_KEYS.COTERAPIA_API_ENABLED) === "true"
  );

  // Function to load AI, STT, system prompt and screenshot config data from storage
  const loadData = () => {
    // Load system prompt
    const savedSystemPrompt = safeLocalStorage.getItem(
      STORAGE_KEYS.SYSTEM_PROMPT
    );
    if (savedSystemPrompt) {
      setSystemPrompt(savedSystemPrompt || DEFAULT_SYSTEM_PROMPT);
    }

    // Load screenshot configuration
    const savedScreenshotConfig = safeLocalStorage.getItem(
      STORAGE_KEYS.SCREENSHOT_CONFIG
    );
    if (savedScreenshotConfig) {
      try {
        const parsed = JSON.parse(savedScreenshotConfig);
        if (typeof parsed === "object" && parsed !== null) {
          setScreenshotConfiguration({
            mode: parsed.mode || "manual",
            autoPrompt:
              parsed.autoPrompt ||
              "Analyze this screenshot and provide insights",
            enabled: parsed.enabled !== undefined ? parsed.enabled : true,
          });
        }
      } catch {
        console.warn("Failed to parse screenshot configuration");
      }
    }

    // Load conversation buffer configuration
    const savedBufferConfig = safeLocalStorage.getItem(
      STORAGE_KEYS.CONVERSATION_BUFFER_CONFIG
    );
    if (savedBufferConfig) {
      try {
        const parsed = JSON.parse(savedBufferConfig);
        if (typeof parsed === "object" && parsed !== null) {
          // Validate and clamp messageCount between min and max
          const messageCount = Math.max(
            CONVERSATION_BUFFER_DEFAULTS.MIN_MESSAGE_COUNT,
            Math.min(
              CONVERSATION_BUFFER_DEFAULTS.MAX_MESSAGE_COUNT,
              parsed.messageCount || CONVERSATION_BUFFER_DEFAULTS.MESSAGE_COUNT
            )
          );
          
          setConversationBufferConfig({
            messageCount,
            minTextLength: parsed.minTextLength || CONVERSATION_BUFFER_DEFAULTS.MIN_TEXT_LENGTH,
          });
        }
      } catch {
        console.warn("Failed to parse conversation buffer configuration");
      }
    }

    // Custom AI providers disabled - only supervision provider is available
    setCustomAiProviders([]);

    // Load custom STT providers
    const savedStt = safeLocalStorage.getItem(
      STORAGE_KEYS.CUSTOM_SPEECH_PROVIDERS
    );
    let sttList: TYPE_PROVIDER[] = [];
    if (savedStt) {
      sttList = validateAndProcessCurlProviders(savedStt, "STT");
    }
    setCustomSttProviders(sttList);

    // Load selected AI provider
    const savedSelectedAi = safeLocalStorage.getItem(
      STORAGE_KEYS.SELECTED_AI_PROVIDER
    );
    
    if (savedSelectedAi) {
      try {
        const parsedConfig = JSON.parse(savedSelectedAi);
        setSelectedAIProvider(parsedConfig);
        
        // Verificar se a configuração está correta
        if (!verifySupabaseConfig()) {
          console.log("⚠️ Configuração incorreta detectada, forçando reconfiguração...");
          forceSupabaseConfig();
          setSelectedAIProvider({
            provider: "supervision",
            variables: {
              api_key: DEFAULT_SUPABASE_API_KEY,
            },
          });
        }
      } catch (error) {
        console.error("❌ Erro ao parsear configuração salva:", error);
        forceSupabaseConfig();
        setSelectedAIProvider({
          provider: "supervision",
          variables: {
            api_key: DEFAULT_SUPABASE_API_KEY,
          },
        });
      }
    } else {
      // Set supervision as default provider with default Supabase API key
      forceSupabaseConfig();
      setSelectedAIProvider({
        provider: "supervision",
        variables: {
          api_key: DEFAULT_SUPABASE_API_KEY,
        },
      });
      console.log("🔧 App Context: Set supervision as default provider with default API key");
    }

    // Load selected STT provider
    const savedSelectedStt = safeLocalStorage.getItem(
      STORAGE_KEYS.SELECTED_STT_PROVIDER
    );
    if (savedSelectedStt) {
      setSelectedSttProvider(JSON.parse(savedSelectedStt));
    }

    // Load customizable state
    const customizableState = getCustomizableState();
    setCustomizable(customizableState);

    // Load CoterapIA API enabled state
    const savedCoterapiaApiEnabled = safeLocalStorage.getItem(
      STORAGE_KEYS.COTERAPIA_API_ENABLED
    );
    if (savedCoterapiaApiEnabled !== null) {
      setCoterapiaApiEnabledState(savedCoterapiaApiEnabled === "true");
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Handle customizable settings on state changes
  useEffect(() => {
    const applyCustomizableSettings = async () => {
      try {
        await Promise.all([
          invoke("set_app_icon_visibility", {
            visible: customizable.appIcon.isVisible,
          }),
          invoke("set_always_on_top", {
            enabled: customizable.alwaysOnTop.isEnabled,
          }),
        ]);
      } catch (error) {
        console.error("Failed to apply customizable settings:", error);
      }
    };

    applyCustomizableSettings();
  }, [customizable]);

  // Listen for app icon hide/show events when window is toggled
  useEffect(() => {
    const handleAppIconVisibility = async (isVisible: boolean) => {
      try {
        await invoke("set_app_icon_visibility", { visible: isVisible });
      } catch (error) {
        console.error("Failed to set app icon visibility:", error);
      }
    };

    const unlistenHide = listen("handle-app-icon-on-hide", async () => {
      const currentState = getCustomizableState();
      // Only hide app icon if user has set it to hide mode
      if (!currentState.appIcon.isVisible) {
        await handleAppIconVisibility(false);
      }
    });

    const unlistenShow = listen("handle-app-icon-on-show", async () => {
      // Always show app icon when window is shown, regardless of user setting
      await handleAppIconVisibility(true);
    });

    return () => {
      unlistenHide.then((fn) => fn());
      unlistenShow.then((fn) => fn());
    };
  }, []);

  // Listen to storage events for real-time sync (e.g., multi-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === STORAGE_KEYS.CUSTOM_AI_PROVIDERS ||
        e.key === STORAGE_KEYS.SELECTED_AI_PROVIDER ||
        e.key === STORAGE_KEYS.CUSTOM_SPEECH_PROVIDERS ||
        e.key === STORAGE_KEYS.SELECTED_STT_PROVIDER ||
        e.key === STORAGE_KEYS.SYSTEM_PROMPT ||
        e.key === STORAGE_KEYS.SCREENSHOT_CONFIG ||
        e.key === STORAGE_KEYS.CONVERSATION_BUFFER_CONFIG ||
        e.key === STORAGE_KEYS.CUSTOMIZABLE
      ) {
        loadData();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Sync selected AI to localStorage
  useEffect(() => {
    if (selectedAIProvider.provider) {
      safeLocalStorage.setItem(
        STORAGE_KEYS.SELECTED_AI_PROVIDER,
        JSON.stringify(selectedAIProvider)
      );
    }
  }, [selectedAIProvider]);

  // Sync selected STT to localStorage
  useEffect(() => {
    if (selectedSttProvider.provider) {
      safeLocalStorage.setItem(
        STORAGE_KEYS.SELECTED_STT_PROVIDER,
        JSON.stringify(selectedSttProvider)
      );
    }
  }, [selectedSttProvider]);

  // Sync conversation buffer config to localStorage
  useEffect(() => {
    safeLocalStorage.setItem(
      STORAGE_KEYS.CONVERSATION_BUFFER_CONFIG,
      JSON.stringify(conversationBufferConfig)
    );
  }, [conversationBufferConfig]);

  // Computed all AI providers
  const allAiProviders: TYPE_PROVIDER[] = [
    ...AI_PROVIDERS,
    ...customAiProviders,
  ];

  // Computed all STT providers
  const allSttProviders: TYPE_PROVIDER[] = [
    ...SPEECH_TO_TEXT_PROVIDERS,
    ...customSttProviders,
  ];

  const onSetSelectedAIProvider = ({
    provider,
    variables,
  }: {
    provider: string;
    variables: Record<string, string>;
  }) => {
    if (provider && !allAiProviders.some((p) => p.id === provider)) {
      console.warn(`Invalid AI provider ID: ${provider}`);
      return;
    }

    setSelectedAIProvider((prev) => ({
      ...prev,
      provider,
      variables,
    }));
  };

  // Setter for selected STT with validation
  const onSetSelectedSttProvider = ({
    provider,
    variables,
  }: {
    provider: string;
    variables: Record<string, string>;
  }) => {
    if (provider && !allSttProviders.some((p) => p.id === provider)) {
      console.warn(`Invalid STT provider ID: ${provider}`);
      return;
    }

    setSelectedSttProvider((prev) => ({ ...prev, provider, variables }));
  };

  // Toggle handlers
  const toggleAppIconVisibility = async (isVisible: boolean) => {
    const newState = updateAppIconVisibility(isVisible);
    setCustomizable(newState);
    try {
      await invoke("set_app_icon_visibility", { visible: isVisible });
      loadData();
    } catch (error) {
      console.error("Failed to toggle app icon visibility:", error);
    }
  };

  const toggleAlwaysOnTop = async (isEnabled: boolean) => {
    const newState = updateAlwaysOnTop(isEnabled);
    setCustomizable(newState);
    try {
      await invoke("set_always_on_top", { enabled: isEnabled });
      loadData();
    } catch (error) {
      console.error("Failed to toggle always on top:", error);
    }
  };

  const toggleTitlesVisibility = (isEnabled: boolean) => {
    const newState = updateTitlesVisibility(isEnabled);
    setCustomizable(newState);
    loadData();
  };

  const setCoterapiaApiEnabled = (enabled: boolean) => {
    setCoterapiaApiEnabledState(enabled);
    safeLocalStorage.setItem(STORAGE_KEYS.COTERAPIA_API_ENABLED, String(enabled));
    loadData();
  };

  // Create the context value (extend IContextType accordingly)
  const value: IContextType = {
    systemPrompt,
    setSystemPrompt,
    allAiProviders,
    customAiProviders,
    selectedAIProvider,
    onSetSelectedAIProvider,
    allSttProviders,
    customSttProviders,
    selectedSttProvider,
    onSetSelectedSttProvider,
    screenshotConfiguration,
    setScreenshotConfiguration,
    conversationBufferConfig,
    setConversationBufferConfig,
    customizable,
    toggleAppIconVisibility,
    toggleAlwaysOnTop,
    toggleTitlesVisibility,
    loadData,
    coterapiaApiEnabled,
    setCoterapiaApiEnabled,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Create a hook to access the context
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within a AppProvider");
  }

  return context;
};
