# Guía de Configuración - Stream Fighter

## 🚀 Configuración Rápida

### 1. Variables de Entorno
Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

### 2. Dependencias
Instala las dependencias en el directorio `stream-screen`:

```bash
cd stream-screen
npm install
```

### 3. Base de Datos
Inicializa la base de datos con Prisma:

```bash
npx prisma generate
npx prisma db push
```

## 🔧 Configuración de Desarrollo

### Docker Compose
Para desarrollo local, usa el archivo `docker-compose.yaml`:

```bash
docker compose up --build
```

### Variables Clave para Desarrollo

```bash
# Entorno
NODE_ENV=development
WATCHPACK_POLLING=true

# Renderizado
USE_CANVAS_RENDERER=true

# URLs
NEXT_PUBLIC_SOCKET_URL=http://localhost:3011
NEXT_PUBLIC_SOCKET_PORT=3011

# Redes
NETWORK_IP=localhost
```

## 🏗️ Configuración de Producción

### Optimizaciones Clave

1. **Canvas Renderer**: Habilitado por defecto para mejor rendimiento
2. **FFmpeg**: Configurado con preset `ultrafast` para baja latencia
3. **Memoria**: Límites optimizados por servicio
4. **Health Checks**: Intervalos ajustados para reducir overhead

### Variables para Producción

```bash
# Entorno
NODE_ENV=production

# Optimización de recursos
USE_CANVAS_RENDERER=true
WATCHPACK_POLLING=false

# URLs públicas
NEXT_PUBLIC_SOCKET_URL=https://tu-dominio.com
NEXT_PUBLIC_SOCKET_PORT=443

# Redes
NETWORK_IP=tu-ip-publica
```

## 🐳 Docker Optimizado

### Recursos por Servicio

| Servicio | RAM | CPU | Comentario |
|----------|-----|-----|------------|
| stream-screen | 1.5GB | 2 cores | Frontend + API + Streaming |
| stream-socket | 128MB | 0.5 cores | WebSocket Server |
| restreamer | 512MB | 1 core | RTMP Server |
| redis | 64MB | 0.25 cores | Cache y Pub/Sub |

### Permisos Especiales

Para desarrollo local, el contenedor `stream-screen` necesita:
- `privileged: true` para Xvfb y PulseAudio
- Acceso a dispositivos de audio: `/dev/snd`
- Capabilities: `SYS_ADMIN`

## 🎨 Renderizado

### Canvas Renderer (Recomendado)
- ✅ Sin overhead de navegador
- ✅ Control total del rendering
- ✅ 30 FPS consistentes
- ✅ Menor uso de memoria

### PIXI Renderer
- ✅ Animaciones 2D sofisticadas
- ✅ Compatible cliente/servidor
- ✅ WebGL y Canvas backends
- ✅ Ideal para gráficos detallados

### Chromium Renderer (Fallback)
- Configurar `USE_CANVAS_RENDERER=false`
- Mayor consumo de recursos
- Necesita Chromium instalado

## 🔌 Integraciones

### OpenRouter AI
Para generación automática de polls:

```bash
OPENROUTER_API_KEY=tu-api-key
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

### Supabase
Para base de datos PostgreSQL:

```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

### Redis
Para caché y WebSocket:

```bash
REDIS_URL=redis://redis:6379
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Canvas no funciona**: Verificar que `USE_CANVAS_RENDERER=true`
2. **Socket no conecta**: Verificar `NEXT_PUBLIC_SOCKET_URL`
3. **Base de datos no conecta**: Verificar `DATABASE_URL` y `DIRECT_URL`
4. **Alta latencia**: Verificar preset de FFmpeg en logs

### Comandos de Verificación

```bash
# Verificar health checks
curl http://localhost:3010/api/health
curl http://localhost:3011/health

# Verificar recursos
docker stats

# Verificar logs
docker compose logs stream-screen
```

## 📊 Monitoreo

### Métricas Clave
- Uso de CPU y RAM por servicio
- Latencia de streaming (<2s objetivo)
- Conexiones WebSocket activas
- Uso de memoria Redis

### Logs Importantes
- FFmpeg: `docker compose logs stream-screen | grep FFmpeg`
- WebSocket: `docker compose logs stream-socket`
- Errores: `docker compose logs --tail=100`

## 🔄 Actualizaciones

### Dependencias
```bash
# Actualizar dependencias
cd stream-screen
npm update

# Regenerar Prisma
npx prisma generate
```

### Docker
```bash
# Reconstruir imágenes
docker compose build --no-cache

# Reiniciar servicios
docker compose restart
```

## 📚 Documentación Adicional

- [README.md](./README.md) - Documentación general
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Guía de despliegue
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura del sistema