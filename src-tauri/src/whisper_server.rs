/**
 * Whisper Server Manager
 * 
 * Comandos Tauri para gerenciar o processo whisper_server
 * Permite iniciar, parar e verificar status do servidor
 */

use std::process::{Command, Stdio};
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::State;
use tracing::{info, error};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WhisperServerStatus {
    pub is_running: bool,
    pub port: Option<u16>,
    pub pid: Option<u32>,
    pub error: Option<String>,
}

pub struct WhisperServerState {
    pub process_handle: Arc<Mutex<Option<std::process::Child>>>,
}

impl WhisperServerState {
    pub fn new() -> Self {
        Self {
            process_handle: Arc::new(Mutex::new(None)),
        }
    }
}

impl Default for WhisperServerState {
    fn default() -> Self {
        Self::new()
    }
}

fn find_whisper_server_executable() -> Result<String, String> {
    if cfg!(target_os = "windows") {
        let exe_path = std::env::current_exe().map_err(|e| format!("Failed to get current exe: {}", e))?;
        let exe_dir = exe_path.parent().ok_or("Failed to get exe directory")?;
        
        // Lista de caminhos possíveis para o executável do whisper_server
        // Prioridade: 1. _up_ (MSI instalado), 2. whisper (desenvolvimento)
        let possible_paths = vec![
            format!("{}/_up_/whisper/whisper-server.exe", exe_dir.display()), // MSI instalado (prioridade)
            format!("{}/whisper/whisper-server.exe", exe_dir.display()), // Desenvolvimento
            format!("{}/CoterapIA-Distribuicao/whisper/whisper-server.exe", exe_dir.display()),
            format!("{}/CoterapIA-Instalador/whisper/whisper-server.exe", exe_dir.display()),
        ];
        
        for path in &possible_paths {
            if Path::new(path).exists() {
                info!("✅ WHISPER SERVER: Found executable at: {}", path);
                return Ok(path.clone());
            }
        }
        
        Err(format!("whisper-server.exe not found in any of the expected locations: {:?}", possible_paths))
    } else {
        Ok("../whisper/whisper-server".to_string())
    }
}

fn find_whisper_model() -> Result<String, String> {
    if cfg!(target_os = "windows") {
        let exe_path = std::env::current_exe().map_err(|e| format!("Failed to get current exe: {}", e))?;
        let exe_dir = exe_path.parent().ok_or("Failed to get exe directory")?;
        
        // Lista de caminhos possíveis para o modelo do Whisper
        // Prioridade: 1. _up_ (MSI instalado), 2. whisper (desenvolvimento)
        let possible_paths = vec![
            format!("{}/_up_/whisper/models/ggml-base-q5_1.bin", exe_dir.display()), // MSI instalado (prioridade)
            format!("{}/_up_/models/ggml-base-q5_1.bin", exe_dir.display()), // MSI instalado alternativa
            format!("{}/whisper/models/ggml-base-q5_1.bin", exe_dir.display()), // Desenvolvimento
            format!("{}/models/ggml-base-q5_1.bin", exe_dir.display()), // Desenvolvimento alternativa
        ];
        
        for path in &possible_paths {
            if Path::new(path).exists() {
                info!("✅ WHISPER SERVER: Found model at: {}", path);
                return Ok(path.clone());
            }
        }
        
        Err(format!("Whisper model not found in any of the expected locations: {:?}", possible_paths))
    } else {
        Ok("../whisper/models/ggml-base-q5_1.bin".to_string())
    }
}

#[tauri::command]
pub async fn start_whisper_server(
    state: State<'_, WhisperServerState>,
) -> Result<WhisperServerStatus, String> {
    info!("🚀 WHISPER SERVER: Starting whisper_server...");
    
    // Verificar se já está rodando
    {
        let mut handle = state.process_handle.lock().unwrap();
        if let Some(ref mut child) = *handle {
            match child.try_wait() {
                Ok(Some(_)) => {
                    info!("🔄 WHISPER SERVER: Previous process finished, starting new one");
                }
                Ok(None) => {
                    info!("⚠️ WHISPER SERVER: Already running");
                    return Ok(WhisperServerStatus {
                        is_running: true,
                        port: Some(8000), // Porta padrão do whisper_server
                        pid: None,
                        error: None,
                    });
                }
                Err(e) => {
                    error!("❌ WHISPER SERVER: Error checking process status: {}", e);
                }
            }
        }
    }
    
    // Encontrar executável e modelo
    let executable_path = find_whisper_server_executable()?;
    let model_path = find_whisper_model()?;
    
    info!("🎯 WHISPER SERVER: Executable: {}", executable_path);
    info!("🎯 WHISPER SERVER: Model: {}", model_path);
    
    // Construir comando
    let mut cmd = Command::new(&executable_path);
    cmd.arg("-m")
        .arg(&model_path)
        .arg("--host")
        .arg("127.0.0.1")
        .arg("--port")
        .arg("8000")
        .arg("--language")
        .arg("pt")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    
    // No Windows, ocultar a janela do console
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW flag
    }
    
    // Iniciar processo
    let child = cmd.spawn().map_err(|e| {
        error!("❌ WHISPER SERVER: Failed to start process: {}", e);
        format!("Failed to start whisper_server: {}", e)
    })?;
    
    let pid = child.id();
    info!("✅ WHISPER SERVER: Started with PID: {}", pid);
    
    // Salvar handle do processo
    {
        let mut handle = state.process_handle.lock().unwrap();
        *handle = Some(child);
    }
    
    // Aguardar um pouco para o servidor inicializar
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    
    Ok(WhisperServerStatus {
        is_running: true,
        port: Some(8000),
        pid: Some(pid),
        error: None,
    })
}

#[tauri::command]
pub async fn stop_whisper_server(
    state: State<'_, WhisperServerState>,
) -> Result<WhisperServerStatus, String> {
    info!("🛑 WHISPER SERVER: Stopping whisper_server...");
    
    let mut handle = state.process_handle.lock().unwrap();
    
    if let Some(mut child) = handle.take() {
        match child.kill() {
            Ok(_) => {
                info!("✅ WHISPER SERVER: Process killed successfully");
                Ok(WhisperServerStatus {
                    is_running: false,
                    port: None,
                    pid: None,
                    error: None,
                })
            }
            Err(e) => {
                error!("❌ WHISPER SERVER: Failed to kill process: {}", e);
                Err(format!("Failed to stop whisper_server: {}", e))
            }
        }
    } else {
        info!("⚠️ WHISPER SERVER: No process to stop");
        Ok(WhisperServerStatus {
            is_running: false,
            port: None,
            pid: None,
            error: None,
        })
    }
}

#[tauri::command]
pub async fn is_whisper_server_running(
    state: State<'_, WhisperServerState>,
) -> Result<bool, String> {
    let mut handle = state.process_handle.lock().unwrap();
    
    if let Some(ref mut child) = *handle {
        match child.try_wait() {
            Ok(Some(_)) => {
                info!("🔄 WHISPER SERVER: Process finished");
                Ok(false)
            }
            Ok(None) => {
                info!("✅ WHISPER SERVER: Process is running");
                Ok(true)
            }
            Err(e) => {
                error!("❌ WHISPER SERVER: Error checking process: {}", e);
                Err(format!("Error checking process status: {}", e))
            }
        }
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub async fn get_whisper_server_status(
    state: State<'_, WhisperServerState>,
) -> Result<WhisperServerStatus, String> {
    let mut handle = state.process_handle.lock().unwrap();
    
    if let Some(ref mut child) = *handle {
        match child.try_wait() {
            Ok(Some(exit_status)) => {
                info!("🔄 WHISPER SERVER: Process finished with status: {:?}", exit_status);
                Ok(WhisperServerStatus {
                    is_running: false,
                    port: None,
                    pid: None,
                    error: Some("Process finished".to_string()),
                })
            }
            Ok(None) => {
                info!("✅ WHISPER SERVER: Process is running");
                Ok(WhisperServerStatus {
                    is_running: true,
                    port: Some(8000),
                    pid: Some(child.id()),
                    error: None,
                })
            }
            Err(e) => {
                error!("❌ WHISPER SERVER: Error checking process: {}", e);
                Ok(WhisperServerStatus {
                    is_running: false,
                    port: None,
                    pid: None,
                    error: Some(format!("Error checking process: {}", e)),
                })
            }
        }
    } else {
        Ok(WhisperServerStatus {
            is_running: false,
            port: None,
            pid: None,
            error: None,
        })
    }
}
