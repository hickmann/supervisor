use std::path::Path;
use std::process::Command;
use std::fs;
use base64::Engine;
use serde::{Deserialize, Serialize};
use tauri::State;
use tracing::{info, warn, error};
use tempfile::NamedTempFile;

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperTranscriptionResult {
    pub success: bool,
    pub transcription: Option<String>,
    pub error: Option<String>,
    pub segments: Option<Vec<WhisperSegment>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperSegment {
    pub id: u32,
    pub seek: u32,
    pub start: f32,
    pub end: f32,
    pub text: String,
    pub tokens: Vec<u32>,
    pub temperature: f32,
    pub avg_logprob: f32,
    pub compression_ratio: f32,
    pub no_speech_prob: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperResponse {
    pub transcription: Option<Vec<WhisperTranscription>>,
    pub result: Option<WhisperResult>,
    pub systeminfo: Option<String>,
    pub model: Option<WhisperModel>,
    pub params: Option<WhisperParams>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperModel {
    pub r#type: String,
    pub multilingual: bool,
    pub vocab: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperParams {
    pub model: String,
    pub language: String,
    pub translate: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperTranscription {
    pub text: String,
    pub timestamps: Option<WhisperTimestamps>,
    pub offsets: Option<WhisperOffsets>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperTimestamps {
    pub from: String,
    pub to: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperOffsets {
    pub from: u32,
    pub to: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperResult {
    pub language: String,
}

pub struct WhisperState {
    pub whisper_path: String,
    pub model_path: String,
}

impl WhisperState {
    pub fn new() -> Self {
        // Configurar caminhos para o Whisper.cpp
        let whisper_path = if cfg!(target_os = "windows") {
            // Construir caminho absoluto correto
            let current_dir = std::env::current_dir().unwrap();
            let project_root = current_dir.parent().unwrap();
            format!("{}/whisper/whisper-cli.exe", project_root.display())
        } else {
            "../whisper/whisper-cli".to_string()
        };
        
        let model_path = if cfg!(target_os = "windows") {
            // Construir caminho absoluto correto
            let current_dir = std::env::current_dir().unwrap();
            let project_root = current_dir.parent().unwrap();
            format!("{}/whisper/models/ggml-base-q5_1.bin", project_root.display())
        } else {
            "../whisper/models/ggml-base-q5_1.bin".to_string()
        };
        
        let whisper_state = Self {
            whisper_path,
            model_path,
        };
        
        println!("🔧 WHISPER: Whisper path: {}", whisper_state.whisper_path);
        println!("🔧 WHISPER: Model path: {}", whisper_state.model_path);
        println!("🔧 WHISPER: Current directory: {}", std::env::current_dir().unwrap().display());
        println!("🔧 WHISPER: Project root: {}", std::env::current_dir().unwrap().parent().unwrap().display());
        
        whisper_state
    }
    
    pub fn verify_setup(&self) -> Result<(), String> {
        // Verificar se o executável do Whisper existe
        if !Path::new(&self.whisper_path).exists() {
            return Err(format!("Whisper executable not found at: {}", self.whisper_path));
        }
        
        // Verificar se o modelo existe
        if !Path::new(&self.model_path).exists() {
            return Err(format!("Whisper model not found at: {}", self.model_path));
        }
        
        info!("✅ WHISPER: Setup verification successful");
        Ok(())
    }
}

#[tauri::command]
pub async fn transcribe_audio_with_whisper(
    state: State<'_, WhisperState>,
    audio_base64: String,
) -> Result<WhisperTranscriptionResult, String> {
    println!("🎤🎤🎤 WHISPER FUNCTION CALLED! 🎤🎤🎤");
    println!("🎤 WHISPER: Starting transcription");
    println!("📊 WHISPER: Audio data length: {} characters", audio_base64.len());
    println!("🔧 WHISPER: Whisper path: {}", state.whisper_path);
    println!("🔧 WHISPER: Model path: {}", state.model_path);
    
    // Verificar configuração
    state.verify_setup().map_err(|e| {
        error!("❌ WHISPER: Setup verification failed: {}", e);
        e
    })?;
    
    // Decodificar áudio base64
    info!("🔓 WHISPER: Decoding base64 audio...");
    let audio_data = base64::engine::general_purpose::STANDARD
        .decode(&audio_base64)
        .map_err(|e| {
            error!("❌ WHISPER: Failed to decode base64 audio: {}", e);
            format!("Failed to decode base64 audio: {}", e)
        })?;
    
    info!("✅ WHISPER: Audio decoded successfully, size: {} bytes", audio_data.len());
    
    // Criar arquivo temporário para o áudio
    let temp_file = NamedTempFile::new().map_err(|e| {
        error!("❌ WHISPER: Failed to create temp file: {}", e);
        format!("Failed to create temp file: {}", e)
    })?;
    
    // Escrever dados de áudio no arquivo temporário
    fs::write(temp_file.path(), &audio_data).map_err(|e| {
        error!("❌ WHISPER: Failed to write audio to temp file: {}", e);
        format!("Failed to write audio to temp file: {}", e)
    })?;
    
    info!("✅ WHISPER: Audio written to temp file: {:?}", temp_file.path());
    
    // Verificar se o arquivo foi salvo corretamente
    let file_size = std::fs::metadata(temp_file.path()).map(|m| m.len()).unwrap_or(0);
    info!("📊 WHISPER: Temp file size: {} bytes", file_size);
    
            // Verificar se é um arquivo WAV válido (deve começar com "RIFF")
            let mut file_header = [0u8; 4];
            if let Ok(_) = std::fs::read(temp_file.path()).map(|data| {
                if data.len() >= 4 {
                    file_header.copy_from_slice(&data[0..4]);
                    println!("📊 WHISPER: File header: {:?}", String::from_utf8_lossy(&file_header));
                    println!("📊 WHISPER: First 16 bytes: {:?}", &data[0..std::cmp::min(16, data.len())]);
                }
            }) {}
            
            // Verificar se o arquivo tem extensão .wav
            let temp_path_str = temp_file.path().to_str().unwrap();
            println!("📊 WHISPER: Temp file path: {}", temp_path_str);
            
            // Criar uma cópia com extensão .wav para garantir que o Whisper reconheça
            let wav_path = format!("{}.wav", temp_path_str);
            std::fs::copy(temp_file.path(), &wav_path).map_err(|e| {
                error!("❌ WHISPER: Failed to copy to WAV file: {}", e);
                format!("Failed to copy to WAV file: {}", e)
            })?;
            println!("✅ WHISPER: Created WAV file: {}", wav_path);
    
            // Executar Whisper.cpp
            let output_file_base = temp_file.path().to_str().unwrap();
            println!("🚀 WHISPER: Executing command: {} -f {} -m {} -l pt -nt --split-on-word -oj -of {}", 
                      state.whisper_path, 
                      &wav_path,
                      state.model_path,
                      output_file_base);
            
            let output = Command::new(&state.whisper_path)
                .arg("-f")
                .arg(&wav_path)
                .arg("-m")
                .arg(&state.model_path)
                .arg("-l")
                .arg("pt")
                .arg("-nt")
                .arg("--split-on-word")
                .arg("-oj")
                .arg("-of")
                .arg(output_file_base)
                .output();
    
    let output = output.map_err(|e| {
        println!("❌ WHISPER: Failed to execute whisper: {}", e);
        format!("Failed to execute whisper: {}", e)
    })?;
    
    println!("✅ WHISPER: Command executed successfully");
    println!("📊 WHISPER: Exit status: {:?}", output.status);
    println!("📝 WHISPER: Stdout length: {} bytes", output.stdout.len());
    println!("📝 WHISPER: Stderr length: {} bytes", output.stderr.len());
    
    if !output.stderr.is_empty() {
        println!("⚠️ WHISPER: Stderr content: {}", String::from_utf8_lossy(&output.stderr));
    }
    
    info!("✅ WHISPER: Whisper execution completed");
    
    if !output.status.success() {
        let error_msg = String::from_utf8_lossy(&output.stderr);
        error!("❌ WHISPER: Whisper execution failed: {}", error_msg);
        return Ok(WhisperTranscriptionResult {
            success: false,
            transcription: None,
            error: Some(format!("Whisper execution failed: {}", error_msg)),
            segments: None,
        });
    }
    
    // Processar saída do Whisper
    let stdout = String::from_utf8_lossy(&output.stdout);
    info!("📝 WHISPER: Raw output: {}", stdout);
    
    // O Whisper.cpp real gera um arquivo JSON, vamos tentar ler o arquivo de saída
    let output_file_path = format!("{}.json", output_file_base);
    info!("🔍 WHISPER: Looking for JSON file at: {}", output_file_path);
    
    let json_content = match std::fs::read_to_string(&output_file_path) {
        Ok(content) => {
            info!("✅ WHISPER: JSON file found and read successfully");
            content
        },
        Err(e) => {
            warn!("⚠️ WHISPER: Failed to read JSON file: {}", e);
            info!("📝 WHISPER: Falling back to stdout: {}", stdout);
            stdout.to_string()
        }
    };
    
    info!("📝 WHISPER: JSON content: {}", json_content);
    
    // Tentar fazer parse da resposta JSON do Whisper
    let whisper_response: WhisperResponse = serde_json::from_str(&json_content).unwrap_or_else(|e| {
        error!("❌ WHISPER: Failed to parse JSON: {}", e);
        error!("❌ WHISPER: JSON content that failed: {}", json_content);
        // Se não conseguir fazer parse, criar uma resposta vazia
        WhisperResponse {
            transcription: None,
            result: None,
            systeminfo: None,
            model: None,
            params: None,
        }
    });
    
    info!("📝 WHISPER: Parsed response: {:?}", whisper_response);
    
    // Processar transcrições uma única vez
    let (transcription, segments) = if let Some(transcriptions) = whisper_response.transcription {
        // Extrair texto completo
        let full_text = transcriptions.iter()
            .map(|t| t.text.as_str())
            .collect::<Vec<&str>>()
            .join(" ");
        
        let transcription = if !full_text.trim().is_empty() {
            Some(full_text)
        } else {
            None
        };
        
        // Converter para segmentos
        let segments = transcriptions.into_iter().enumerate().map(|(id, t)| {
            WhisperSegment {
                id: id as u32,
                seek: 0,
                start: 0.0,
                end: 0.0,
                text: t.text,
                tokens: vec![],
                temperature: 0.0,
                avg_logprob: -0.5,
                compression_ratio: 1.2,
                no_speech_prob: 0.01,
            }
        }).collect::<Vec<_>>();
        
        (transcription, Some(segments))
    } else {
        (None, None)
    };
    
    if let Some(ref text) = transcription {
        info!("🎯 WHISPER: Extracted text: '{}'", text);
        info!("📝 WHISPER: FINAL TRANSCRIPTION RESULT: '{}'", text);
        info!("📝 WHISPER: Transcription length: {} characters", text.chars().count());
    } else {
        warn!("⚠️ WHISPER: No transcription text available");
    }
    
    Ok(WhisperTranscriptionResult {
        success: true,
        transcription,
        error: None,
        segments,
    })
}

#[tauri::command]
pub async fn get_whisper_status() -> Result<String, String> {
    let state = WhisperState::new();
    
    match state.verify_setup() {
        Ok(_) => Ok("Whisper.cpp is properly configured and ready to use".to_string()),
        Err(e) => Err(e),
    }
}
