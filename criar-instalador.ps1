# Script Principal para Criar Instalador do CoterapIA
# Este script executa todo o processo de criacao do instalador

Write-Host "=== COTERAPIA - CRIADOR DE INSTALADOR ===" -ForegroundColor Magenta
Write-Host "Criando instalador completo com todas as dependencias..." -ForegroundColor Green

# 1. Verificar pre-requisitos
Write-Host "`n1. Verificando pre-requisitos..." -ForegroundColor Yellow

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "   Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   Node.js: NAO ENCONTRADO" -ForegroundColor Red
    Write-Host "   Instale Node.js 18+ em: https://nodejs.org" -ForegroundColor Cyan
    exit 1
}

# Verificar Rust
try {
    $rustVersion = rustc --version
    Write-Host "   Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "   Rust: NAO ENCONTRADO" -ForegroundColor Red
    Write-Host "   Instale Rust em: https://rustup.rs" -ForegroundColor Cyan
    exit 1
}

# Verificar Tauri CLI
try {
    $tauriVersion = cargo tauri --version
    Write-Host "   Tauri CLI: $tauriVersion" -ForegroundColor Green
} catch {
    Write-Host "   Tauri CLI: NAO ENCONTRADO" -ForegroundColor Red
    Write-Host "   Instale com: cargo install tauri-cli" -ForegroundColor Cyan
    exit 1
}

# 2. Verificar dependencias
Write-Host "`n2. Verificando dependencias do projeto..." -ForegroundColor Yellow
.\setup-dependencies.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nErro: Dependencias nao estao prontas" -ForegroundColor Red
    exit 1
}

# 3. Instalar dependencias Node.js
Write-Host "`n3. Instalando dependencias Node.js..." -ForegroundColor Yellow
npm install --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha ao instalar dependencias Node.js" -ForegroundColor Red
    exit 1
}

# 4. Build do frontend
Write-Host "`n4. Construindo frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha no build do frontend" -ForegroundColor Red
    exit 1
}

# 5. Build do Tauri
Write-Host "`n5. Construindo aplicacao Tauri..." -ForegroundColor Yellow
Write-Host "   Isso pode levar varios minutos..." -ForegroundColor Cyan

cd src-tauri
cargo tauri build --bundles msi,nsis

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha no build do Tauri" -ForegroundColor Red
    cd ..
    exit 1
}

cd ..

# 6. Verificar instaladores criados
Write-Host "`n6. Verificando instaladores criados..." -ForegroundColor Yellow

$installerPaths = @(
    "src-tauri/target/release/bundle/msi/*.msi",
    "src-tauri/target/release/bundle/nsis/*.exe", 
    "src-tauri/target/release/bundle/appimage/*.AppImage",
    "src-tauri/target/release/bundle/deb/*.deb",
    "src-tauri/target/release/bundle/dmg/*.dmg"
)

$createdInstallers = @()
foreach ($pattern in $installerPaths) {
    $files = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue
    if ($files) {
        $createdInstallers += $files
    }
}

if ($createdInstallers.Count -gt 0) {
    Write-Host "`nInstaladores criados com sucesso:" -ForegroundColor Green
    foreach ($installer in $createdInstallers) {
        $size = [math]::Round($installer.Length / 1MB, 2)
        Write-Host "   $($installer.Name) ($size MB)" -ForegroundColor Green
    }
} else {
    Write-Host "Nenhum instalador foi criado" -ForegroundColor Yellow
}

# 7. Organizar arquivos de distribuicao
Write-Host "`n7. Organizando arquivos de distribuicao..." -ForegroundColor Yellow

$distDir = "distribuicao"
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Path $distDir

# Copiar instaladores
foreach ($installer in $createdInstallers) {
    Copy-Item $installer.FullName -Destination $distDir
    Write-Host "   Copiado: $($installer.Name)" -ForegroundColor Cyan
}

# Copiar documentacao
$docs = @("README.md", "LICENSE", "INSTALADOR_README.md")
foreach ($doc in $docs) {
    if (Test-Path $doc) {
        Copy-Item $doc -Destination $distDir
        Write-Host "   Copiado: $doc" -ForegroundColor Cyan
    }
}

# Criar arquivo de instrucoes
$instructions = @"
# COTERAPIA - INSTRUCOES DE INSTALACAO

## Instaladores Disponiveis

### Windows
- **MSI**: Instalador padrao do Windows (recomendado)
- **NSIS**: Instalador alternativo com mais opcoes

### Linux  
- **DEB**: Para distribuicoes baseadas em Debian/Ubuntu
- **AppImage**: Executavel portavel (funciona em qualquer distribuicao)

### macOS
- **DMG**: Instalador para macOS

## Dependencias Incluidas

✅ Whisper (Speech-to-Text)
✅ Modelos Vosk (Reconhecimento de voz em portugues)
✅ Todas as bibliotecas necessarias
✅ WebView2 (Windows) / WebKit (Linux/macOS)

## Instalacao

### Windows
1. Execute o arquivo .msi ou .exe
2. Siga as instrucoes do instalador
3. O CoterapIA sera instalado com todas as dependencias

### Linux
1. Para DEB: sudo dpkg -i coterapia_*.deb
2. Para AppImage: chmod +x coterapia_*.AppImage && ./coterapia_*.AppImage

### macOS
1. Abra o arquivo .dmg
2. Arraste o CoterapIA para a pasta Aplicacoes
3. Execute pela primeira vez (pode ser necessario permitir na Seguranca)

## Primeira Execucao

1. O CoterapIA configurara automaticamente todas as dependencias
2. Os modelos de IA serao baixados automaticamente na primeira execucao
3. Configure suas chaves de API nas configuracoes

## Suporte

Para suporte tecnico, visite: https://www.coterapia.com.br/suporte
"@

$instructions | Out-File -FilePath "$distDir/INSTRUCOES_INSTALACAO.md" -Encoding UTF8

# 8. Resumo final
Write-Host "`n=== BUILD COMPLETO ===" -ForegroundColor Magenta
Write-Host "Instaladores disponiveis em: $distDir" -ForegroundColor Green
Write-Host "Instrucoes de instalacao: $distDir/INSTRUCOES_INSTALACAO.md" -ForegroundColor Cyan

if ($createdInstallers.Count -gt 0) {
    Write-Host "`nInstaladores prontos para distribuicao:" -ForegroundColor Green
    foreach ($installer in $createdInstallers) {
        Write-Host "   $($installer.Name)" -ForegroundColor Green
    }
    
    Write-Host "`nPara instalar em outro computador:" -ForegroundColor Cyan
    Write-Host "1. Copie o instalador apropriado para o computador destino" -ForegroundColor White
    Write-Host "2. Execute o instalador" -ForegroundColor White
    Write-Host "3. Siga as instrucoes na tela" -ForegroundColor White
    Write-Host "4. Todas as dependencias serao instaladas automaticamente" -ForegroundColor White
} else {
    Write-Host "`nNenhum instalador foi criado. Verifique os logs acima." -ForegroundColor Yellow
}

Write-Host "`n=== FIM ===" -ForegroundColor Magenta