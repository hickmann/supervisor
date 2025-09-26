# Script de Configuracao de Dependencias para CoterapIA
# Este script prepara todas as dependencias necessarias para o instalador

Write-Host "Configurando dependencias do CoterapIA..." -ForegroundColor Green

# 1. Verificar estrutura de diretorios
Write-Host "Verificando estrutura de diretorios..." -ForegroundColor Yellow

$requiredDirs = @(
    "whisper",
    "src-tauri/models",
    "src-tauri/vosk-libs",
    "src-tauri/icons"
)

foreach ($dir in $requiredDirs) {
    if (-not (Test-Path $dir)) {
        Write-Host "Diretorio nao encontrado: $dir" -ForegroundColor Red
        exit 1
    }
}

# 2. Verificar executaveis do Whisper
Write-Host "Verificando executaveis do Whisper..." -ForegroundColor Yellow

$whisperExes = @(
    "whisper/whisper-cli.exe",
    "whisper/whisper-server.exe",
    "whisper/whisper-stream.exe",
    "whisper/whisper-command.exe",
    "whisper/whisper-bench.exe",
    "whisper/whisper-talk-llama.exe",
    "whisper/stream.exe",
    "whisper/command.exe",
    "whisper/bench.exe",
    "whisper/lsp.exe",
    "whisper/main.exe",
    "whisper/quantize.exe",
    "whisper/vad-speech-segments.exe",
    "whisper/test-vad.exe",
    "whisper/test-vad-full.exe",
    "whisper/wchess.exe"
)

$missingWhisper = @()
foreach ($exe in $whisperExes) {
    if (-not (Test-Path $exe)) {
        $missingWhisper += $exe
    }
}

if ($missingWhisper.Count -gt 0) {
    Write-Host "Executaveis do Whisper nao encontrados:" -ForegroundColor Yellow
    foreach ($exe in $missingWhisper) {
        Write-Host "   - $exe" -ForegroundColor Yellow
    }
    Write-Host "Baixe os executaveis do Whisper e coloque na pasta 'whisper/'" -ForegroundColor Cyan
}

# 3. Verificar DLLs do Whisper
Write-Host "Verificando DLLs do Whisper..." -ForegroundColor Yellow

$whisperDlls = @(
    "whisper/whisper.dll",
    "whisper/ggml.dll",
    "whisper/ggml-base.dll", 
    "whisper/ggml-cpu.dll",
    "whisper/SDL2.dll"
)

$missingDlls = @()
foreach ($dll in $whisperDlls) {
    if (-not (Test-Path $dll)) {
        $missingDlls += $dll
    }
}

if ($missingDlls.Count -gt 0) {
    Write-Host "DLLs do Whisper nao encontradas:" -ForegroundColor Yellow
    foreach ($dll in $missingDlls) {
        Write-Host "   - $dll" -ForegroundColor Yellow
    }
}

# 4. Verificar modelos Vosk
Write-Host "Verificando modelos Vosk..." -ForegroundColor Yellow

if (-not (Test-Path "src-tauri/models/vosk-model-small-pt-0.3")) {
    if (Test-Path "src-tauri/models/vosk-model-small-pt-0.3.zip") {
        Write-Host "Extraindo modelo Vosk..." -ForegroundColor Yellow
        Expand-Archive -Path "src-tauri/models/vosk-model-small-pt-0.3.zip" -DestinationPath "src-tauri/models/" -Force
        Write-Host "Modelo Vosk extraido" -ForegroundColor Green
    } else {
        Write-Host "Arquivo do modelo Vosk nao encontrado" -ForegroundColor Red
    }
}

# 5. Verificar bibliotecas Vosk
Write-Host "Verificando bibliotecas Vosk..." -ForegroundColor Yellow

$voskLibs = @(
    "src-tauri/vosk-libs/vosk-win64-0.3.45/libvosk.dll",
    "src-tauri/vosk-libs/vosk-win64-0.3.45/libgcc_s_seh-1.dll",
    "src-tauri/vosk-libs/vosk-win64-0.3.45/libstdc++-6.dll",
    "src-tauri/vosk-libs/vosk-win64-0.3.45/libwinpthread-1.dll"
)

$missingVoskLibs = @()
foreach ($lib in $voskLibs) {
    if (-not (Test-Path $lib)) {
        $missingVoskLibs += $lib
    }
}

if ($missingVoskLibs.Count -gt 0) {
    Write-Host "Bibliotecas Vosk nao encontradas:" -ForegroundColor Yellow
    foreach ($lib in $missingVoskLibs) {
        Write-Host "   - $lib" -ForegroundColor Yellow
    }
}

# 6. Verificar icones
Write-Host "Verificando icones..." -ForegroundColor Yellow

$icons = @(
    "src-tauri/icons/icon.ico",
    "src-tauri/icons/icon.icns", 
    "src-tauri/icons/32x32.png",
    "src-tauri/icons/128x128.png",
    "src-tauri/icons/128x128@2x.png"
)

$missingIcons = @()
foreach ($icon in $icons) {
    if (-not (Test-Path $icon)) {
        $missingIcons += $icon
    }
}

if ($missingIcons.Count -gt 0) {
    Write-Host "Icones nao encontrados:" -ForegroundColor Yellow
    foreach ($icon in $missingIcons) {
        Write-Host "   - $icon" -ForegroundColor Yellow
    }
}

# 7. Resumo final
Write-Host "`nResumo da Configuracao:" -ForegroundColor Cyan
Write-Host "   Estrutura de diretorios: OK" -ForegroundColor Green
Write-Host "   Executaveis Whisper: $($whisperExes.Count - $missingWhisper.Count)/$($whisperExes.Count)" -ForegroundColor $(if ($missingWhisper.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host "   DLLs Whisper: $($whisperDlls.Count - $missingDlls.Count)/$($whisperDlls.Count)" -ForegroundColor $(if ($missingDlls.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host "   Bibliotecas Vosk: $($voskLibs.Count - $missingVoskLibs.Count)/$($voskLibs.Count)" -ForegroundColor $(if ($missingVoskLibs.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host "   Icones: $($icons.Count - $missingIcons.Count)/$($icons.Count)" -ForegroundColor $(if ($missingIcons.Count -eq 0) { "Green" } else { "Yellow" })

if ($missingWhisper.Count -eq 0 -and $missingDlls.Count -eq 0 -and $missingVoskLibs.Count -eq 0 -and $missingIcons.Count -eq 0) {
    Write-Host "`nTodas as dependencias estao prontas!" -ForegroundColor Green
    Write-Host "Execute './build-installer.ps1' para criar o instalador" -ForegroundColor Cyan
} else {
    Write-Host "`nAlgumas dependencias estao faltando" -ForegroundColor Yellow
    Write-Host "Resolva os problemas acima antes de executar o build" -ForegroundColor Cyan
}