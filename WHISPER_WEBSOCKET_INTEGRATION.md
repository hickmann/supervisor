# Integração Whisper WebSocket

Esta implementação substitui o sistema atual de transcrição via Tauri por uma solução mais eficiente usando WebSocket com o `whisper_server`.

## 🎯 Objetivo

- **VAD ricky** (React) → **whisper_server** (WebSocket) → **Transcrições** → **Histórico**
- Transcrever apenas falas do **terapeuta** (não do paciente)
- Melhor performance e latência reduzida
- Streaming em tempo real

## 🏗️ Arquitetura

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    ┌─────────────────┐
│   VAD React     │ ──────────────► │ whisper_server  │ ──► │   Transcrição   │
│ (@ricky0123)    │                 │   (localhost)   │    │   (Histórico)   │
└─────────────────┘                 └─────────────────┘    └─────────────────┘
```

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `src/lib/whisper-websocket-client.ts` - Cliente WebSocket para whisper_server
- `src/lib/functions/whisper-websocket-stt.function.ts` - Função STT via WebSocket
- `src/components/speech/WhisperServerManager.tsx` - Interface para gerenciar servidor
- `src-tauri/src/whisper_server.rs` - Comandos Tauri para gerenciar servidor
- `start-whisper-server.ps1` - Script PowerShell para iniciar servidor

### Arquivos Modificados:
- `src/components/completion/AutoSpeechVad.tsx` - Usa WebSocket em vez de Tauri
- `src/components/completion/VadOnly.tsx` - Usa WebSocket em vez de Tauri
- `src-tauri/src/lib.rs` - Adiciona comandos do whisper_server

## 🚀 Como Usar

### 1. Iniciar whisper_server

#### Opção A: Via Interface (Recomendado)
1. Abra a aplicação CoterapIA
2. Vá para as configurações
3. Use o componente `WhisperServerManager` para iniciar o servidor

#### Opção B: Via Script PowerShell
```powershell
.\start-whisper-server.ps1
```

#### Opção C: Manual
```bash
.\whisper\whisper-server.exe -m .\whisper\models\ggml-base-q5_1.bin --host 127.0.0.1 --port 8000 --language pt
```

### 2. Verificar Conexão

O sistema automaticamente:
- Detecta quando o servidor está rodando
- Conecta via WebSocket
- Fallback para Tauri se WebSocket falhar

### 3. Usar VAD

O VAD React funciona normalmente:
- Detecta fala do terapeuta
- Envia áudio via WebSocket
- Recebe transcrição em tempo real
- Salva no histórico

## ⚙️ Configuração

### Parâmetros do whisper_server:
- **Modelo**: `ggml-base-q5_1.bin`
- **Idioma**: `pt` (Português)
- **Host**: `127.0.0.1`
- **Porta**: `8000`
- **Protocolo**: WebSocket

### Fallback:
Se o WebSocket falhar, o sistema automaticamente usa o método Tauri original.

## 🔧 Comandos Tauri Disponíveis

```rust
// Iniciar servidor
start_whisper_server() -> WhisperServerStatus

// Parar servidor  
stop_whisper_server() -> WhisperServerStatus

// Verificar se está rodando
is_whisper_server_running() -> bool

// Obter status completo
get_whisper_server_status() -> WhisperServerStatus
```

## 📊 Vantagens

### Performance:
- ✅ Latência reduzida (WebSocket vs Tauri)
- ✅ Streaming em tempo real
- ✅ Menos overhead de processo

### Confiabilidade:
- ✅ Reconexão automática
- ✅ Fallback para Tauri
- ✅ Monitoramento de status

### Usabilidade:
- ✅ Interface gráfica para gerenciar servidor
- ✅ Inicialização automática
- ✅ Logs detalhados

## 🐛 Troubleshooting

### Servidor não inicia:
1. Verificar se `whisper-server.exe` existe
2. Verificar se o modelo `ggml-base-q5_1.bin` existe
3. Verificar se a porta 8000 está livre

### WebSocket não conecta:
1. Verificar se o servidor está rodando
2. Verificar firewall/antivírus
3. Verificar logs no console

### Transcrições não funcionam:
1. Verificar conexão WebSocket
2. Verificar se VAD está ativo
3. Verificar logs de erro

## 📝 Logs

O sistema gera logs detalhados:
- `🔌` - Conexão WebSocket
- `🎤` - Captura de áudio
- `📨` - Mensagens WebSocket
- `✅` - Sucesso
- `❌` - Erro
- `⚠️` - Aviso

## 🔄 Migração

A migração é transparente:
1. Sistema detecta automaticamente WebSocket
2. Usa WebSocket se disponível
3. Fallback para Tauri se necessário
4. Interface permanece igual

## 📈 Próximos Passos

1. **Testes**: Validar funcionamento completo
2. **Otimização**: Ajustar parâmetros de conexão
3. **Monitoramento**: Adicionar métricas de performance
4. **Documentação**: Atualizar README principal
