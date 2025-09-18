use std::sync::Mutex;
use lazy_static::lazy_static;
use anyhow::{Result, anyhow};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use hound::WavReader;
use std::io::Cursor;

// Estado global simulado para o modelo
lazy_static! {
    static ref VOSK_INITIALIZED: Mutex<bool> = Mutex::new(false);
}

pub struct LocalVosk;

impl LocalVosk {
    /// Inicializa o modelo Vosk (simulado)
    pub fn initialize(model_path: &str) -> Result<()> {
        let mut initialized = VOSK_INITIALIZED.lock().unwrap();
        
        if *initialized {
            return Ok(()); // Já inicializado
        }

        // Simula verificação do modelo
        if !std::path::Path::new(model_path).exists() {
            return Err(anyhow!("Model path does not exist: {}", model_path));
        }
        
        *initialized = true;
        
        println!("Vosk model initialized successfully from: {}", model_path);
        Ok(())
    }

    /// Transcreve áudio usando Vosk (simulado)
    pub fn transcribe_audio(audio_base64: &str) -> Result<String> {
        let initialized = VOSK_INITIALIZED.lock().unwrap();
        if !*initialized {
            return Err(anyhow!("Vosk model not initialized"));
        }

        // Decodifica base64 para bytes
        let audio_bytes = BASE64.decode(audio_base64)
            .map_err(|e| anyhow!("Failed to decode base64 audio: {}", e))?;

        // Lê o arquivo WAV para validar formato
        let cursor = Cursor::new(audio_bytes);
        let reader = WavReader::new(cursor)
            .map_err(|e| anyhow!("Failed to read WAV data: {}", e))?;

        let spec = reader.spec();
        println!("Audio spec - Sample rate: {}, Channels: {}, Bits per sample: {}", 
                 spec.sample_rate, spec.channels, spec.bits_per_sample);

        // Simula transcrição baseada na duração do áudio
        let duration_ms = reader.duration() as f64 / spec.sample_rate as f64 * 1000.0;
        
        let transcription = if duration_ms > 500.0 {
            // Simula diferentes respostas baseadas na duração
            match (duration_ms as u32) % 5 {
                0 => "Olá, como você está?".to_string(),
                1 => "Teste de transcrição em português.".to_string(),
                2 => "O sistema de reconhecimento está funcionando.".to_string(),
                3 => "Esta é uma demonstração do Vosk local.".to_string(),
                _ => "Transcrição simulada bem-sucedida.".to_string(),
            }
        } else {
            return Err(anyhow!("Audio too short for transcription"));
        };

        println!("Simulated Vosk transcription: {}", transcription);
        Ok(transcription)
    }
}

// Comandos Tauri
#[tauri::command]
pub async fn initialize_vosk_local() -> Result<String, String> {
    // Obtém o diretório atual de trabalho
    let current_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;
    
    println!("Current working directory: {:?}", current_dir);
    
    // Tenta diferentes caminhos possíveis para o modelo
    let path1 = current_dir.join("models/vosk-model-small-pt-0.3").to_string_lossy().to_string();
    let path2 = current_dir.parent().unwrap_or(&current_dir).join("models/vosk-model-small-pt-0.3").to_string_lossy().to_string();
    
    let possible_paths = vec![
        "models/vosk-model-small-pt-0.3",
        "../models/vosk-model-small-pt-0.3", 
        "../../models/vosk-model-small-pt-0.3",
        "./models/vosk-model-small-pt-0.3",
        path1.as_str(),
        path2.as_str(),
    ];
    
    let mut model_path: Option<&str> = None;
    for path in &possible_paths {
        println!("Checking path: {}", path);
        if std::path::Path::new(*path).exists() {
            model_path = Some(path);
            break;
        }
    }
    
    let path = model_path.ok_or_else(|| {
        format!("Model not found in any expected location. Tried: {:?}", possible_paths)
    })?;
    
    LocalVosk::initialize(path)
        .map_err(|e| e.to_string())?;
    
    Ok(format!("Vosk initialized successfully (simulated) from: {}", path))
}

#[tauri::command]
pub async fn transcribe_audio_vosk(audio_base64: String) -> Result<String, String> {
    LocalVosk::transcribe_audio(&audio_base64)
        .map_err(|e| e.to_string())
}