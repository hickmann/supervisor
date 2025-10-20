// Storage keys
export const STORAGE_KEYS = {
  THEME: "theme",
  CHAT_HISTORY: "chat_history",
  SYSTEM_PROMPT: "system_prompt",
  SCREENSHOT_CONFIG: "screenshot_config",
  // add curl_ prefix because we are using curl to store the providers
  CUSTOM_AI_PROVIDERS: "curl_custom_ai_providers",
  CUSTOM_SPEECH_PROVIDERS: "curl_custom_speech_providers",
  SELECTED_AI_PROVIDER: "curl_selected_ai_provider",
  SELECTED_STT_PROVIDER: "curl_selected_stt_provider",
  SYSTEM_AUDIO_CONTEXT: "system_audio_context",
  SYSTEM_AUDIO_QUICK_ACTIONS: "system_audio_quick_actions",
  CUSTOMIZABLE: "customizable",
  COTERAPIA_API_ENABLED: "coterapia_api_enabled",
  CONVERSATION_BUFFER_CONFIG: "conversation_buffer_config",
} as const;

// Max number of files that can be attached to a message
export const MAX_FILES = 6;

// Default settings
export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful AI assistant. Be concise, accurate, and friendly in your responses";

export const DEFAULT_QUICK_ACTIONS = [
  "Recapitular Sessão Completa",
  "Tarefas e Combinados",
];

// Conversation buffer configuration
export const CONVERSATION_BUFFER_DEFAULTS = {
  MESSAGE_COUNT: 6,
  MIN_MESSAGE_COUNT: 4,
  MAX_MESSAGE_COUNT: 15,
  MIN_TEXT_LENGTH: 80,
  AUTO_SEND_ENABLED: false, // Padrão: desligado
} as const;
