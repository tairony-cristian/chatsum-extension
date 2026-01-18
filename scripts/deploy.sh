#!/bin/bash

# Deploy da extensão Chrome para Chrome Web Store

set -e

echo "🚀 Deployando ChatSum..."

# Verificar arquivo ZIP
if [ ! -f "build/chatsum-v*.zip" ]; then
    echo "❌ ZIP não encontrado. Execute build.sh primeiro"
    exit 1
fi

echo "📋 Para publicar na Chrome Web Store:"
echo "1. Acesse https://chrome.google.com/webstore/devconsole"
echo "2. Faça upload do arquivo ZIP"
echo "3. Revise as informações"
echo "4. Clique em 'Publicar'"
echo ""
echo "🔗 Link do arquivo ZIP:"
ls -lh build/chatsum-v*.zip

echo ""
echo "📚 Documentação disponível em:"
echo "- API: http://localhost:8000/docs"
echo "- GitHub: https://github.com/seu-usuario/chatsum"