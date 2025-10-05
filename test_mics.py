#!/usr/bin/env python3
import subprocess
import sys

def test_list_mics():
    try:
        # Testar o comando whisper-stream para listar dispositivos
        result = subprocess.run(
            ["./whisper/whisper-stream.exe"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        print("STDOUT:")
        print(result.stdout)
        print("\nSTDERR:")
        print(result.stderr)
        
        # Parse dos dispositivos
        devices = []
        combined_output = result.stdout + "\n" + result.stderr
        
        for line in combined_output.split('\n'):
            if "Capture device #" in line:
                print(f"Found device line: {line}")
                # Parse da linha
                if "Capture device #" in line:
                    start = line.find("Capture device #")
                    after_hash = line[start + 16:]  # Após "Capture device #"
                    if ':' in after_hash:
                        index_str, rest = after_hash.split(':', 1)
                        try:
                            index = int(index_str.strip())
                            # Procurar por aspas
                            if "'" in rest:
                                start_quote = rest.find("'")
                                end_quote = rest.find("'", start_quote + 1)
                                if end_quote > start_quote:
                                    label = rest[start_quote + 1:end_quote]
                                    devices.append({"index": index, "label": label})
                                    print(f"Parsed device: {index} -> {label}")
                        except ValueError:
                            pass
        
        print(f"\nFound {len(devices)} devices:")
        for device in devices:
            print(f"  [{device['index']}] {device['label']}")
            
        return devices
        
    except subprocess.TimeoutExpired:
        print("Command timed out")
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == "__main__":
    devices = test_list_mics()
    print(f"\nTotal devices found: {len(devices)}")
