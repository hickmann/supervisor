use std::process::{Command, Stdio};
use tauri::command;
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct MicDevice {
    pub index: i32,
    pub label: String,
}

#[command]
pub fn list_mics() -> Result<Vec<MicDevice>, String> {
    // Executar whisper_stream sem argumentos para listar dispositivos
        let output = Command::new("../whisper/whisper-stream.exe")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Failed to execute whisper_stream: {}", e))?;

    // Combinar stdout e stderr para capturar todos os logs
    let stdout_txt = String::from_utf8_lossy(&output.stdout);
    let stderr_txt = String::from_utf8_lossy(&output.stderr);
    let combined_txt = format!("{}\n{}", stdout_txt, stderr_txt);
    
    let mut devices = Vec::new();

    // Parse das linhas de saída do whisper_stream
    // Formato real: "init:    - Capture device #0: 'Device Name'"
    for line in combined_txt.lines() {
        if line.contains("Capture device #") {
            // Extrair índice e nome do dispositivo
            if let Some(device_start) = line.find("Capture device #") {
                let after_hash = &line[device_start + 16..]; // Após "Capture device #"
                if let Some(colon_pos) = after_hash.find(':') {
                    let index_str = &after_hash[..colon_pos];
                    if let Ok(index) = index_str.parse::<i32>() {
                        // Procurar por aspas simples para extrair o nome
                        let label_part = &after_hash[colon_pos + 1..];
                        if let Some(quote_start) = label_part.find('\'') {
                            let after_quote = &label_part[quote_start + 1..];
                            if let Some(quote_end) = after_quote.find('\'') {
                                let label = &after_quote[..quote_end];
                                devices.push(MicDevice {
                                    index,
                                    label: label.to_string(),
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    if devices.is_empty() {
        return Err("Nenhum microfone encontrado pelo whisper_stream -l".to_string());
    }

    Ok(devices)
}
