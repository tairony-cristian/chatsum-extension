#!/bin/bash

# Build da extensão Chrome para release

set -e

echo "🔨 Building ChatSum Extension..."

# Variáveis
EXTENSION_DIR="../extension"
BUILD_DIR="../build"
VERSION=$(grep '"version"' "$EXTENSION_DIR/manifest.json" | cut -d'"' -f4)

echo "Version: $VERSION"

# 1. Limpar build anterior
echo "📁 Limpando build anterior..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# 2. Copiar extensão
echo "📦 Copiando arquivos..."
cp -r "$EXTENSION_DIR" "$BUILD_DIR/chatsum"

# 3. Remover arquivos desnecessários
echo "🧹 Limpando arquivos..."
find "$BUILD_DIR" -name ".DS_Store" -delete
find "$BUILD_DIR" -name "*.log" -delete
find "$BUILD_DIR" -name ".env*" -delete

# 4. Criar ZIP
echo "📦 Criando arquivo ZIP..."
cd "$BUILD_DIR"
zip -r "chatsum-v${VERSION}.zip" chatsum/
cd ..

echo "✅ Build completo!"
echo "Arquivo: build/chatsum-v${VERSION}.zip"