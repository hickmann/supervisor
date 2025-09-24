#!/usr/bin/env python3
"""
Script para testar o Whisper.cpp diretamente
"""
import subprocess
import os
import json
import base64

def test_whisper():
    # Caminhos
    whisper_path = "whisper/whisper-cli.exe"
    model_path = "whisper/models/ggml-base-q5_1.bin"
    test_audio = "whisper/jfk.wav"
    
    print("🔧 Testando Whisper.cpp...")
    print(f"📁 Whisper path: {whisper_path}")
    print(f"📁 Model path: {model_path}")
    print(f"📁 Test audio: {test_audio}")
    
    # Verificar se os arquivos existem
    if not os.path.exists(whisper_path):
        print(f"❌ Whisper executable not found: {whisper_path}")
        return False
    
    if not os.path.exists(model_path):
        print(f"❌ Model not found: {model_path}")
        return False
        
    if not os.path.exists(test_audio):
        print(f"❌ Test audio not found: {test_audio}")
        return False
    
    print("✅ All files found")
    
    # Executar Whisper
    cmd = [
        whisper_path,
        "-f", test_audio,
        "-m", model_path,
        "-l", "pt",
        "--no-timestamps", "0",
        "--split-on-word",
        "--output-json"
    ]
    
    print(f"🚀 Executing: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        print(f"📊 Exit code: {result.returncode}")
        print(f"📝 Stdout length: {len(result.stdout)}")
        print(f"📝 Stderr length: {len(result.stderr)}")
        
        if result.stderr:
            print(f"⚠️ Stderr: {result.stderr}")
        
        # Verificar se o arquivo JSON foi criado
        json_file = f"{test_audio}.json"
        if os.path.exists(json_file):
            print(f"✅ JSON file created: {json_file}")
            
            # Ler e mostrar o conteúdo
            with open(json_file, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"📄 JSON content length: {len(content)}")
                
                try:
                    data = json.loads(content)
                    if 'transcription' in data and data['transcription']:
                        print("✅ Transcription found!")
                        for i, trans in enumerate(data['transcription']):
                            print(f"📝 Segment {i}: {trans['text']}")
                        return True
                    else:
                        print("❌ No transcription found in JSON")
                        return False
                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse JSON: {e}")
                    return False
        else:
            print(f"❌ JSON file not created: {json_file}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Whisper execution timed out")
        return False
    except Exception as e:
        print(f"❌ Error executing Whisper: {e}")
        return False

if __name__ == "__main__":
    success = test_whisper()
    if success:
        print("\n🎉 Whisper.cpp test PASSED!")
    else:
        print("\n💥 Whisper.cpp test FAILED!")
