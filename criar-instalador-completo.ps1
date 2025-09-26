# Script Completo para Criar Instalador do CoterapIA
# Este script cria instaladores profissionais para Windows, Linux e macOS

Write-Host "=== COTERAPIA - CRIADOR DE INSTALADOR COMPLETO ===" -ForegroundColor Magenta
Write-Host "Criando instaladores profissionais para todas as plataformas..." -ForegroundColor Green

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
    Write-Host "   Instalando Tauri CLI..." -ForegroundColor Cyan
    cargo install tauri-cli
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

# 5. Detectar sistema operacional
$os = $env:OS
Write-Host "`n5. Sistema operacional detectado: $os" -ForegroundColor Yellow

# 6. Criar instaladores baseado no sistema
if ($os -like "*Windows*") {
    Write-Host "`n6. Criando instaladores para Windows..." -ForegroundColor Yellow
    
    # Verificar se WiX está instalado
    try {
        $wixVersion = & "candle.exe" -? 2>&1 | Select-String "Windows Installer XML"
        if ($wixVersion) {
            Write-Host "   WiX Toolset: Encontrado" -ForegroundColor Green
            $useWix = $true
        } else {
            $useWix = $false
        }
    } catch {
        Write-Host "   WiX Toolset: Nao encontrado" -ForegroundColor Yellow
        $useWix = $false
    }
    
    # Verificar se NSIS está instalado
    try {
        $nsisVersion = & "makensis.exe" /VERSION 2>&1
        if ($nsisVersion) {
            Write-Host "   NSIS: Encontrado" -ForegroundColor Green
            $useNsis = $true
        } else {
            $useNsis = $false
        }
    } catch {
        Write-Host "   NSIS: Nao encontrado" -ForegroundColor Yellow
        $useNsis = $false
    }
    
    # Build com bundles disponíveis
    $bundles = @()
    if ($useWix) { $bundles += "msi" }
    if ($useNsis) { $bundles += "nsis" }
    
    if ($bundles.Count -eq 0) {
        Write-Host "   Nenhum bundle disponivel, criando apenas executavel..." -ForegroundColor Yellow
        cd src-tauri
        cargo tauri build --no-bundle
    } else {
        $bundleList = $bundles -join ","
        Write-Host "   Criando bundles: $bundleList" -ForegroundColor Cyan
        cd src-tauri
        cargo tauri build --bundles $bundleList
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   Erro: Tentando build sem bundle..." -ForegroundColor Yellow
        cargo tauri build --no-bundle
    }
    
    cd ..
    
} elseif ($os -like "*Linux*") {
    Write-Host "`n6. Criando instaladores para Linux..." -ForegroundColor Yellow
    
    cd src-tauri
    cargo tauri build --bundles deb,appimage
    cd ..
    
} else {
    Write-Host "`n6. Sistema nao suportado para instaladores automaticos" -ForegroundColor Yellow
    Write-Host "   Criando apenas executavel..." -ForegroundColor Cyan
    
    cd src-tauri
    cargo tauri build --no-bundle
    cd ..
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro: Falha no build do Tauri" -ForegroundColor Red
    exit 1
}

# 7. Verificar arquivos gerados
Write-Host "`n7. Verificando arquivos gerados..." -ForegroundColor Yellow

$buildDir = "src-tauri/target/release"
$bundleDir = "src-tauri/target/release/bundle"

# Verificar executavel
if (Test-Path "$buildDir/coterapia.exe") {
    Write-Host "   Executavel Windows: OK" -ForegroundColor Green
} elseif (Test-Path "$buildDir/coterapia") {
    Write-Host "   Executavel Linux/macOS: OK" -ForegroundColor Green
}

# Verificar bundles
if (Test-Path $bundleDir) {
    Write-Host "`n   Bundles encontrados:" -ForegroundColor Cyan
    
    # Windows bundles
    if (Test-Path "$bundleDir/msi") {
        $msiFiles = Get-ChildItem "$bundleDir/msi" -Filter "*.msi"
        foreach ($file in $msiFiles) {
            $size = [math]::Round($file.Length / 1MB, 2)
            Write-Host "     MSI: $($file.Name) ($size MB)" -ForegroundColor Green
        }
    }
    
    if (Test-Path "$bundleDir/nsis") {
        $nsisFiles = Get-ChildItem "$bundleDir/nsis" -Filter "*.exe"
        foreach ($file in $nsisFiles) {
            $size = [math]::Round($file.Length / 1MB, 2)
            Write-Host "     NSIS: $($file.Name) ($size MB)" -ForegroundColor Green
        }
    }
    
    # Linux bundles
    if (Test-Path "$bundleDir/deb") {
        $debFiles = Get-ChildItem "$bundleDir/deb" -Filter "*.deb"
        foreach ($file in $debFiles) {
            $size = [math]::Round($file.Length / 1MB, 2)
            Write-Host "     DEB: $($file.Name) ($size MB)" -ForegroundColor Green
        }
    }
    
    if (Test-Path "$bundleDir/appimage") {
        $appImageFiles = Get-ChildItem "$bundleDir/appimage" -Filter "*.AppImage"
        foreach ($file in $appImageFiles) {
            $size = [math]::Round($file.Length / 1MB, 2)
            Write-Host "     AppImage: $($file.Name) ($size MB)" -ForegroundColor Green
        }
    }
    
    # macOS bundles
    if (Test-Path "$bundleDir/dmg") {
        $dmgFiles = Get-ChildItem "$bundleDir/dmg" -Filter "*.dmg"
        foreach ($file in $dmgFiles) {
            $size = [math]::Round($file.Length / 1MB, 2)
            Write-Host "     DMG: $($file.Name) ($size MB)" -ForegroundColor Green
        }
    }
}

# 8. Criar pasta de distribuicao
Write-Host "`n8. Criando pasta de distribuicao..." -ForegroundColor Yellow

$distDir = "CoterapIA-Distribuicao"
if (Test-Path $distDir) {
    Remove-Item -Recurse -Force $distDir
}
New-Item -ItemType Directory -Path $distDir

# 9. Copiar instaladores
Write-Host "`n9. Copiando instaladores..." -ForegroundColor Yellow

# Copiar executavel
if (Test-Path "$buildDir/coterapia.exe") {
    Copy-Item "$buildDir/coterapia.exe" -Destination $distDir
    Write-Host "   Executavel Windows copiado" -ForegroundColor Cyan
} elseif (Test-Path "$buildDir/coterapia") {
    Copy-Item "$buildDir/coterapia" -Destination $distDir
    Write-Host "   Executavel copiado" -ForegroundColor Cyan
}

# Copiar bundles
if (Test-Path $bundleDir) {
    # Windows
    if (Test-Path "$bundleDir/msi") {
        Copy-Item "$bundleDir/msi/*" -Destination $distDir -Recurse
        Write-Host "   Instaladores MSI copiados" -ForegroundColor Cyan
    }
    
    if (Test-Path "$bundleDir/nsis") {
        Copy-Item "$bundleDir/nsis/*" -Destination $distDir -Recurse
        Write-Host "   Instaladores NSIS copiados" -ForegroundColor Cyan
    }
    
    # Linux
    if (Test-Path "$bundleDir/deb") {
        Copy-Item "$bundleDir/deb/*" -Destination $distDir -Recurse
        Write-Host "   Pacotes DEB copiados" -ForegroundColor Cyan
    }
    
    if (Test-Path "$bundleDir/appimage") {
        Copy-Item "$bundleDir/appimage/*" -Destination $distDir -Recurse
        Write-Host "   AppImages copiados" -ForegroundColor Cyan
    }
    
    # macOS
    if (Test-Path "$bundleDir/dmg") {
        Copy-Item "$bundleDir/dmg/*" -Destination $distDir -Recurse
        Write-Host "   DMGs copiados" -ForegroundColor Cyan
    }
}

# 10. Copiar dependencias do Whisper
Write-Host "`n10. Copiando dependencias do Whisper..." -ForegroundColor Yellow

New-Item -ItemType Directory -Path "$distDir/whisper" -Force

# Copiar executaveis do Whisper
$whisperFiles = Get-ChildItem -Path "whisper" -Filter "*.exe"
foreach ($file in $whisperFiles) {
    Copy-Item $file.FullName -Destination "$distDir/whisper"
    Write-Host "   Copiado: $($file.Name)" -ForegroundColor Cyan
}

# Copiar DLLs do Whisper
$dllFiles = Get-ChildItem -Path "whisper" -Filter "*.dll"
foreach ($file in $dllFiles) {
    Copy-Item $file.FullName -Destination "$distDir/whisper"
    Write-Host "   Copiado: $($file.Name)" -ForegroundColor Cyan
}

# 11. Criar documentacao
Write-Host "`n11. Criando documentacao..." -ForegroundColor Yellow

$readme = @"
# COTERAPIA - INSTALADORES PROFISSIONAIS

## Instaladores Disponiveis

### Windows
- **MSI**: Instalador Windows padrão (recomendado)
- **NSIS**: Instalador personalizado
- **Executavel**: Apenas o programa (sem instalador)

### Linux
- **DEB**: Pacote Debian/Ubuntu
- **AppImage**: Executavel portátil

### macOS
- **DMG**: Imagem de disco macOS

## Instalacao

### Windows
1. Execute o arquivo `.msi` ou `.exe` do instalador
2. Siga as instruções na tela
3. O CoterapIA será instalado automaticamente

### Linux
1. **DEB**: `sudo dpkg -i coterapia_*.deb`
2. **AppImage**: `chmod +x coterapia_*.AppImage && ./coterapia_*.AppImage`

### macOS
1. Abra o arquivo `.dmg`
2. Arraste o CoterapIA para a pasta Applications
3. Execute o programa

## Dependencias Incluidas

- Whisper (Speech-to-Text)
- Todas as bibliotecas necessárias

## Primeira Execucao

1. O CoterapIA configurará automaticamente todas as dependências
2. Configure suas chaves de API nas configurações
3. Os modelos de IA serão baixados automaticamente

## Suporte

Para suporte técnico, visite: https://www.coterapia.com.br/suporte

## Arquivos Incluidos

- Executáveis do CoterapIA
- Whisper e suas dependências
- Scripts de instalação automática
- Documentação completa
"@

$readme | Out-File -FilePath "$distDir/README.md" -Encoding UTF8

# 12. Criar arquivo ZIP
Write-Host "`n12. Criando arquivo ZIP..." -ForegroundColor Yellow

$zipPath = "CoterapIA-Instaladores-Completos.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

Compress-Archive -Path "$distDir\*" -DestinationPath $zipPath

if (Test-Path $zipPath) {
    $zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
    Write-Host "   Arquivo ZIP criado: $zipPath ($zipSize MB)" -ForegroundColor Green
} else {
    Write-Host "   Erro: Falha ao criar arquivo ZIP" -ForegroundColor Red
}

# 13. Resumo final
Write-Host "`n=== INSTALADORES CRIADOS COM SUCESSO ===" -ForegroundColor Magenta
Write-Host "Pasta de distribuicao: $distDir" -ForegroundColor Green
Write-Host "Arquivo ZIP: $zipPath" -ForegroundColor Green
Write-Host "Tamanho do ZIP: $zipSize MB" -ForegroundColor Cyan

Write-Host "`nInstaladores disponiveis:" -ForegroundColor Yellow
Get-ChildItem $distDir | ForEach-Object {
    if ($_.Extension -eq ".msi") {
        Write-Host "  MSI (Windows): $($_.Name)" -ForegroundColor White
    } elseif ($_.Extension -eq ".exe" -and $_.Name -like "*installer*") {
        Write-Host "  NSIS (Windows): $($_.Name)" -ForegroundColor White
    } elseif ($_.Extension -eq ".deb") {
        Write-Host "  DEB (Linux): $($_.Name)" -ForegroundColor White
    } elseif ($_.Extension -eq ".AppImage") {
        Write-Host "  AppImage (Linux): $($_.Name)" -ForegroundColor White
    } elseif ($_.Extension -eq ".dmg") {
        Write-Host "  DMG (macOS): $($_.Name)" -ForegroundColor White
    } elseif ($_.Extension -eq ".exe" -and $_.Name -eq "coterapia.exe") {
        Write-Host "  Executavel: $($_.Name)" -ForegroundColor White
    }
}

Write-Host "`n=== FIM ===" -ForegroundColor Magenta
