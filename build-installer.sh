#!/bin/bash

# Script de Build para CoterapIA - Instalador Completo
# Este script prepara e constrói o instalador com todas as dependências

echo "🚀 Iniciando build do CoterapIA com instalador completo..."

# Verificar se estamos no diretório correto
if [ ! -f "src-tauri/tauri.conf.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto CoterapIA"
    exit 1
fi

# 1. Limpar builds anteriores
echo "🧹 Limpando builds anteriores..."
rm -rf src-tauri/target/release
rm -rf dist

# 2. Instalar dependências Node.js
echo "📦 Instalando dependências Node.js..."
npm install --force

# 3. Build do frontend
echo "🏗️ Construindo frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do frontend"
    exit 1
fi

# 4. Verificar se os executáveis do Whisper existem
echo "🔍 Verificando dependências do Whisper..."
whisper_files=(
    "whisper/whisper-cli"
    "whisper/whisper-server" 
    "whisper/whisper-stream"
    "whisper/whisper-command"
    "whisper/whisper-bench"
    "whisper/whisper-talk-llama"
    "whisper/stream"
    "whisper/command"
    "whisper/bench"
    "whisper/lsp"
    "whisper/main"
    "whisper/quantize"
    "whisper/vad-speech-segments"
    "whisper/test-vad"
    "whisper/test-vad-full"
    "whisper/wchess"
)

missing_files=()
for file in "${whisper_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "⚠️ Arquivos do Whisper não encontrados:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo "💡 Certifique-se de que os executáveis do Whisper estão na pasta 'whisper/'"
fi

# 5. Verificar modelos Vosk
echo "🔍 Verificando modelos Vosk..."
if [ ! -d "src-tauri/models/vosk-model-small-pt-0.3" ]; then
    echo "⚠️ Modelo Vosk não encontrado. Extraindo..."
    if [ -f "src-tauri/models/vosk-model-small-pt-0.3.zip" ]; then
        cd src-tauri/models/
        unzip -o vosk-model-small-pt-0.3.zip
        cd ../..
        echo "✅ Modelo Vosk extraído com sucesso"
    else
        echo "❌ Arquivo do modelo Vosk não encontrado"
    fi
fi

# 6. Build do Tauri
echo "🦀 Construindo aplicação Tauri..."
cd src-tauri
cargo tauri build --bundles msi,nsis,appimage,deb,dmg

if [ $? -ne 0 ]; then
    echo "❌ Erro no build do Tauri"
    cd ..
    exit 1
fi

cd ..

# 7. Verificar se os instaladores foram criados
echo "🔍 Verificando instaladores gerados..."
installer_paths=(
    "src-tauri/target/release/bundle/msi/*.msi"
    "src-tauri/target/release/bundle/nsis/*.exe" 
    "src-tauri/target/release/bundle/appimage/*.AppImage"
    "src-tauri/target/release/bundle/deb/*.deb"
    "src-tauri/target/release/bundle/dmg/*.dmg"
)

created_installers=()
for pattern in "${installer_paths[@]}"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            created_installers+=("$file")
        fi
    done
done

if [ ${#created_installers[@]} -gt 0 ]; then
    echo "✅ Instaladores criados com sucesso:"
    for installer in "${created_installers[@]}"; do
        size=$(du -h "$installer" | cut -f1)
        echo "   📦 $(basename "$installer") ($size)"
    done
else
    echo "⚠️ Nenhum instalador foi criado"
fi

# 8. Criar diretório de distribuição
echo "📁 Organizando arquivos de distribuição..."
dist_dir="distribuicao"
rm -rf "$dist_dir"
mkdir -p "$dist_dir"

# Copiar instaladores
for installer in "${created_installers[@]}"; do
    cp "$installer" "$dist_dir/"
done

# Copiar documentação
docs=("README.md" "LICENSE")
for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        cp "$doc" "$dist_dir/"
    fi
done

# Criar arquivo de instruções de instalação
cat > "$dist_dir/INSTRUCOES_INSTALACAO.md" << 'EOF'
# CoterapIA - Instruções de Instalação

## Instaladores Disponíveis

### Windows
- **MSI**: Instalador padrão do Windows (recomendado)
- **NSIS**: Instalador alternativo com mais opções

### Linux  
- **DEB**: Para distribuições baseadas em Debian/Ubuntu
- **AppImage**: Executável portável (funciona em qualquer distribuição)

### macOS
- **DMG**: Instalador para macOS

## Dependências Incluídas

✅ Whisper (Speech-to-Text)
✅ Modelos Vosk (Reconhecimento de voz em português)
✅ Todas as bibliotecas necessárias
✅ WebView2 (Windows) / WebKit (Linux/macOS)

## Instalação

### Windows
1. Execute o arquivo .msi ou .exe
2. Siga as instruções do instalador
3. O CoterapIA será instalado com todas as dependências

### Linux
1. Para DEB: `sudo dpkg -i coterapia_*.deb`
2. Para AppImage: `chmod +x coterapia_*.AppImage && ./coterapia_*.AppImage`

### macOS
1. Abra o arquivo .dmg
2. Arraste o CoterapIA para a pasta Aplicações
3. Execute pela primeira vez (pode ser necessário permitir na Segurança)

## Primeira Execução

1. O CoterapIA configurará automaticamente todas as dependências
2. Os modelos de IA serão baixados automaticamente na primeira execução
3. Configure suas chaves de API nas configurações

## Suporte

Para suporte técnico, visite: https://www.coterapia.com.br/suporte
EOF

echo "🎉 Build completo! Instaladores disponíveis em: $dist_dir"
echo "📋 Instruções de instalação criadas em: $dist_dir/INSTRUCOES_INSTALACAO.md"
