use std::process::{Command, Stdio, Child};
use std::io::{BufRead, BufReader};
use tauri::{AppHandle, Emitter};
use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct WhisperEvent {
    pub text: String,
    pub start: f32,
    pub end: f32,
    pub is_final: bool,
}

pub struct WhisperStreamer {
    child_process: Option<Child>,
    is_running: bool,
}

impl WhisperStreamer {
    pub fn new() -> Self {
        Self {
            child_process: None,
            is_running: false,
        }
    }

    pub fn start_with_mic(&mut self, app: AppHandle, mic_index: i32) -> anyhow::Result<()> {
        println!("🚀 WhisperStreamer::start_with_mic called with mic_index: {}", mic_index);
        
        if self.is_running {
            println!("❌ Whisper stream already running");
            return Err(anyhow::anyhow!("Whisper stream already running"));
        }

        // Verificar se o executável whisper_stream existe
        let whisper_path = "../whisper/whisper-stream.exe";
        if !std::path::Path::new(whisper_path).exists() {
            println!("❌ whisper_stream executable not found at: {}", whisper_path);
            return Err(anyhow::anyhow!("whisper_stream executable not found"));
        }

        // Verificar se o modelo existe
        let model_path = "../whisper/models/ggml-base-q5_1.bin";
        if !std::path::Path::new(model_path).exists() {
            println!("❌ Model file not found: {}", model_path);
            return Err(anyhow::anyhow!("Model file not found: {}", model_path));
        }

        println!("🚀 Starting whisper_stream with mic index: {}", mic_index);

        let mut child = Command::new(whisper_path)
            .args([
                "-m", model_path,
                "--step", "500",  // 500ms step
                "--length", "5000",  // 5s length
                "--keep", "500",  // 500ms keep
                "-c", &mic_index.to_string(),
                "-l", "pt",  // Português
                "-vth", "0.3",  // VAD threshold
                "-fth", "50.0"  // High-pass filter
            ])
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;

        let stdout = child.stdout.take().unwrap();
        let stderr = child.stderr.take().unwrap();

        // Thread para ler stderr (logs de debug)
        std::thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines().flatten() {
                println!("whisper_stream stderr: {}", line);
            }
        });

        // Thread para processar stdout (transcrições)
        std::thread::spawn(move || {
            let reader = BufReader::new(stdout);
            let mut last_segment: Option<WhisperEvent> = None;
            let mut current_text = String::new();

            for line in reader.lines().flatten() {
                println!("🔍 whisper_stream stdout: {}", line);
                if let Some(evt) = parse_line_to_event(&line) {
                    println!("✅ Parsed event: {:?}", evt);
                    // Se temos um segmento anterior, marcar como final
                    if let Some(mut prev) = last_segment.take() {
                        if prev.text != evt.text {
                            prev.is_final = true;
                            println!("📤 Emitting final segment: {:?}", prev);
                            let _ = app.emit("whisper:segment", &prev);
                        }
                    }

                    current_text = evt.text.clone();
                    let partial = WhisperEvent {
                        text: current_text.clone(),
                        start: evt.start,
                        end: evt.end,
                        is_final: false,
                    };
                    println!("📤 Emitting partial segment: {:?}", partial);
                    let _ = app.emit("whisper:segment", &partial);
                    last_segment = Some(evt);
                } else if !line.trim().is_empty() {
                    // Processar linhas que não seguem o formato padrão
                    if let Some(ref seg) = last_segment {
                        if line.contains(']') {
                            if let Some(idx) = line.find(']') {
                                let text = line[idx + 1..].trim().to_string();
                                if !text.is_empty() && text != current_text {
                                    current_text = text;
                                    let partial = WhisperEvent {
                                        text: current_text.clone(),
                                        start: seg.start,
                                        end: seg.end,
                                        is_final: false,
                                    };
                                    let _ = app.emit("whisper:segment", &partial);
                                }
                            }
                        }
                    }
                }
            }

            // Marcar último segmento como final
            if let Some(mut final_seg) = last_segment {
                final_seg.is_final = true;
                let _ = app.emit("whisper:segment", &final_seg);
            }
        });

        self.child_process = Some(child);
        self.is_running = true;
        Ok(())
    }

    pub fn stop(&mut self) -> anyhow::Result<()> {
        if let Some(mut child) = self.child_process.take() {
            println!("🛑 Stopping whisper_stream...");
            let _ = child.kill();
            let _ = child.wait();
        }
        self.is_running = false;
        Ok(())
    }

    #[allow(dead_code)]
    pub fn is_running(&self) -> bool {
        self.is_running
    }
}

// Parse das linhas de saída do whisper_stream
// Formato: "[00:00:03.120 --> 00:00:05.700]  Texto"
fn parse_line_to_event(line: &str) -> Option<WhisperEvent> {
    if let Some(idx) = line.find(']') {
        let timestamp_part = &line[..idx + 1];
        let text_part = line[idx + 1..].trim();
        
        if text_part.is_empty() {
            return None;
        }

        let (start, end) = parse_timestamps(timestamp_part)?;
        
        Some(WhisperEvent {
            text: text_part.to_string(),
            start,
            end,
            is_final: false,
        })
    } else {
        None
    }
}

fn parse_timestamps(s: &str) -> Option<(f32, f32)> {
    // Formato: "[00:00:03.120 --> 00:00:05.700]"
    if let Some(start_idx) = s.find("-->") {
        let start_str = &s[1..start_idx].trim(); // Remove '[' e espaços
        let end_str = &s[start_idx + 3..s.len() - 1].trim(); // Remove ']' e espaços
        
        let start_secs = parse_timestamp_to_seconds(start_str)?;
        let end_secs = parse_timestamp_to_seconds(end_str)?;
        
        Some((start_secs, end_secs))
    } else {
        None
    }
}

fn parse_timestamp_to_seconds(timestamp: &str) -> Option<f32> {
    // Formato: "00:00:03.120"
    let parts: Vec<&str> = timestamp.split(':').collect();
    if parts.len() == 3 {
        let hours: f32 = parts[0].parse().ok()?;
        let minutes: f32 = parts[1].parse().ok()?;
        let seconds: f32 = parts[2].parse().ok()?;
        
        Some(hours * 3600.0 + minutes * 60.0 + seconds)
    } else {
        None
    }
}
