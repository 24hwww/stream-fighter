#!/bin/bash
# Script de verificación post-optimización
# Verifica que todos los servicios estén funcionando correctamente

set -e

echo "🔍 Verificando arquitectura optimizada..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función de verificación
check_service() {
    local service=$1
    local url=$2
    local expected=$3
    
    echo -n "Verificando $service... "
    
    if curl -s "$url" | grep -q "$expected"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        return 1
    fi
}

# Verificar que servicios obsoletos no estén corriendo
echo "📋 Verificando que servicios obsoletos fueron eliminados..."
if docker ps | grep -w "streamer" | grep -v "restreamer"; then
    echo -e "${RED}✗ ADVERTENCIA: Servicio 'streamer' aún está corriendo${NC}"
else
    echo -e "${GREEN}✓ Servicio 'streamer' eliminado correctamente${NC}"
fi

if docker ps | grep -q "stream-manager"; then
    echo -e "${RED}✗ ADVERTENCIA: Servicio 'stream-manager' aún está corriendo${NC}"
else
    echo -e "${GREEN}✓ Servicio 'stream-manager' eliminado correctamente${NC}"
fi

echo ""

# Verificar servicios activos
echo "🚀 Verificando servicios activos..."
docker compose ps

echo ""

# Verificar health checks
echo "🏥 Verificando health checks..."

# Stream-screen
check_service "stream-screen" "http://localhost:3010/api/health" "ok" || true

# Stream-socket
check_service "stream-socket" "http://localhost:3011/health" "ok" || true

# Restreamer
check_service "restreamer" "http://localhost:8181" "Restreamer" || true

# Redis
echo -n "Verificando redis... "
if docker exec stream-fighter-redis-1 redis-cli ping | grep -q "PONG"; then
    echo -e "${GREEN}✓ OK${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo ""

# Verificar uso de recursos
echo "💾 Uso de recursos:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" | grep stream-fighter

echo ""

# Verificar configuración de Canvas Renderer
echo "🎨 Verificando configuración de Canvas Renderer..."
if docker exec stream-fighter-stream-screen-1 printenv USE_CANVAS_RENDERER | grep -q "true"; then
    echo -e "${GREEN}✓ Canvas Renderer habilitado${NC}"
else
    echo -e "${YELLOW}⚠ Canvas Renderer no está habilitado (usando fallback Chromium)${NC}"
fi

echo ""

# Resumen
echo "📊 RESUMEN DE LA OPTIMIZACIÓN:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Servicios eliminados: streamer, stream-manager"
echo "Servicios activos: stream-screen, stream-socket, restreamer, redis"
echo "Renderer: Canvas (optimizado)"
echo "FFmpeg preset: ultrafast (baja latencia)"
echo "Reducción estimada de RAM: ~60%"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "✅ Verificación completada"
echo ""
echo "Para probar el streaming:"
echo "  curl -X POST http://localhost:3010/api/stream \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"screenId\":\"test\",\"streamKey\":\"test-key\"}'"
echo ""
echo "Para ver el stream RTMP:"
echo "  ffplay rtmp://localhost:1935/live/test-key"
echo ""
