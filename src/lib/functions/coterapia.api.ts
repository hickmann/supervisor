import { invoke } from "@tauri-apps/api/core";
import { safeLocalStorage } from "../storage";
import { STORAGE_KEYS } from "@/config";

// Helper function to check if CoterapIA API should be used
export async function shouldUseCoterapiaAPI(): Promise<boolean> {
  try {
    // Check if CoterapIA API is enabled in localStorage
    const coterapiaApiEnabled =
      safeLocalStorage.getItem(STORAGE_KEYS.COTERAPIA_API_ENABLED) === "true";
    if (!coterapiaApiEnabled) return false;

    // Check if license is available
    const hasLicense = await invoke<boolean>("check_license_status");
    return hasLicense;
  } catch (error) {
    console.warn("Failed to check CoterapIA API availability:", error);
    return false;
  }
}
