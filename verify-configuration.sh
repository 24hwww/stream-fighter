#!/bin/bash

# Script de verificación de configuración - Stream Fighter

echo "🔍 Verificando configuración de Stream Fighter..."
echo "=============================================="

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0

# 1. Verificar archivo .env
echo "📋 Verificando archivo .env..."
if [ -f ".env" ]; then
    echo -e "  ${GREEN}✓${NC} Archivo .env encontrado"
    
    # Verificar variables críticas
    REQUIRED_VARS=("DATABASE_URL" "DIRECT_URL" "OPENROUTER_API_KEY" "NEXT_PUBLIC_SOCKET_URL")
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            echo -e "  ${GREEN}✓${NC} Variable $var configurada"
        else
            echo -e "  ${RED}✗${NC} Variable $var no encontrada"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "  ${RED}✗${NC} Archivo .env no encontrado"
    echo -e "  ${YELLOW}ℹ${NC} Copia .env.example a .env y configura las variables"
    ERRORS=$((ERRORS + 1))
fi

# 2. Verificar dependencias
echo ""
echo "📦 Verificando dependencias..."

cd stream-screen

if [ -f "package.json" ]; then
    echo -e "  ${GREEN}✓${NC} package.json encontrado"
    
    # Verificar si node_modules existe
    if [ -d "node_modules" ]; then
        echo -e "  ${GREEN}✓${NC} node_modules encontrado"
    else
        echo -e "  ${YELLOW}⚠${NC} node_modules no encontrado (ejecuta npm install)"
    fi
    
    # Verificar dependencias críticas
    CRITICAL_DEPS=("next" "react" "prisma" "socket.io" "skia-canvas" "pixi.js" "@pixi/node")
    
    for dep in "${CRITICAL_DEPS[@]}"; do
        if grep -q "\"${dep}\":" package.json; then
            echo -e "  ${GREEN}✓${NC} Dependencia $dep presente"
        else
            echo -e "  ${RED}✗${NC} Dependencia $dep no encontrada"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "  ${RED}✗${NC} package.json no encontrado en stream-screen"
    ERRORS=$((ERRORS + 1))
fi

cd ..

# 3. Verificar Docker
echo ""
echo "🐳 Verificando Docker..."

if command -v docker &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Docker instalado"
    
    if command -v docker-compose &> /dev/null || command -v docker compose &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Docker Compose instalado"
    else
        echo -e "  ${RED}✗${NC} Docker Compose no encontrado"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "  ${RED}✗${NC} Docker no instalado"
    ERRORS=$((ERRORS + 1))
fi

# 4. Verificar archivos de configuración
echo ""
echo "⚙️ Verificando archivos de configuración..."

CONFIG_FILES=("docker-compose.yaml" "stream-screen/next.config.mjs" "stream-screen/eslint.config.mjs" "stream-screen/prisma/schema.prisma")

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file encontrado"
    else
        echo -e "  ${RED}✗${NC} $file no encontrado"
        ERRORS=$((ERRORS + 1))
    fi
done

# 5. Verificar servicios Docker
echo ""
echo "🔧 Verificando servicios Docker..."

if [ -f "docker-compose.yaml" ]; then
    echo -e "  ${GREEN}✓${NC} docker-compose.yaml encontrado"
    
    # Verificar servicios críticos
    SERVICES=("stream-screen" "stream-socket" "restreamer" "redis")
    
    for service in "${SERVICES[@]}"; do
        if grep -q "^\s*${service}:" docker-compose.yaml; then
            echo -e "  ${GREEN}✓${NC} Servicio $service definido"
        else
            echo -e "  ${RED}✗${NC} Servicio $service no encontrado"
            ERRORS=$((ERRORS + 1))
        fi
    done
fi

# 6. Verificar mocks
echo ""
echo "🎭 Verificando archivos de mock..."

MOCK_FILES=("stream-screen/lib/mocks/sharp.js" "stream-screen/lib/mocks/skia-canvas.js")

for file in "${MOCK_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file encontrado"
    else
        echo -e "  ${RED}✗${NC} $file no encontrado"
        ERRORS=$((ERRORS + 1))
    fi
done

# 7. Resumen
echo ""
echo "📊 Resumen de verificación"
echo "========================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Configuración completa y correcta!${NC}"
    echo ""
    echo "Próximos pasos:"
    echo "1. Iniciar servicios: docker compose up --build"
    echo "2. Acceder a: http://localhost:3010"
    echo "3. Verificar health checks: ./verify-optimization.sh"
else
    echo -e "${RED}❌ Se encontraron $ERRORS errores de configuración${NC}"
    echo ""
    echo "Por favor, corrige los errores antes de iniciar el sistema."
    echo "Consulta la guía de configuración: CONFIGURATION_GUIDE.md"
fi

echo ""
echo "🔍 Verificación completada"
echo "========================="