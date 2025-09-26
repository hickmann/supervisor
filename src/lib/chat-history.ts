import { safeLocalStorage } from "./storage/helper";
import { STORAGE_KEYS } from "@/config";
import { ChatConversation } from "@/types/completion";

export function loadChatHistory(): ChatConversation[] {
  try {
    const existingData = safeLocalStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (!existingData) return [];

    const conversations: ChatConversation[] = JSON.parse(existingData);
    return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return [];
  }
}

export function saveConversation(conversation: ChatConversation): void {
  try {
    if (!conversation.id || !conversation.updatedAt) {
      return;
    }

    const existingData = safeLocalStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    let conversations: ChatConversation[] = [];

    if (existingData) {
      conversations = JSON.parse(existingData);
    }

    const existingIndex = conversations.findIndex(
      (c) => c.id === conversation.id
    );
    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation;
    } else {
      conversations.push(conversation);
    }

    safeLocalStorage.setItem(
      STORAGE_KEYS.CHAT_HISTORY,
      JSON.stringify(conversations)
    );
  } catch (error) {
    console.error("Failed to save conversation:", error);
  }
}

export function getConversation(id: string): ChatConversation | null {
  try {
    const existingData = safeLocalStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (!existingData) return null;

    const conversations: ChatConversation[] = JSON.parse(existingData);
    return conversations.find((c) => c.id === id) || null;
  } catch (error) {
    console.error("Failed to get conversation:", error);
    return null;
  }
}

export function deleteConversation(conversationId: string): boolean {
  try {
    const existingData = safeLocalStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    if (!existingData) return false;

    const conversations: ChatConversation[] = JSON.parse(existingData);
    const filteredConversations = conversations.filter(
      (c) => c.id !== conversationId
    );

    if (filteredConversations.length === conversations.length) {
      return false; // Conversation not found
    }

    safeLocalStorage.setItem(
      STORAGE_KEYS.CHAT_HISTORY,
      JSON.stringify(filteredConversations)
    );
    return true;
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return false;
  }
}

export function generateConversationTitle(userMessage: string, timestamp?: number): string {
  const words = userMessage.trim().split(" ").slice(0, 6);
  const messageTitle = words.join(" ") + (words.length < userMessage.trim().split(" ").length ? "..." : "");
  
  if (timestamp) {
    const date = new Date(timestamp);
    const startTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = date.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
    return `Sessão ${dateStr} ${startTime}`;
  }
  
  return messageTitle;
}
