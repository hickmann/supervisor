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
    fn find_whisper_executable() -> String {
        if cfg!(target_os = "windows") {
            let current_dir = std::env::current_dir().unwrap();
            let project_root = current_dir.parent().unwrap();
            
            // Lista de caminhos possíveis para o executável do Whisper
            let possible_paths = vec![
                format!("{}/whisper/whisper-cli.exe", project_root.display()), // Desenvolvimento
                format!("{}/_up_/whisper/whisper-cli.exe", project_root.display()), // MSI instalado
                format!("{}/whisper/whisper-server.exe", project_root.display()), // Alternativa
                format!("{}/_up_/whisper/whisper-server.exe", project_root.display()), // Alternativa MSI
            ];
            
            for path in possible_paths {
                if Path::new(&path).exists() {
                    info!("✅ WHISPER: Found executable at: {}", path);
                    return path;
                }
            }
            
            // Se não encontrou nenhum, retorna o primeiro (para mostrar erro mais claro)
            format!("{}/whisper/whisper-cli.exe", project_root.display())
        } else {
            "../whisper/whisper-cli".to_string()
        }
    }
    
    fn find_whisper_model() -> String {
        if cfg!(target_os = "windows") {
            let current_dir = std::env::current_dir().unwrap();
            let project_root = current_dir.parent().unwrap();
            
            // Lista de caminhos possíveis para o modelo do Whisper
            let possible_paths = vec![
                format!("{}/whisper/models/ggml-base-q5_1.bin", project_root.display()), // Desenvolvimento
                format!("{}/_up_/whisper/models/ggml-base-q5_1.bin", project_root.display()), // MSI instalado
                format!("{}/models/ggml-base-q5_1.bin", project_root.display()), // Alternativa
                format!("{}/_up_/models/ggml-base-q5_1.bin", project_root.display()), // Alternativa MSI
            ];
            
            for path in possible_paths {
                if Path::new(&path).exists() {
                    info!("✅ WHISPER: Found model at: {}", path);
                    return path;
                }
            }
            
            // Se não encontrou nenhum, retorna o primeiro (para mostrar erro mais claro)
            format!("{}/whisper/models/ggml-base-q5_1.bin", project_root.display())
        } else {
            "../whisper/models/ggml-base-q5_1.bin".to_string()
        }
    }

    pub fn new() -> Self {
        // Configurar caminhos para o Whisper.cpp
        let whisper_path = Self::find_whisper_executable();
        let model_path = Self::find_whisper_model();
        
        let whisper_state = Self {
            whisper_path,
            model_path,
        };
        
        
        whisper_state
    }
    
    pub fn verify_setup(&self) -> Result<(), String> {
        info!("🔍 WHISPER: Verifying setup...");
        info!("📁 WHISPER: Looking for executable at: {}", self.whisper_path);
        info!("📁 WHISPER: Looking for model at: {}", self.model_path);
        
        // Verificar se o executável do Whisper existe
        if !Path::new(&self.whisper_path).exists() {
            error!("❌ WHISPER: Executable not found at: {}", self.whisper_path);
            
            // Mostrar caminhos alternativos que foram testados
            if cfg!(target_os = "windows") {
                let current_dir = std::env::current_dir().unwrap();
                let project_root = current_dir.parent().unwrap();
                let alternative_paths = vec![
                    format!("{}/whisper/whisper-cli.exe", project_root.display()),
                    format!("{}/_up_/whisper/whisper-cli.exe", project_root.display()),
                    format!("{}/whisper/whisper-server.exe", project_root.display()),
                    format!("{}/_up_/whisper/whisper-server.exe", project_root.display()),
                ];
                
                let mut error_msg = format!("Whisper executable not found at: {}\n\nTried the following paths:", self.whisper_path);
                for path in alternative_paths {
                    error_msg.push_str(&format!("\n  - {}", path));
                }
                error_msg.push_str("\n\nPlease ensure Whisper files are properly installed.");
                return Err(error_msg);
            } else {
                return Err(format!("Whisper executable not found at: {}", self.whisper_path));
            }
        }
        
        // Verificar se o modelo existe
        if !Path::new(&self.model_path).exists() {
            error!("❌ WHISPER: Model not found at: {}", self.model_path);
            
            // Mostrar caminhos alternativos que foram testados
            if cfg!(target_os = "windows") {
                let current_dir = std::env::current_dir().unwrap();
                let project_root = current_dir.parent().unwrap();
                let alternative_paths = vec![
                    format!("{}/whisper/models/ggml-base-q5_1.bin", project_root.display()),
                    format!("{}/_up_/whisper/models/ggml-base-q5_1.bin", project_root.display()),
                    format!("{}/models/ggml-base-q5_1.bin", project_root.display()),
                    format!("{}/_up_/models/ggml-base-q5_1.bin", project_root.display()),
                ];
                
                let mut error_msg = format!("Whisper model not found at: {}\n\nTried the following paths:", self.model_path);
                for path in alternative_paths {
                    error_msg.push_str(&format!("\n  - {}", path));
                }
                error_msg.push_str("\n\nPlease ensure Whisper model files are properly installed.");
                return Err(error_msg);
            } else {
                return Err(format!("Whisper model not found at: {}", self.model_path));
            }
        }
        
        info!("✅ WHISPER: Setup verification successful");
        info!("🎯 WHISPER: Executable found at: {}", self.whisper_path);
        info!("🎯 WHISPER: Model found at: {}", self.model_path);
        Ok(())
    }
}

#[tauri::command]
pub async fn transcribe_audio_with_whisper(
    state: State<'_, WhisperState>,
    audio_base64: String,
) -> Result<WhisperTranscriptionResult, String> {
        info!("🎤 WHISPER: Starting transcription");
        info!("📊 WHISPER: Audio data length: {} characters", audio_base64.len());
    
    // Verificar configuração
    state.verify_setup().map_err(|e| {
        error!("❌ WHISPER: Setup verification failed: {}", e);
        e
    })?;
    
    // Decodificar áudio base64
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
    
    
    
    // Criar uma cópia com extensão .wav para garantir que o Whisper reconheça
    let temp_path_str = temp_file.path().to_str().unwrap();
    let wav_path = format!("{}.wav", temp_path_str);
    std::fs::copy(temp_file.path(), &wav_path).map_err(|e| {
        error!("❌ WHISPER: Failed to copy to WAV file: {}", e);
        format!("Failed to copy to WAV file: {}", e)
    })?;
    
    // Executar Whisper.cpp
    let output_file_base = temp_file.path().to_str().unwrap();
    
    let mut cmd = Command::new(&state.whisper_path);
    cmd.arg("-f")
        .arg(&wav_path)
        .arg("-m")
        .arg(&state.model_path)
        .arg("-l")
        .arg("pt")
        .arg("-nt")
        .arg("--split-on-word")
        .arg("-oj")
        .arg("-of")
        .arg(output_file_base);
    
    // No Windows, ocultar a janela do console
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW flag
    }
    
    let output = cmd.output();
    
    let output = output.map_err(|e| {
        error!("❌ WHISPER: Failed to execute whisper: {}", e);
        format!("Failed to execute whisper: {}", e)
    })?;
    
    
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
    
    // O Whisper.cpp gera um arquivo JSON, vamos ler o arquivo de saída
    let output_file_path = format!("{}.json", output_file_base);
    let json_content = match std::fs::read_to_string(&output_file_path) {
        Ok(content) => content,
        Err(e) => {
            warn!("⚠️ WHISPER: Failed to read JSON file: {}", e);
            let stdout = String::from_utf8_lossy(&output.stdout);
            stdout.to_string()
        }
    };
    
    // Fazer parse da resposta JSON do Whisper
    let whisper_response: WhisperResponse = serde_json::from_str(&json_content).unwrap_or_else(|e| {
        error!("❌ WHISPER: Failed to parse JSON: {}", e);
        // Se não conseguir fazer parse, criar uma resposta vazia
        WhisperResponse {
            transcription: None,
            result: None,
            systeminfo: None,
            model: None,
            params: None,
        }
    });
    
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
        info!("🎯 WHISPER: Transcription result: '{}'", text);
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

