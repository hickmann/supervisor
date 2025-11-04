/**
 * Whisper Stream Module
 * 
 * Gerencia o processo whisper-stream.exe que tem VAD integrado
 * e processa áudio continuamente do microfone do terapeuta.
 */

use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::path::Path;
use std::io::{BufRead, BufReader};
use std::thread;
use tauri::{State, AppHandle, Emitter, EventTarget};

#[derive(Default)]
pub struct WhisperStreamState {
    process: Arc<Mutex<Option<Child>>>,
    is_running: Arc<Mutex<bool>>,
    app_handle: Arc<Mutex<Option<AppHandle>>>,
}

impl WhisperStreamState {
    pub fn new() -> Self {
        Self {
            process: Arc::new(Mutex::new(None)),
            is_running: Arc::new(Mutex::new(false)),
            app_handle: Arc::new(Mutex::new(None)),
        }
    }
}

#[derive(Clone, serde::Serialize)]
pub struct WhisperTranscription {
    pub text: String,
    pub timestamp: String,
}

#[derive(serde::Serialize)]
pub struct WhisperStreamStatus {
    pub is_running: bool,
    pub pid: Option<u32>,
    pub error: Option<String>,
}

/**
 * Encontra o executável whisper-stream.exe
 */
fn find_whisper_stream_executable() -> Result<String, String> {
    if cfg!(target_os = "windows") {
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .ok_or("Failed to get executable directory")?;

        let possible_paths = vec![
            exe_dir.join("_up_").join("whisper").join("whisper-stream.exe"), // MSI instalado
            exe_dir.join("whisper").join("whisper-stream.exe"), // Desenvolvimento
            exe_dir.join("CoterapIA-Distribuicao").join("whisper").join("whisper-stream.exe"),
            exe_dir.join("CoterapIA-Instalador").join("whisper").join("whisper-stream.exe"),
        ];

        for path in &possible_paths {
            if path.exists() {
                println!("✅ Found whisper-stream.exe at: {:?}", path);
                return Ok(path.to_string_lossy().to_string());
            }
        }

        Err(format!("whisper-stream.exe not found in any of the expected locations: {:?}", possible_paths))
    } else {
        Ok("../whisper/whisper-stream".to_string())
    }
}

/**
 * Encontra o modelo Whisper
 */
fn find_whisper_model() -> Result<String, String> {
    if cfg!(target_os = "windows") {
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .ok_or("Failed to get executable directory")?;

        let possible_paths = vec![
            exe_dir.join("_up_").join("whisper").join("models").join("ggml-base-q5_1.bin"),
            exe_dir.join("_up_").join("models").join("ggml-base-q5_1.bin"),
            exe_dir.join("whisper").join("models").join("ggml-base-q5_1.bin"),
        ];

        for path in &possible_paths {
            if path.exists() {
                println!("✅ Found model at: {:?}", path);
                return Ok(path.to_string_lossy().to_string());
            }
        }

        Err(format!("Model ggml-base-q5_1.bin not found"))
    } else {
        Ok("../whisper/models/ggml-base-q5_1.bin".to_string())
    }
}

/**
 * Inicia o processo whisper-stream e captura stdout
 */
#[tauri::command]
pub async fn start_whisper_stream(
    state: State<'_, WhisperStreamState>,
    app_handle: AppHandle,
) -> Result<WhisperStreamStatus, String> {
    println!("🚀 WHISPER STREAM: Starting whisper-stream process...");

    // Armazenar app_handle
    {
        let mut handle = state.app_handle.lock().unwrap();
        *handle = Some(app_handle.clone());
    }

    // Verificar se já está rodando
    let mut is_running = state.is_running.lock().unwrap();
    if *is_running {
        println!("⚠️ WHISPER STREAM: Already running");
        let process = state.process.lock().unwrap();
        let pid = process.as_ref().map(|p| p.id());
        return Ok(WhisperStreamStatus {
            is_running: true,
            pid,
            error: None,
        });
    }

    let executable_path = find_whisper_stream_executable()?;
    let model_path = find_whisper_model()?;

    println!("📁 WHISPER STREAM: Executable: {}", executable_path);
    println!("📁 WHISPER STREAM: Model: {}", model_path);

    // Verificar se os arquivos existem
    if !Path::new(&executable_path).exists() {
        let error_msg = format!("Executable not found: {}", executable_path);
        eprintln!("❌ WHISPER STREAM: {}", error_msg);
        return Err(error_msg);
    }

    if !Path::new(&model_path).exists() {
        let error_msg = format!("Model not found: {}", model_path);
        eprintln!("❌ WHISPER STREAM: {}", error_msg);
        return Err(error_msg);
    }

    // Iniciar whisper-stream com parâmetros otimizados
    let mut cmd = Command::new(&executable_path);
    cmd.arg("-m")
        .arg(&model_path)
        .arg("-l")
        .arg("pt") // Português
        .arg("--step")
        .arg("3000") // 3 segundos de chunks
        .arg("--length")
        .arg("10000") // 10 segundos de janela
        .arg("-vth")
        .arg("0.3") // VAD threshold mais sensível
        .arg("-t")
        .arg("4"); // 4 threads

    // No Windows, ocultar janela do console
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    // Configurar stdin/stdout para comunicação
    cmd.stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    match cmd.spawn() {
        Ok(mut child) => {
            let pid = child.id();
            println!("✅ WHISPER STREAM: Started successfully with PID {}", pid);

            // Capturar stdout em thread separada
            if let Some(stdout) = child.stdout.take() {
                let app_handle_clone = app_handle.clone();
                thread::spawn(move || {
                    let reader = BufReader::new(stdout);
                    for line in reader.lines() {
                        if let Ok(line) = line {
                            let line = line.trim();
                            
                            // Debug: mostrar TODAS as linhas
                            println!("📝 WHISPER STREAM stdout: {}", line);
                            
                            // Filtrar linhas vazias, timestamps e logs do sistema
                            if !line.is_empty() 
                                && !line.starts_with("[") 
                                && !line.contains("whisper_") 
                                && !line.contains("processing")
                                && !line.contains("kHz")
                                && line.len() > 5  // Pelo menos 5 caracteres
                            {
                                println!("🎤 WHISPER STREAM: Transcription detected: {}", line);
                                
                                // Emitir evento com transcrição
                                let transcription = WhisperTranscription {
                                    text: line.to_string(),
                                    timestamp: chrono::Local::now().to_rfc3339(),
                                };
                                
                                if let Err(e) = app_handle_clone.emit_to(EventTarget::any(), "whisper-stream-transcription", &transcription) {
                                    eprintln!("❌ WHISPER STREAM: Failed to emit event: {}", e);
                                }
                            }
                        }
                    }
                    println!("🛑 WHISPER STREAM: stdout reader thread finished");
                });
            }

            // Capturar stderr em thread separada (para debug)
            if let Some(stderr) = child.stderr.take() {
                thread::spawn(move || {
                    let reader = BufReader::new(stderr);
                    for line in reader.lines() {
                        if let Ok(line) = line {
                            eprintln!("⚠️ WHISPER STREAM stderr: {}", line);
                        }
                    }
                });
            }

            let mut process = state.process.lock().unwrap();
            *process = Some(child);
            *is_running = true;

            Ok(WhisperStreamStatus {
                is_running: true,
                pid: Some(pid),
                error: None,
            })
        }
        Err(e) => {
            let error_msg = format!("Failed to start whisper-stream: {}", e);
            eprintln!("❌ WHISPER STREAM: {}", error_msg);
            Err(error_msg)
        }
    }
}

/**
 * Para o processo whisper-stream
 */
#[tauri::command]
pub async fn stop_whisper_stream(
    state: State<'_, WhisperStreamState>,
) -> Result<WhisperStreamStatus, String> {
    println!("🛑 WHISPER STREAM: Stopping whisper-stream...");

    let mut process = state.process.lock().unwrap();
    let mut is_running = state.is_running.lock().unwrap();

    if let Some(mut child) = process.take() {
        match child.kill() {
            Ok(_) => {
                println!("✅ WHISPER STREAM: Process killed successfully");
                *is_running = false;
                Ok(WhisperStreamStatus {
                    is_running: false,
                    pid: None,
                    error: None,
                })
            }
            Err(e) => {
                eprintln!("❌ WHISPER STREAM: Failed to kill process: {}", e);
                Err(format!("Failed to stop whisper-stream: {}", e))
            }
        }
    } else {
        println!("⚠️ WHISPER STREAM: No process to stop");
        *is_running = false;
        Ok(WhisperStreamStatus {
            is_running: false,
            pid: None,
            error: None,
        })
    }
}

/**
 * Verifica se whisper-stream está rodando
 */
#[tauri::command]
pub async fn is_whisper_stream_running(
    state: State<'_, WhisperStreamState>,
) -> Result<bool, String> {
    let is_running = state.is_running.lock().unwrap();
    Ok(*is_running)
}

/**
 * Obtém status do whisper-stream
 */
#[tauri::command]
pub async fn get_whisper_stream_status(
    state: State<'_, WhisperStreamState>,
) -> Result<WhisperStreamStatus, String> {
    let is_running = state.is_running.lock().unwrap();
    let process = state.process.lock().unwrap();
    let pid = process.as_ref().map(|p| p.id());

    Ok(WhisperStreamStatus {
        is_running: *is_running,
        pid,
        error: None,
    })
}

