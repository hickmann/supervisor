# Script PowerShell para iniciar o whisper_server
# Este script facilita o uso do whisper_server com as configurações corretas

param(
    [string]$Model = "ggml-base-q5_1.bin",
    [string]$Language = "pt",
    [int]$Port = 8000,
    [string]$Host = "127.0.0.1"
)

Write-Host "🚀 Iniciando whisper_server..." -ForegroundColor Green
Write-Host "📁 Modelo: $Model" -ForegroundColor Cyan
Write-Host "🌍 Idioma: $Language" -ForegroundColor Cyan
Write-Host "🔌 Host: $Host" -ForegroundColor Cyan
Write-Host "🔌 Porta: $Port" -ForegroundColor Cyan

# Encontrar o executável do whisper_server
$whisperPaths = @(
    ".\whisper\whisper-server.exe",
    ".\CoterapIA-Distribuicao\whisper\whisper-server.exe",
    ".\CoterapIA-Instalador\whisper\whisper-server.exe"
)

$whisperExe = $null
foreach ($path in $whisperPaths) {
    if (Test-Path $path) {
        $whisperExe = $path
        Write-Host "Encontrado whisper-server em: $path" -ForegroundColor Green
        break
    }
}

if (-not $whisperExe) {
    Write-Host "❌ whisper-server.exe não encontrado!" -ForegroundColor Red
    Write-Host "Procurado em:" -ForegroundColor Yellow
    foreach ($path in $whisperPaths) {
        Write-Host "  - $path" -ForegroundColor Yellow
    }
    exit 1
}

# Encontrar o modelo
$modelPaths = @(
    ".\whisper\models\$Model",
    ".\models\$Model",
    ".\CoterapIA-Distribuicao\whisper\models\$Model",
    ".\CoterapIA-Instalador\whisper\models\$Model"
)

$modelPath = $null
foreach ($path in $modelPaths) {
    if (Test-Path $path) {
        $modelPath = $path
        Write-Host "Encontrado modelo em: $path" -ForegroundColor Green
        break
    }
}

if (-not $modelPath) {
    Write-Host "❌ Modelo $Model não encontrado!" -ForegroundColor Red
    Write-Host "Procurado em:" -ForegroundColor Yellow
    foreach ($path in $modelPaths) {
        Write-Host "  - $path" -ForegroundColor Yellow
    }
    exit 1
}

# Construir comando
$arguments = @(
    "-m", $modelPath,
    "--host", $Host,
    "--port", $Port.ToString(),
    "--language", $Language
)

Write-Host "🎯 Executando comando:" -ForegroundColor Magenta
Write-Host "  $whisperExe $($arguments -join ' ')" -ForegroundColor Magenta
Write-Host ""

try {
    # Executar o whisper_server
    & $whisperExe $arguments
} catch {
    Write-Host "❌ Erro ao executar whisper_server: $_" -ForegroundColor Red
    exit 1
}
