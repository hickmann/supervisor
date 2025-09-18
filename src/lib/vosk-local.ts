import { invoke } from '@tauri-apps/api/core';

export class VoskLocal {
    private static initialized = false;

    static async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await invoke('initialize_vosk_local');
            this.initialized = true;
            console.log('Vosk local initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Vosk local:', error);
            throw new Error(`Vosk initialization failed: ${error}`);
        }
    }

    static async transcribe(audioBlob: Blob): Promise<string> {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            // Convert blob to base64
            const audioBase64 = await this.blobToBase64(audioBlob);
            
            // Remove data URL prefix if present
            const base64Data = audioBase64.replace(/^data:audio\/[^;]+;base64,/, '');
            
            // Call Rust backend
            const transcription = await invoke('transcribe_audio_vosk', {
                audioBase64: base64Data
            }) as string;

            return transcription;
        } catch (error) {
            console.error('Transcription failed:', error);
            throw new Error(`Transcription failed: ${error}`);
        }
    }

    private static blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result);
            };
            reader.onerror = () => {
                reject(new Error('Failed to convert blob to base64'));
            };
            reader.readAsDataURL(blob);
        });
    }
}

// Export singleton instance
export const voskLocal = VoskLocal;
