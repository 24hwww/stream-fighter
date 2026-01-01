# Guía de Despliegue en Coolify

## 🚀 Pasos para Desplegar en Coolify

### 1. Preparación del Repositorio

Asegúrate de que tu código esté en un repositorio Git (GitHub, GitLab, etc.)

### 2. Crear Aplicación en Coolify

1. Inicia sesión en tu instancia de Coolify
2. Ve a "Applications" → "New Application"
3. Selecciona "Docker Compose"
4. Conecta tu repositorio Git
5. Configura:
   - **Docker Compose File**: `docker-compose.coolify.yaml`
   - **Build Pack**: Docker Compose
   - **Port**: 3000 (para stream-screen)

### 3. Configurar Variables de Entorno

En el panel de Coolify, ve a "Environment Variables" y agrega:

#### Variables Requeridas

```bash
# Base de Datos
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
DIRECT_URL=postgresql://user:password@host:5432/database?schema=public

# OpenRouter AI
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# Socket.IO (URL pública de tu dominio)
NEXT_PUBLIC_SOCKET_URL=https://socket.tudominio.com
# O si está en el mismo dominio con path:
# NEXT_PUBLIC_SOCKET_URL=wss://tudominio.com

# RTMP
RTMP_URL=rtmp://restreamer:1935/live

# Stream Manager
NETWORK_NAME=stream-net
SCREEN_API_URL=http://stream-screen:3000/api/stream
```

#### Variables Opcionales

```bash
STREAM_KEY=tu-stream-key
NEXT_PUBLIC_DONATION_URL=https://paypal.me/yourid
```

### 4. Configuraciones Especiales

#### Para stream-screen

En la configuración avanzada de Coolify:

1. **Memoria**: Mínimo 2048MB (2GB)
2. **Privileged Mode**: ✅ Habilitar (necesario para Xvfb/PulseAudio)
3. **Shared Memory**: 512MB
4. **Health Check**: 
   - Path: `/api/health`
   - Interval: 30s

#### Para stream-manager

1. **Docker Socket**: ✅ Habilitar acceso a Docker socket
   - Esto permite que stream-manager gestione contenedores

#### Para restreamer

1. **Puertos personalizados**:
   - 8181 (Web UI)
   - 1935 (RTMP) - puede requerir configuración especial en Coolify

### 5. Configuración de Redes

Coolify crea automáticamente una red Docker. Los servicios se comunican usando:

- `stream-screen` → Nombre del servicio en Coolify
- `stream-socket` → Nombre del servicio en Coolify  
- `restreamer` → Nombre del servicio en Coolify
- `stream-manager` → Nombre del servicio en Coolify

**Importante**: Ajusta `NETWORK_NAME` en variables de entorno al nombre de red que Coolify asigne, o usa `stream-net` si está configurado en docker-compose.

### 6. URLs Públicas

Coolify puede generar URLs automáticas. Para las variables `NEXT_PUBLIC_*`:

1. **stream-screen**: URL pública generada por Coolify
   - Ejemplo: `https://stream-screen.tudominio.com`

2. **stream-socket**: Necesita URL pública para WebSocket
   - Ejemplo: `https://socket.tudominio.com`
   - O usar el mismo dominio con path: `wss://tudominio.com/socket`

3. **restreamer**: URL pública para la UI
   - Ejemplo: `https://restreamer.tudominio.com`

### 7. Base de Datos

#### Opción A: Supabase (Recomendado)

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Obtén la connection string de Settings → Database
4. Usa esa URL en `DATABASE_URL` y `DIRECT_URL`

#### Opción B: PostgreSQL en Coolify

1. Despliega PostgreSQL como servicio en Coolify
2. Crea la base de datos
3. Usa la URL interna de Coolify para conectar

### 8. Inicializar Base de Datos

Antes del primer despliegue, necesitas inicializar Prisma:

```bash
# Opción 1: Desde tu máquina local
cd stream-screen
npx prisma generate
npx prisma db push

# Opción 2: Ejecutar en contenedor después del primer build
docker exec -it <container-id> npx prisma db push
```

### 9. Desplegar

1. Haz clic en "Deploy" en Coolify
2. Espera a que todos los servicios estén saludables
3. Verifica los logs si hay errores

## 🔧 Troubleshooting en Coolify

### Error: "Cannot connect to database"

- Verifica que `DATABASE_URL` y `DIRECT_URL` sean correctos
- Asegúrate de que la base de datos sea accesible desde Coolify
- Si usas Supabase, verifica que el IP esté en la whitelist

### Error: "Xvfb failed to start"

- Verifica que "Privileged Mode" esté habilitado para stream-screen
- Revisa los logs del contenedor

### Error: "Docker socket access denied"

- Para stream-manager, habilita "Docker Socket" en configuración avanzada
- O considera deshabilitar stream-manager si no lo necesitas

### Error: "RTMP port not accessible"

- El puerto 1935 puede requerir configuración especial en Coolify
- Considera usar un servicio RTMP externo (Cloudflare Stream, etc.)

### Variables NEXT_PUBLIC_* no funcionan

- Estas variables deben estar configuradas ANTES del build
- Coolify las inyecta durante el build automáticamente
- Si cambias estas variables, necesitas rebuild

## 📊 Monitoreo

### Health Checks

Todos los servicios tienen health checks configurados:

- **stream-screen**: `http://localhost:3000/api/health`
- **stream-socket**: `http://localhost:3001/health`
- **restreamer**: `http://localhost:8181`

### Logs

Revisa los logs en Coolify para cada servicio:
- Logs de build (si hay errores de compilación)
- Logs de runtime (errores de ejecución)

## 🔐 Seguridad

### Recomendaciones

1. **Variables de entorno**: Nunca commitees el archivo `.env`
2. **API Keys**: Usa los secretos de Coolify para API keys sensibles
3. **Base de datos**: Usa conexiones SSL para producción
4. **RTMP**: Considera usar autenticación para RTMP streams

## 📝 Checklist de Despliegue en Coolify

- [ ] Repositorio Git configurado
- [ ] Aplicación Docker Compose creada en Coolify
- [ ] Variables de entorno configuradas
- [ ] Privileged mode habilitado (stream-screen)
- [ ] Docker socket habilitado (stream-manager)
- [ ] Base de datos configurada y accesible
- [ ] Prisma inicializado (db push ejecutado)
- [ ] URLs públicas configuradas
- [ ] Health checks pasando
- [ ] Logs sin errores críticos

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs en Coolify
2. Verifica las variables de entorno
3. Consulta `DEPLOYMENT.md` para más detalles
4. Revisa la documentación de Coolify: https://coolify.io/docs




