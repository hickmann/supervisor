use std::path::Path;
use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::State;
use tracing::{info, warn, error};
use vosk::{Model, Recognizer};

#[derive(Debug, Serialize, Deserialize)]
pub struct VoskTranscriptionResult {
    pub success: bool,
    pub transcription: Option<String>,
    pub error: Option<String>,
}

pub struct VoskState {
    pub models: Arc<Mutex<HashMap<String, Arc<Model>>>>,
}

impl VoskState {
    pub fn new() -> Self {
        Self {
            models: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn get_model(&self, model_name: &str) -> Result<Arc<Model>, String> {
        info!("🔍 VOSK: Requesting model: {}", model_name);
        let mut models = self.models.lock().unwrap();

        if let Some(model) = models.get(model_name) {
            info!("✅ VOSK: Model {} found in cache", model_name);
            Ok(model.clone())
        } else {
            info!("📥 VOSK: Loading model {} from disk", model_name);
            let model_path = format!("models/{}", model_name);
            
            // Debug: list directory contents
            info!("🔍 VOSK: Checking directory: models/");
            if let Ok(entries) = std::fs::read_dir("models") {
                for entry in entries {
                    if let Ok(entry) = entry {
                        if let Some(name) = entry.file_name().to_str() {
                            info!("📁 VOSK: Found in models/: {}", name);
                        }
                    }
                }
            }
            
            info!("🔍 VOSK: Looking for model at path: {}", model_path);
            if !Path::new(&model_path).exists() {
                error!("❌ VOSK: Model not found at path: {}", model_path);
                return Err(format!("Model not found at path: {}", model_path));
            }

            let model = Model::new(&model_path)
                .ok_or_else(|| {
                    error!("❌ VOSK: Failed to load model");
                    "Failed to load VOSK model".to_string()
                })?;

            info!("✅ VOSK: Model {} loaded successfully", model_name);
            let model_arc = Arc::new(model);
            models.insert(model_name.to_string(), model_arc.clone());
            Ok(model_arc)
        }
    }
}

#[tauri::command]
pub async fn transcribe_audio_with_vosk(
    state: State<'_, VoskState>,
    audio_base64: String,
    model_name: Option<String>,
) -> Result<VoskTranscriptionResult, String> {
    let model_name = model_name.unwrap_or_else(|| "vosk-model-small-pt-0.3".to_string());

    // Force print to console for debugging
    println!("🎤 VOSK: Starting transcription with model: {}", model_name);
    eprintln!("🎤 VOSK: Starting transcription with model: {}", model_name);
    info!("🎤 VOSK: Starting transcription with model: {}", model_name);
    info!("📊 VOSK: Audio data length: {} characters", audio_base64.len());

    // Get the model
    let model = state.get_model(&model_name)?;

    // Decode base64 audio
    info!("🔓 VOSK: Decoding base64 audio...");
    let audio_data = base64::engine::general_purpose::STANDARD
        .decode(&audio_base64)
        .map_err(|e| {
            error!("❌ VOSK: Failed to decode base64 audio: {}", e);
            format!("Failed to decode base64 audio: {}", e)
        })?;

    info!("✅ VOSK: Audio decoded successfully, size: {} bytes", audio_data.len());

    // Convert Vec<u8> to Vec<i16> (assuming 16-bit PCM audio)
    info!("🔄 VOSK: Converting audio to 16-bit PCM samples...");
    let audio_samples: Vec<i16> = audio_data
        .chunks_exact(2)
        .map(|chunk| i16::from_le_bytes([chunk[0], chunk[1]]))
        .collect();

    info!("✅ VOSK: Audio converted to {} samples", audio_samples.len());

    // Create recognizer
    info!("🤖 VOSK: Creating recognizer...");
    let mut recognizer = Recognizer::new(&model, 16000.0)
        .ok_or_else(|| {
            error!("❌ VOSK: Failed to create recognizer");
            "Failed to create VOSK recognizer".to_string()
        })?;

    info!("✅ VOSK: Recognizer created successfully");

    // Process audio data
    info!("🎯 VOSK: Processing audio with recognizer...");
    let result = recognizer.accept_waveform(&audio_samples);
    
    match result {
        Ok(_) => {
            info!("✅ VOSK: Audio processing completed successfully");
            
            // Get final result
            let final_result = recognizer.final_result();
            info!("📝 VOSK: Final result: {:?}", final_result);
            
            // Extract text from CompleteResult
            let transcription = match final_result {
                vosk::CompleteResult::Single(single) => {
                    let text = single.text;
                    if !text.is_empty() {
                        Some(text.to_string())
                    } else {
                        None
                    }
                }
                vosk::CompleteResult::Multiple(multiple) => {
                    if let Some(first_alternative) = multiple.alternatives.first() {
                        let text = first_alternative.text;
                        if !text.is_empty() {
                            Some(text.to_string())
                        } else {
                            None
                        }
                    } else {
                        None
                    }
                }
            };
            
            if let Some(ref text) = transcription {
                info!("🎯 VOSK: Extracted text: '{}'", text);
            } else {
                warn!("⚠️ VOSK: No transcription text available");
            }
            
            // Log the final transcription result
            if let Some(ref text) = transcription {
                info!("📝 VOSK: FINAL TRANSCRIPTION RESULT: '{}'", text);
                info!("📝 VOSK: Transcription length: {} characters", text.chars().count());
            }
            
            Ok(VoskTranscriptionResult {
                success: true,
                transcription,
                error: None,
            })
        }
        Err(e) => {
            warn!("⚠️ VOSK: Audio processing failed: {}", e);
            let partial_result = recognizer.partial_result();
            info!("📝 VOSK: Partial result: {:?}", partial_result);
            
            let transcription = if !partial_result.partial.is_empty() {
                Some(partial_result.partial.to_string())
            } else {
                None
            };
            
            if let Some(ref text) = transcription {
                info!("🎯 VOSK: Extracted partial text: '{}'", text);
            }
            
            Ok(VoskTranscriptionResult {
                success: true,
                transcription,
                error: None,
            })
        }
    }
}

#[tauri::command]
pub async fn get_available_vosk_models() -> Result<Vec<String>, String> {
    // Force print to console for debugging
    println!("🔍 VOSK: Scanning for available models...");
    eprintln!("🔍 VOSK: Scanning for available models...");
    info!("🔍 VOSK: Scanning for available models...");
    let models_dir = Path::new("models");
    if !models_dir.exists() {
        warn!("⚠️ VOSK: Models directory does not exist: {:?}", models_dir);
        return Ok(vec![]);
    }

    info!("📁 VOSK: Models directory found: {:?}", models_dir);
    let mut models = Vec::new();
    if let Ok(entries) = std::fs::read_dir(models_dir) {
        for entry in entries {
            if let Ok(entry) = entry {
                if entry.file_type().map_or(false, |ft| ft.is_dir()) {
                    if let Some(name) = entry.file_name().to_str() {
                        info!("✅ VOSK: Found model: {}", name);
                        models.push(name.to_string());
                    }
                }
            }
        }
    } else {
        error!("❌ VOSK: Failed to read models directory");
    }

    info!("📊 VOSK: Total models found: {}", models.len());
    Ok(models)
}