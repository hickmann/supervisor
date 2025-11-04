// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod window;
mod shortcuts;
mod activate;
mod api;

#[cfg(target_os = "macos")]
use tauri_plugin_macos_permissions;
use xcap::Monitor;
use base64::Engine;
use image::codecs::png::PngEncoder;
use image::{ColorType, ImageEncoder};
use tauri_plugin_http;

use std::sync::{Arc, Mutex};
use tokio::task::JoinHandle;

mod speaker;
mod whisper_stt;
mod whisper_server;
mod whisper_stream;

#[derive(Default)]
pub struct AudioState {
    stream_task: Arc<Mutex<Option<JoinHandle<()>>>>,
}


#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn set_window_height(window: tauri::WebviewWindow, height: u32) -> Result<(), String> {
    use tauri::{LogicalSize, Size};
    
    let new_size = LogicalSize::new(700.0, height as f64);
    
    match window.set_size(Size::Logical(new_size)) {
        Ok(_) => {
            if let Err(e) = window::position_window_top_center(&window, 10) {
                eprintln!("Failed to reposition window: {}", e);
            }
            Ok(())
        }
        Err(e) => Err(format!("Failed to resize window: {}", e))
    }
}

#[tauri::command]
fn capture_to_base64() -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to get monitors: {}", e))?;
    let primary_monitor = monitors
        .into_iter()
        .find(|m| m.is_primary())
        .ok_or("No primary monitor found".to_string())?;

    let image = primary_monitor.capture_image().map_err(|e| format!("Failed to capture image: {}", e))?;
    let mut png_buffer = Vec::new();
    PngEncoder::new(&mut png_buffer)
        .write_image(image.as_raw(), image.width(), image.height(), ColorType::Rgba8.into())
        .map_err(|e| format!("Failed to encode to PNG: {}", e))?;
    let base64_str = base64::engine::general_purpose::STANDARD.encode(png_buffer);

    Ok(base64_str)
}

#[tauri::command]
async fn open_url(app_handle: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    
    app_handle.opener().open_url(url, None::<String>).map_err(|e| format!("Failed to open URL: {}", e))?;
    
    Ok(())
}

#[tauri::command]
async fn exit_app(app_handle: tauri::AppHandle) -> Result<(), String> {
    app_handle.exit(0);
    Ok(())
}

#[tauri::command]
fn log_from_frontend(level: String, message: String) {
    match level.as_str() {
        "error" => tracing::error!("[FRONTEND] {}", message),
        "warn" => tracing::warn!("[FRONTEND] {}", message),
        "info" => tracing::info!("[FRONTEND] {}", message),
        "debug" => tracing::debug!("[FRONTEND] {}", message),
        _ => tracing::info!("[FRONTEND] {}", message),
    }
}

fn setup_logging() -> Result<(), Box<dyn std::error::Error>> {
    use std::fs;
    use tracing_subscriber::{fmt, EnvFilter, prelude::*};
    
    // Obter o diretório de dados do usuário
    let home_dir = dirs::home_dir().ok_or("Failed to get home directory")?;
    let log_dir = home_dir.join("AppData").join("Local").join("CoterapIA").join("logs");
    
    // Criar diretório de logs se não existir
    fs::create_dir_all(&log_dir)?;
    
    // Caminho do arquivo de log com timestamp
    use std::time::{SystemTime, UNIX_EPOCH};
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let log_file = log_dir.join(format!("coterapia_{}.log", timestamp));
    
    // Criar arquivo de log
    let file = std::fs::File::create(&log_file)?;
    
    // Configurar filtro de ambiente
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));
    
    // Criar subscriber que escreve no arquivo
    let file_layer = fmt::layer()
        .with_writer(file)
        .with_target(true)
        .with_thread_ids(true)
        .with_line_number(true)
        .with_file(true)
        .with_ansi(false);
    
    // Registrar o subscriber
    tracing_subscriber::registry()
        .with(env_filter)
        .with(file_layer)
        .init();
    
    println!("Logging configured. Log file: {:?}", log_file);
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Configurar logging para arquivo
    setup_logging().expect("Failed to setup logging");
    
    let builder = tauri::Builder::default()
        .manage(AudioState::default())
        .manage(shortcuts::WindowVisibility(Mutex::new(false)))
        .manage(whisper_stt::WhisperState::new())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_keychain::init())
        .plugin(tauri_plugin_shell::init())  // Add shell plugin
        .manage(whisper_server::WhisperServerState::default())
        .manage(whisper_stream::WhisperStreamState::new())
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            set_window_height,
            capture_to_base64,
            open_url,
            exit_app,
            log_from_frontend,
            shortcuts::get_shortcuts,
            shortcuts::check_shortcuts_registered,
            shortcuts::set_app_icon_visibility,
            shortcuts::set_always_on_top,
            shortcuts::toggle_window_visibility,
            activate::activate_license_api,
            activate::mask_license_key_cmd,
            activate::get_checkout_url,
            activate::secure_storage_save,
            activate::secure_storage_get,
            activate::secure_storage_remove,
            api::transcribe_audio,
            api::chat_stream,
            api::fetch_models,
            api::check_license_status,
            speaker::start_system_audio_capture,
            speaker::stop_system_audio_capture,
            speaker::check_system_audio_access,
            speaker::request_system_audio_access,
            whisper_stt::transcribe_audio_with_whisper,
            whisper_server::start_whisper_server,
            whisper_server::stop_whisper_server,
            whisper_server::is_whisper_server_running,
            whisper_server::get_whisper_server_status,
            whisper_stream::start_whisper_stream,
            whisper_stream::stop_whisper_stream,
            whisper_stream::is_whisper_stream_running,
            whisper_stream::get_whisper_stream_status,
        ])
        .setup(|app| {
            // Setup main window positioning
            window::setup_main_window(app).expect("Failed to setup main window");
            
            // Setup global shortcuts
            if let Err(e) = shortcuts::setup_global_shortcuts(app.handle()) {
                eprintln!("Failed to setup global shortcuts: {}", e);
            }
            
            Ok(())
        });

    // Add macOS-specific permissions plugin
    #[cfg(target_os = "macos")]
    {
        builder = builder.plugin(tauri_plugin_macos_permissions::init());
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}