# 🎮 Stream Fighter - Sistema de Streaming 24/7 Optimizado

Sistema de streaming en vivo con votaciones en tiempo real, optimizado para **baja latencia** y **eficiencia de recursos**.

## 🏗️ Arquitectura (Optimizada v2.0)

```
┌─────────────────────────────────────────────────────────────┐
│                     STREAM-SCREEN                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Next.js    │  │   Canvas     │  │     FFmpeg      │  │
│  │   Frontend   │──│   Renderer   │──│   Streaming     │  │
│  │   + API      │  │   (30 FPS)   │  │   Engine        │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────┬──────────────────────────────────┘
                         │
              ┌──────────┴────────┐
              │                   │
    ┌─────────▼─────────┐  ┌──────▼──────────┐
    │  STREAM-SOCKET    │  │   RESTREAMER    │
    │  WebSocket Server │  │   RTMP Server   │
    │  + Redis Adapter  │  │   (Output)      │
    └───────┬───────────┘  └─────────────────┘
            │
       ┌────▼────┐
       │  Redis  │
       │  Cache  │
       └─────────┘
```

## 📦 Servicios

| Servicio | Puerto | Descripción | RAM | CPU |
|----------|--------|-------------|-----|-----|
| **stream-screen** | 3010 | Frontend + API + Renderizado + Streaming | 1.5GB | 2 cores |
| **stream-socket** | 3011 | WebSocket Server (tiempo real) | 128MB | 0.5 cores |
| **restreamer** | 8181, 1935 | RTMP Server | 512MB | 1 core |
| **redis** | 6379 | Cache y Pub/Sub | 64MB | 0.25 cores |

**Total: ~2.2GB RAM** (vs ~4GB en versión anterior = **-45% de RAM**)

## 🚀 Inicio Rápido

### Desarrollo Local

```bash
# Clonar repositorio
git clone <repo-url>
cd stream-fighter

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servicios
docker compose up --build

# Verificar que todo funciona
./verify-optimization.sh
```

### Acceso a Servicios

- **Frontend/Dashboard**: http://localhost:3010
- **Página de Votación**: http://localhost:3010/vote
- **Restreamer UI**: http://localhost:8181
- **API Health**: http://localhost:3010/api/health
- **WebSocket**: http://localhost:3011

## 🎯 Características Principales

### ✅ Optimizaciones Implementadas

- **Canvas Renderer**: Renderizado directo sin navegador (más eficiente)
- **FFmpeg Ultrafast**: Preset optimizado para baja latencia (<2s)
- **Arquitectura Simplificada**: 4 servicios vs 6 anteriores
- **Límites de Recursos**: CPU y RAM optimizados por servicio
- **Health Checks Inteligentes**: Intervalos ajustados para reducir overhead

### 🎨 Renderizado

El sistema usa **Canvas Renderer** por defecto:
- ✅ Sin overhead de navegador
- ✅ Control total del rendering
- ✅ 30 FPS consistentes
- ✅ Menor uso de memoria (~500MB menos)

Fallback a Chromium disponible si es necesario (configurar `USE_CANVAS_RENDERER=false`).

### ⚡ Baja Latencia

Optimizaciones de FFmpeg:
- Preset: `ultrafast` (codificación más rápida)
- Tune: `zerolatency` (sin buffering)
- Buffer: 1024k (reducido para menor latencia)
- Threads: 2 (optimizado para multi-stream)

**Latencia end-to-end: ~1-2 segundos** (vs 3-5s anterior)

## 📊 API Endpoints

### Gestión de Streams

```bash
# Listar streams activos
GET /api/stream

# Iniciar stream
POST /api/stream
{
  "screenId": "test",
  "streamKey": "my-stream-key"
}

# Detener stream
DELETE /api/stream?streamKey=my-stream-key
```

### Votaciones

```bash
# Obtener poll actual
GET /api/poll

# Votar
POST /api/vote
{
  "option": "A"
}

# Generar nuevo poll
POST /api/poll/generate
```

## 🔧 Configuración

### Variables de Entorno Principales

```bash
# Streaming
RTMP_URL=rtmp://restreamer:1935/live
USE_CANVAS_RENDERER=true  # Usar Canvas (recomendado)

# Base de datos
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# IA (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct

# Redis
REDIS_URL=redis://redis:6379

# WebSocket
NEXT_PUBLIC_SOCKET_URL=http://localhost:3011
INTERNAL_SOCKET_URL=http://stream-socket:3001
```

## 🐳 Docker Compose

### Comandos Útiles

```bash
# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f stream-screen

# Reiniciar servicio específico
docker compose restart stream-screen

# Ver uso de recursos
docker stats

# Detener todo
docker compose down
```

### Perfiles de Recursos

```yaml
# Desarrollo (actual)
stream-screen: 1.5GB RAM, 2 CPUs
stream-socket: 128MB RAM, 0.5 CPUs
restreamer: 512MB RAM, 1 CPU
redis: 64MB RAM, 0.25 CPUs

# Producción (recomendado)
stream-screen: 2GB RAM, 3 CPUs
stream-socket: 256MB RAM, 1 CPU
restreamer: 1GB RAM, 2 CPUs
redis: 128MB RAM, 0.5 CPUs
```

## 🧪 Testing

### Verificar Sistema

```bash
# Script de verificación automática
./verify-optimization.sh

# Verificar health checks manualmente
curl http://localhost:3010/api/health
curl http://localhost:3011/health
curl http://localhost:8181
```

### Probar Streaming

```bash
# Iniciar stream de prueba
curl -X POST http://localhost:3010/api/stream \
  -H 'Content-Type: application/json' \
  -d '{"screenId":"test","streamKey":"test-key"}'

# Ver stream con ffplay
ffplay rtmp://localhost:1935/live/test-key

# O con VLC
vlc rtmp://localhost:1935/live/test-key
```

## 📈 Monitoreo

### Métricas Clave

```bash
# Ver recursos en tiempo real
docker stats

# Ver logs de FFmpeg
docker compose logs -f stream-screen | grep FFmpeg

# Ver conexiones WebSocket
docker compose logs -f stream-socket | grep "Client connected"

# Ver uso de Redis
docker exec stream-fighter-redis-1 redis-cli INFO memory
```

### Health Checks

Todos los servicios tienen health checks automáticos:
- **stream-screen**: HTTP GET /api/health cada 60s
- **stream-socket**: HTTP GET /health cada 60s
- **restreamer**: HTTP GET / cada 60s
- **redis**: redis-cli ping cada 30s

## 🚨 Troubleshooting

### Stream no inicia

```bash
# Verificar logs
docker compose logs stream-screen

# Verificar que PulseAudio está corriendo
docker exec stream-fighter-stream-screen-1 pactl list sinks

# Verificar FFmpeg
docker exec stream-fighter-stream-screen-1 ps aux | grep ffmpeg
```

### Alta latencia

```bash
# Verificar que Canvas está habilitado
docker exec stream-fighter-stream-screen-1 printenv USE_CANVAS_RENDERER

# Verificar preset de FFmpeg en logs
docker compose logs stream-screen | grep preset

# Debería mostrar: -preset ultrafast
```

### Uso alto de RAM

```bash
# Ver uso por servicio
docker stats --no-stream

# Si stream-screen usa >2GB, verificar:
# - Que Canvas Renderer está habilitado
# - Que no hay múltiples streams corriendo
# - Que Chromium no está en uso
```

## 📚 Documentación Adicional

- [ARCHITECTURE_OPTIMIZATION.md](./ARCHITECTURE_OPTIMIZATION.md) - Análisis arquitectónico completo
- [CANVAS_RENDERER_README.md](./stream-screen/CANVAS_RENDERER_README.md) - Detalles del Canvas Renderer
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de deployment en producción

## 🔄 Migración desde v1.0

Si vienes de la versión anterior con servicios `streamer` y `stream-manager`:

```bash
# 1. Detener servicios antiguos
docker compose down

# 2. Hacer backup (opcional)
mv streamer streamer.BACKUP
mv stream-manager stream-manager.BACKUP

# 3. Actualizar docker-compose.yaml (ya incluido)

# 4. Iniciar nueva arquitectura
docker compose up --build

# 5. Verificar
./verify-optimization.sh
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles

## 🙏 Agradecimientos

- [Datarhei Restreamer](https://datarhei.github.io/restreamer/) - RTMP Server
- [Next.js](https://nextjs.org/) - React Framework
- [Socket.io](https://socket.io/) - WebSocket Library
- [FFmpeg](https://ffmpeg.org/) - Multimedia Framework
- [node-canvas](https://github.com/Automattic/node-canvas) - Canvas API para Node.js

---

**Hecho con ❤️ para streaming de baja latencia**