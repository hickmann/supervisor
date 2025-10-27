# Sistema de Logging do CoterapIA

## 📝 Visão Geral

O CoterapIA implementa um sistema de logging completo que grava todos os erros, avisos e informações em arquivos de log para facilitar o debug e o diagnóstico de problemas em produção.

## 📂 Localização dos Logs

### Windows
```
C:\Users\<USERNAME>\AppData\Local\CoterapIA\logs\coterapia_<timestamp>.log
```

### macOS
```
~/Library/Application Support/CoterapIA/logs/coterapia_<timestamp>.log
```

### Linux
```
~/.local/share/CoterapIA/logs/coterapia_<timestamp>.log
```

## 🔍 Conteúdo dos Logs

Os logs incluem:
- **Nível**: INFO, WARN, ERROR, DEBUG
- **Timestamp**: Data e hora exata
- **Thread ID**: Identificador da thread
- **Arquivo**: Nome do arquivo fonte
- **Linha**: Número da linha de código
- **Mensagem**: Descrição detalhada do evento

## 📊 Formato de Exemplo

```
2024-01-15T10:30:45.123Z INFO coterapia::whisper_stt: Executable found at: C:\Program Files\CoterapIA\_up_\whisper\whisper-cli.exe
2024-01-15T10:30:45.456Z ERROR coterapia::whisper_stt: Model not found at: C:\Program Files\CoterapIA\_up_\whisper\models\ggml-base-q5_1.bin
```

## 🎛️ Configuração de Níveis

O nível de logging pode ser configurado usando a variável de ambiente:

```bash
RUST_LOG=debug  # Mostrar tudo (debug, info, warn, error)
RUST_LOG=info   # Padrão (info, warn, error)
RUST_LOG=warn   # Apenas warnings e erros
RUST_LOG=error  # Apenas erros
```

### Níveis Específicos por Módulo

```bash
RUST_LOG=coterapia=debug,tauri=info,tracing=warn
```

## 🔧 Debug de Problemas

### Encontrar Erros do Whisper

```bash
# Windows PowerShell
Get-Content "C:\Users\$env:USERNAME\AppData\Local\CoterapIA\logs\*.log" | Select-String "WHISPER.*ERROR"

# Linux/Mac
grep "WHISPER.*ERROR" ~/.local/share/CoterapIA/logs/*.log
```

### Encontrar Erros Gerais

```bash
# Windows PowerShell
Get-Content "C:\Users\$env:USERNAME\AppData\Local\CoterapIA\logs\*.log" | Select-String "ERROR"

# Linux/Mac
grep "ERROR" ~/.local/share/CoterapIA/logs/*.log
```

### Ver Últimas 100 Linhas

```bash
# Windows PowerShell
Get-Content "C:\Users\$env:USERNAME\AppData\Local\CoterapIA\logs\*.log" -Tail 100

# Linux/Mac
tail -n 100 ~/.local/share/CoterapIA/logs/*.log
```

## 📋 Exemplos de Uso

### Problema: Whisper não funciona
1. Abra o arquivo de log mais recente
2. Procure por linhas contendo "WHISPER"
3. Identifique a linha com "ERROR" ou "not found"
4. Verifique o caminho exibido no log

### Problema: Aplicativo não inicia
1. Verifique o arquivo de log imediatamente após o crash
2. Procure pela última linha antes do crash
3. Identifique a causa do erro pela mensagem

### Problema: Audio não funciona
1. Procure por linhas com "AUDIO" ou "MICROPHONE"
2. Verifique mensagens de erro ou avisos
3. Confira permissões mencionadas nos logs

## 🔄 Rotação de Logs

Cada execução do aplicativo cria um novo arquivo de log com timestamp único, evitando que os logs fiquem muito grandes:

- `coterapia_1705236245.log` (segunda execução)
- `coterapia_1705236545.log` (segunda execução 5 minutos depois)

## 💡 Dicas

1. **Mantenha os logs**: Não delete os arquivos de log - eles são essenciais para debug
2. **Selecione logs recentes**: Use o timestamp no nome do arquivo para identificar os mais recentes
3. **Envie logs ao suporte**: Sempre inclua o arquivo de log completo ao reportar bugs
4. **Verifique permissões**: Se os logs não estão sendo criados, verifique permissões de escrita na pasta

## 🛠️ Limpeza de Logs Antigos

Para limpar logs antigos (ex: manter apenas últimos 30 dias):

### Windows PowerShell
```powershell
$logsDir = "$env:LOCALAPPDATA\CoterapIA\logs"
$cutoffDate = (Get-Date).AddDays(-30)
Get-ChildItem -Path $logsDir -Filter "*.log" | 
    Where-Object { $_.LastWriteTime -lt $cutoffDate } | 
    Remove-Item
```

### Linux/Mac
```bash
find ~/.local/share/CoterapIA/logs -name "*.log" -mtime +30 -delete
```
