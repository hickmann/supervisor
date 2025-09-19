use vosk::{Model, Recognizer};

fn main() {
    // Test VOSK API
    let model = Model::new("models/vosk-model-small-pt-0.3").unwrap();
    let mut recognizer = Recognizer::new(&model, 16000.0).unwrap();
    
    // Test with dummy audio
    let dummy_audio = vec![0i16; 1600]; // 0.1 second of silence
    let result = recognizer.accept_waveform(&dummy_audio);
    println!("Result: {:?}", result);
    
    let final_result = recognizer.final_result();
    println!("Final result: {:?}", final_result);
    
    let partial_result = recognizer.partial_result();
    println!("Partial result: {:?}", partial_result);
}
