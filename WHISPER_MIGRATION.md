# Migração do Vosk para Whisper.cpp

Este documento descreve a migração completa do sistema de reconhecimento de voz do Vosk para o Whisper.cpp.

## Alterações Realizadas

### 1. Remoção Completa do Vosk

#### Dependências Removidas:
- `vosk = "0.3"` do `src-tauri/Cargo.toml`

#### Arquivos Deletados:
- `src-tauri/src/vosk_stt.rs`
- `src-tauri/test_vosk.rs`
- `src-tauri/vosk_api.h`
- `src-tauri/vosk-windows.zip`
- `src-tauri/models/` (pasta completa com modelos do Vosk)
- `src-tauri/vosk-libs/` (pasta completa com bibliotecas do Vosk)
- `src-tauri/libgcc_s_seh-1.dll`
- `src-tauri/libstdc++-6.dll`
- `src-tauri/libvosk.dll`
- `src-tauri/libvosk.lib`
- `src-tauri/libwinpthread-1.dll`
- `src/components/settings/stt-configs/VoskConfig.tsx`

#### Código Atualizado:
- `src-tauri/src/lib.rs`: Removidas referências ao módulo `vosk_stt`
- `src/hooks/useSystemAudio.ts`: Substituída função `transcribeWithVosk` por `transcribeWithWhisper`
- `src/components/completion/AutoSpeechVad.tsx`: Atualizado para usar Whisper
- `src/lib/functions/stt.function.ts`: Substituída função `fetchVoskSTT` por `fetchWhisperSTT`
- `src/config/stt.constants.ts`: Removida configuração do Vosk e adicionada do Whisper

### 2. Implementação do Whisper.cpp

#### Estrutura Criada:
```
whisper/
├── whisper.ps1 (script PowerShell para Windows)
├── models/
│   └── ggml-base-q5_1.bin (modelo baixado)
└── [outros arquivos do repositório whisper.cpp]
```

#### Novo Módulo Rust:
- `src-tauri/src/whisper_stt.rs`: Implementação completa da integração com Whisper.cpp

#### Configuração:
- Modelo: `ggml-base-q5_1.bin`
- Idioma: Português do Brasil (`pt`)
- Flags obrigatórias:
  - `--language pt` (sempre português)
  - `--no-timestamps 0` (retorna timestamps)
  - `--split-on-word` (cortes limpos entre segmentos)
  - Não usar `--vad` (VAD interno desabilitado)

### 3. Integração com VAD Existente

O fluxo de captura de áudio pelo VAD atual (`@ricky0123/vad-react`) permanece **exatamente igual**:

1. VAD detecta segmentos de fala
2. Áudio é enviado ao Whisper.cpp para transcrição
3. Whisper retorna texto + timestamps
4. Fluxo continua normalmente como antes

### 4. Compatibilidade

- **Windows**: Usa PowerShell script (`whisper.ps1`)
- **Linux/macOS**: Usa executável direto (quando compilado)
- **Tauri**: Integração via comandos nativos
- **Frontend**: Interface idêntica, apenas motor STT alterado

## Comandos Tauri Adicionados

```rust
// Transcrever áudio com Whisper.cpp
transcribe_audio_with_whisper(audio_base64: String) -> WhisperTranscriptionResult

// Verificar status da configuração do Whisper
get_whisper_status() -> String
```

## Estrutura de Resposta

```typescript
interface WhisperTranscriptionResult {
  success: boolean;
  transcription?: string;
  error?: string;
  segments?: WhisperSegment[];
}

interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}
```

## Configuração do Modelo

O modelo `ggml-base-q5_1.bin` foi baixado do Hugging Face:
- URL: `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin`
- Localização: `whisper/models/ggml-base-q5_1.bin`
- Tamanho: ~142MB
- Idioma: Multilíngue (configurado para português)

## Próximos Passos

1. **Compilação**: Compilar o whisper.cpp para Windows
2. **Testes**: Testar integração completa
3. **Otimização**: Ajustar parâmetros conforme necessário
4. **Documentação**: Atualizar README com novas instruções

## Notas Importantes

- ✅ VAD existente mantido inalterado
- ✅ Fluxo de captura de áudio preservado
- ✅ Interface do usuário idêntica
- ✅ Compatibilidade com sistema de supervisão psicológica
- ✅ Suporte a timestamps e segmentação
- ✅ Idioma fixo em português brasileiro
- ✅ VAD interno do Whisper desabilitado
