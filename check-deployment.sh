#!/bin/bash

# Script de verificación para despliegue de Stream Fighter
# Verifica que todas las configuraciones estén correctas antes del despliegue

echo "🔍 Verificando configuración de Stream Fighter..."
echo ""

ERRORS=0
WARNINGS=0

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar archivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 existe"
        return 0
    else
        echo -e "${RED}✗${NC} $1 NO existe"
        return 1
    fi
}

# Función para verificar variable de entorno
check_env_var() {
    if grep -q "^$1=" .env 2>/dev/null; then
        VALUE=$(grep "^$1=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        if [ -z "$VALUE" ] || [ "$VALUE" = "" ]; then
            echo -e "${YELLOW}⚠${NC} $1 está definida pero vacía"
            return 2
        else
            echo -e "${GREEN}✓${NC} $1 está configurada"
            return 0
        fi
    else
        echo -e "${RED}✗${NC} $1 NO está configurada en .env"
        return 1
    fi
}

# Verificar archivos necesarios
echo "📁 Verificando archivos..."
check_file "docker-compose.yaml" || ((ERRORS++))
check_file "stream-screen/Dockerfile" || ((ERRORS++))
check_file "stream-socket/Dockerfile" || ((ERRORS++))
check_file "stream-manager/Dockerfile" || ((ERRORS++))
check_file "stream-screen/package.json" || ((ERRORS++))
check_file "stream-screen/prisma/schema.prisma" || ((ERRORS++))
echo ""

# Verificar .env
echo "🔐 Verificando variables de entorno..."
if [ ! -f ".env" ]; then
    echo -e "${RED}✗${NC} Archivo .env NO existe"
    echo -e "${YELLOW}  Crea .env basándote en .env.example${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✓${NC} Archivo .env existe"
    echo ""
    
    # Variables requeridas
    check_env_var "DATABASE_URL" || ((ERRORS++))
    check_env_var "DIRECT_URL" || ((ERRORS++))
    check_env_var "OPENROUTER_API_KEY" || ((ERRORS++))
    
    # Variables opcionales pero recomendadas
    if ! check_env_var "NEXT_PUBLIC_SOCKET_URL"; then
        ((WARNINGS++))
    fi
    
    if ! check_env_var "RTMP_URL"; then
        echo -e "${YELLOW}⚠${NC} RTMP_URL no configurada (usará default: rtmp://restreamer:1935/live)"
        ((WARNINGS++))
    fi
fi
echo ""

# Verificar Docker
echo "🐳 Verificando Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker está instalado"
    if docker ps &> /dev/null; then
        echo -e "${GREEN}✓${NC} Docker está corriendo"
    else
        echo -e "${RED}✗${NC} Docker NO está corriendo"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Docker NO está instalado"
    ((ERRORS++))
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker Compose está disponible"
else
    echo -e "${RED}✗${NC} Docker Compose NO está disponible"
    ((ERRORS++))
fi
echo ""

# Verificar puertos disponibles
echo "🔌 Verificando puertos..."
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC} Puerto $1 está en uso"
        return 1
    else
        echo -e "${GREEN}✓${NC} Puerto $1 está disponible"
        return 0
    fi
}

check_port 3010 || ((WARNINGS++))
check_port 3011 || ((WARNINGS++))
check_port 3020 || ((WARNINGS++))
check_port 8181 || ((WARNINGS++))
check_port 1935 || ((WARNINGS++))
echo ""

# Verificar estructura de directorios
echo "📂 Verificando estructura de directorios..."
[ -d "stream-screen" ] && echo -e "${GREEN}✓${NC} stream-screen/" || ((ERRORS++))
[ -d "stream-socket" ] && echo -e "${GREEN}✓${NC} stream-socket/" || ((ERRORS++))
[ -d "stream-manager" ] && echo -e "${GREEN}✓${NC} stream-manager/" || ((ERRORS++))
[ -d "streamer" ] && echo -e "${GREEN}✓${NC} streamer/" || echo -e "${YELLOW}⚠${NC} streamer/ (opcional)"
echo ""

# Resumen
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Verificación completada${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Hay $WARNINGS advertencias (revisar arriba)${NC}"
    fi
    echo ""
    echo "Puedes proceder con el despliegue:"
    echo "  docker compose -f docker-compose.yaml up --build"
    exit 0
else
    echo -e "${RED}❌ Verificación fallida${NC}"
    echo -e "${RED}Se encontraron $ERRORS errores${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Y $WARNINGS advertencias${NC}"
    fi
    echo ""
    echo "Por favor, corrige los errores antes de desplegar."
    exit 1
fi




