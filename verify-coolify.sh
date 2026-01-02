#!/bin/bash

# Stream Fighter - Coolify Deployment Verification Script
# This script verifies that all services are running correctly after deployment

echo "🔍 Verificando despliegue de Stream Fighter en Coolify..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0

# Function to check if a container is running
check_container() {
    local container_name=$1
    local pattern=$2
    
    if docker ps --filter "name=${pattern}" --format "{{.Names}}" | grep -q "${pattern}"; then
        echo -e "${GREEN}✓${NC} Contenedor ${container_name} está corriendo"
        
        # Check health status
        health=$(docker inspect --format='{{.State.Health.Status}}' $(docker ps --filter "name=${pattern}" --format "{{.ID}}" | head -n1) 2>/dev/null)
        if [ "$health" == "healthy" ]; then
            echo -e "  ${GREEN}✓${NC} Estado: healthy"
        elif [ "$health" == "starting" ]; then
            echo -e "  ${YELLOW}⚠${NC} Estado: starting (esperando...)"
            WARNINGS=$((WARNINGS + 1))
        elif [ "$health" == "unhealthy" ]; then
            echo -e "  ${RED}✗${NC} Estado: unhealthy"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}✗${NC} Contenedor ${container_name} NO está corriendo"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" == "$expected" ]; then
        echo -e "${GREEN}✓${NC} Endpoint ${name}: ${url} (${response})"
    else
        echo -e "${RED}✗${NC} Endpoint ${name}: ${url} (esperado: ${expected}, obtenido: ${response})"
        ERRORS=$((ERRORS + 1))
    fi
}

# Check containers
echo "📦 Verificando contenedores..."
check_container "stream-screen" "stream-screen"
check_container "stream-socket" "stream-socket"
check_container "restreamer" "restreamer"
check_container "redis" "redis"
echo ""

# Check endpoints
echo "🌐 Verificando endpoints..."

# Get the first stream-screen container ID
SCREEN_CONTAINER=$(docker ps --filter "name=stream-screen" --format "{{.ID}}" | head -n1)
SOCKET_CONTAINER=$(docker ps --filter "name=stream-socket" --format "{{.ID}}" | head -n1)

if [ ! -z "$SCREEN_CONTAINER" ]; then
    # Check health endpoint from inside container
    docker exec $SCREEN_CONTAINER curl -f http://localhost:3000/api/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Stream Screen health check: OK"
    else
        echo -e "${RED}✗${NC} Stream Screen health check: FAILED"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ ! -z "$SOCKET_CONTAINER" ]; then
    # Check socket health endpoint
    docker exec $SOCKET_CONTAINER wget --no-verbose --tries=1 --spider http://localhost:3001/health > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Stream Socket health check: OK"
    else
        echo -e "${RED}✗${NC} Stream Socket health check: FAILED"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""

# Check logs for errors
echo "📋 Verificando logs recientes..."

if [ ! -z "$SCREEN_CONTAINER" ]; then
    ERROR_COUNT=$(docker logs --tail 50 $SCREEN_CONTAINER 2>&1 | grep -i "error" | wc -l)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC} Stream Screen tiene ${ERROR_COUNT} errores en los últimos 50 logs"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓${NC} Stream Screen: Sin errores recientes"
    fi
fi

if [ ! -z "$SOCKET_CONTAINER" ]; then
    ERROR_COUNT=$(docker logs --tail 50 $SOCKET_CONTAINER 2>&1 | grep -i "error" | wc -l)
    if [ $ERROR_COUNT -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC} Stream Socket tiene ${ERROR_COUNT} errores en los últimos 50 logs"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓${NC} Stream Socket: Sin errores recientes"
    fi
fi

echo ""

# Check environment variables
echo "🔐 Verificando variables de entorno críticas..."

if [ ! -z "$SCREEN_CONTAINER" ]; then
    docker exec $SCREEN_CONTAINER printenv | grep -q "DATABASE_URL"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} DATABASE_URL está configurada"
    else
        echo -e "${RED}✗${NC} DATABASE_URL NO está configurada"
        ERRORS=$((ERRORS + 1))
    fi
    
    docker exec $SCREEN_CONTAINER printenv | grep -q "OPENROUTER_API_KEY"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} OPENROUTER_API_KEY está configurada"
    else
        echo -e "${RED}✗${NC} OPENROUTER_API_KEY NO está configurada"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""
echo "=========================================="

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Verificación completada exitosamente${NC}"
    echo ""
    echo "Tu aplicación Stream Fighter está lista para usar:"
    echo "  - Interfaz principal: https://tu-dominio.com/"
    echo "  - Votación móvil: https://tu-dominio.com/vote"
    echo "  - Restreamer UI: https://tu-dominio.com:8181"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Verificación completada con ${WARNINGS} advertencias${NC}"
    echo ""
    echo "Revisa los logs para más detalles:"
    echo "  docker logs -f <container-name>"
    exit 0
else
    echo -e "${RED}❌ Verificación fallida${NC}"
    echo "Se encontraron ${ERRORS} errores y ${WARNINGS} advertencias"
    echo ""
    echo "Pasos para solucionar:"
    echo "1. Revisa los logs de los contenedores:"
    echo "   docker logs <container-name>"
    echo ""
    echo "2. Verifica las variables de entorno en Coolify"
    echo ""
    echo "3. Asegúrate de que NODE_ENV esté configurado solo como Runtime"
    echo ""
    echo "4. Consulta COOLIFY_DEPLOYMENT.md para más información"
    exit 1
fi
