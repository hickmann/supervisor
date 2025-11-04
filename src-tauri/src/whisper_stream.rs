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
 * Verifica se uma string contém palavras repetidas (indicando duplicação)
 */
fn is_repeated_words(text: &str) -> bool {
    let words: Vec<&str> = text.split_whitespace().collect();
    let len = words.len();
    
    // Se tiver menos de 10 palavras, não considerar repetição
    if len < 10 {
        return false;
    }
    
    // Verificar múltiplos padrões de repetição:
    
    // 1. Repetição exata de metades (ex: "A B C. A B C.")
    let half = len / 2;
    let first_half = &words[..half].join(" ");
    let second_half = &words[half..].join(" ");
    if similarity(first_half, second_half) > 0.85 {
        return true;
    }
    
    // 2. Repetição de terços (ex: "A B. A B. A B.")
    if len >= 12 {
        let third = len / 3;
        let first_third = &words[..third].join(" ");
        let second_third = &words[third..third*2].join(" ");
        if similarity(first_third, second_third) > 0.85 {
            return true;
        }
    }
    
    // 3. Frases que terminam repetindo o início
    // Ex: "Eu acho que não está perfeito. Eu acho que não está perfeito e..."
    if len >= 15 {
        let first_7 = &words[..7].join(" ");
        let last_start_7 = &words[len-14..len-7].join(" ");
        if similarity(first_7, last_start_7) > 0.85 {
            return true;
        }
    }
    
    false
}

/**
 * Calcula similaridade simples entre duas strings
 */
fn similarity(a: &str, b: &str) -> f32 {
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }
    
    let a_lower = a.to_lowercase();
    let b_lower = b.to_lowercase();
    
    if a_lower == b_lower {
        return 1.0;
    }
    
    // Conta palavras em comum
    let a_words: std::collections::HashSet<&str> = a_lower.split_whitespace().collect();
    let b_words: std::collections::HashSet<&str> = b_lower.split_whitespace().collect();
    
    let intersection = a_words.intersection(&b_words).count();
    let union = a_words.union(&b_words).count();
    
    if union == 0 {
        0.0
    } else {
        intersection as f32 / union as f32
    }
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

    // Iniciar whisper-stream com parâmetros otimizados para PT-BR
    // NOTA: Removido --keep-context pois causa duplicação interna das frases
    let mut cmd = Command::new(&executable_path);
    cmd.arg("-m")
        .arg(&model_path)
        .arg("-l")
        .arg("pt") // Português (whisper detecta PT-BR automaticamente)
        .arg("--step")
        .arg("3000") // 3s chunks - MAIS CONTEXTO = MAIS PRECISÃO
        .arg("--length")
        .arg("8000") // 8s janela (reduzido para menos overlap)
        .arg("--keep")
        .arg("200") // 200ms overlap MÍNIMO (evita duplicação)
        .arg("-vth")
        .arg("0.6") // VAD padrão whisper
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
                    use std::time::{Duration, Instant};
                    
                    let reader = BufReader::new(stdout);
                    let mut last_line = String::new();
                    let mut last_update = Instant::now();
                    let mut last_emitted = String::new();
                    let debounce_duration = Duration::from_millis(800); // 800ms para estabilizar
                    
                    for line in reader.lines() {
                        if let Ok(line) = line {
                            // Remover códigos ANSI e normalizar
                            let cleaned = line
                                .replace("\x1B[2K", "")
                                .replace("\x1B[K", "")
                                .replace("\x1B[1K", "")
                                .replace("\x1B[0K", "")
                                .replace("\r", "")
                                .replace("\n", "")
                                .chars()
                                .filter(|c| !c.is_control() || *c == ' ')
                                .collect::<String>()
                                .split_whitespace()
                                .collect::<Vec<&str>>()
                                .join(" ")
                                .trim()
                                .to_string();
                            
                            // Ignorar linhas vazias ou muito curtas
                            if cleaned.is_empty() || cleaned.len() < 8 {
                                continue;
                            }
                            
                            // Ignorar logs do sistema
                            if cleaned.starts_with("[") 
                                || cleaned.contains("whisper_") 
                                || cleaned.contains("processing")
                                || cleaned.contains("kHz")
                                || cleaned.contains("seconds")
                            {
                                continue;
                            }
                            
                            // Se linha mudou, atualizar buffer
                            if cleaned != last_line {
                                // Se a última linha ficou estável por tempo suficiente, emitir
                                if !last_line.is_empty() 
                                    && last_update.elapsed() >= debounce_duration
                                    && last_line != last_emitted
                                    && !is_repeated_words(&last_line)
                                {
                                    println!("🎤 WHISPER STREAM: Final transcription: {}", last_line);
                                    
                                    let transcription = WhisperTranscription {
                                        text: last_line.clone(),
                                        timestamp: chrono::Local::now().to_rfc3339(),
                                    };
                                    
                                    if let Err(e) = app_handle_clone.emit_to(EventTarget::any(), "whisper-stream-transcription", &transcription) {
                                        eprintln!("❌ WHISPER STREAM: Failed to emit event: {}", e);
                                    }
                                    
                                    last_emitted = last_line.clone();
                                }
                                
                                // Atualizar buffer com nova linha
                                println!("📝 WHISPER STREAM progress: {}", cleaned);
                                last_line = cleaned;
                                last_update = Instant::now();
                            } else {
                                // Linha repetida, atualizar timestamp
                                last_update = Instant::now();
                            }
                        }
                    }
                    
                    // Emitir última linha se houver
                    if !last_line.is_empty() 
                        && last_line != last_emitted 
                        && !is_repeated_words(&last_line)
                    {
                        println!("🎤 WHISPER STREAM: Final transcription (EOF): {}", last_line);
                        
                        let transcription = WhisperTranscription {
                            text: last_line,
                            timestamp: chrono::Local::now().to_rfc3339(),
                        };
                        
                        let _ = app_handle_clone.emit_to(EventTarget::any(), "whisper-stream-transcription", &transcription);
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

