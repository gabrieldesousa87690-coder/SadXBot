name: Deploy Bot

on:
  # 🔥 DISPATCH MANUAL - Permite executar manualmente
  workflow_dispatch:
    inputs:
      branch:
        description: 'Branch para deploy'
        required: true
        default: 'main'
        type: string
      update_files:
        description: 'Sobrescrever arquivos existentes'
        required: false
        default: false
        type: boolean

  # 🔥 PUSH AUTOMÁTICO - Executa quando houver push
  push:
    branches:
      - main
      - master
    paths:
      - 'scripts/**'
      - 'config.json'
      - 'configCommands.json'
      - 'account.txt'
      - 'index.js'
      - 'package.json'

  # 🔥 SCHEDULE - Executa a cada 6 horas (opcional)
  schedule:
    - cron: '0 */6 * * *'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      # 1️⃣ Checkout do código
      - name: 📥 Checkout repository
        uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.branch || 'main' }}
          fetch-depth: 0

      # 2️⃣ Configurar Node.js
      - name: 🔧 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'

      # 3️⃣ Instalar dependências
      - name: 📦 Install dependencies
        run: |
          npm install
          npm install -g jsonlint

      # 4️⃣ Validar arquivos JSON
      - name: ✅ Validate JSON files
        run: |
          jsonlint config.json || exit 1
          jsonlint configCommands.json || exit 1

      # 5️⃣ Backup dos dados existentes (se houver)
      - name: 💾 Backup existing data
        if: github.event.inputs.update_files == 'false'
        run: |
          if [ -d "database/data" ]; then
            mkdir -p backup
            cp -r database/data backup/
            echo "📦 Backup criado em backup/"
          fi

      # 6️⃣ Sobrescrever dados (se solicitado)
      - name: 🔄 Overwrite files
        if: github.event.inputs.update_files == 'true'
        run: |
          echo "🔄 Sobrescrevendo arquivos..."
          # Remove dados antigos se existirem
          if [ -d "database/data" ]; then
            rm -rf database/data
          fi
          # Recria a estrutura
          mkdir -p database/data
          echo "✅ Dados sobrescritos com sucesso!"

      # 7️⃣ Preparar arquivos para deploy
      - name: 📁 Prepare deploy files
        run: |
          # Verifica se account.txt existe
          if [ ! -f "account.txt" ]; then
            echo "⚠️ account.txt não encontrado! Criando arquivo vazio..."
            echo "[]" > account.txt
          fi
          
          # Verifica se config.json existe
          if [ ! -f "config.json" ]; then
            echo "❌ config.json não encontrado!"
            exit 1
          fi

          # Cria arquivo de status
          echo "{\"last_deploy\": \"$(date -Iseconds)\", \"branch\": \"${{ github.ref_name }}\"}" > deploy_status.json

      # 8️⃣ Deploy para Render (ou outro serviço)
      - name: 🚀 Deploy to Render
        if: false  # Desative se não usar Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
          RENDER_SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          curl -X POST \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{"serviceId": "'"$RENDER_SERVICE_ID"'"}' \
            https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys

      # 9️⃣ Deploy via GitHub Pages (opcional)
      - name: 📤 Deploy to GitHub Pages
        if: false  # Desative se não usar GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          publish_branch: gh-pages
          force_orphan: true

      # 🔟 Enviar notificação de sucesso
      - name: ✅ Success notification
        if: success()
        run: |
          echo "✅ Deploy concluído com sucesso!"
          echo "📅 Data: $(date)"
          echo "🌿 Branch: ${{ github.ref_name }}"
          echo "🔄 Sobrescrever: ${{ github.event.inputs.update_files || 'false' }}"

      # 1️⃣1️⃣ Enviar notificação de falha
      - name: ❌ Failure notification
        if: failure()
        run: |
          echo "❌ Falha no deploy!"
          echo "📅 Data: $(date)"
          echo "🌿 Branch: ${{ github.ref_name }}"
          exit 1

      # 1️⃣2️⃣ Upload do backup (se houver)
      - name: 📦 Upload backup
        if: always() && github.event.inputs.update_files == 'false'
        uses: actions/upload-artifact@v4
        with:
          name: backup-data
          path: backup/
          retention-days: 7
