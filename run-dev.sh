#!/bin/bash
# 1. Verificar configuración
./check-deployment.sh || exit 1

# 2. Inicializar base de datos (Prisma db push)
echo "Initializing database..."
cd stream-screen && npx prisma db push --accept-data-loss && cd ..

# 3. Iniciar contenedores
docker compose -f docker-compose.yaml up --build
