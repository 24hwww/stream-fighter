# 🚀 Guía de Despliegue en Coolify - Stream Fighter

## 📋 Configuración Previa

### 1. Variables de Entorno Requeridas

Configura las siguientes variables de entorno en el panel de Coolify:

#### Variables de Base de Datos (Runtime + Buildtime)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/database
```

#### Variables de API (Runtime + Buildtime)
```bash
OPENROUTER_API_KEY=tu_api_key_aqui
```

#### Variables de Red (Runtime + Buildtime)
```bash
NEXT_PUBLIC_SOCKET_URL=https://tu-dominio.com  # URL pública de tu aplicación
INTERNAL_SOCKET_URL=http://stream-socket:3001
RTMP_URL=rtmp://restreamer:1935/live
```

#### Variables de Entorno de Node.js
⚠️ **IMPORTANTE**: Configura estas variables SOLO como **Runtime** (desmarca "Available at Buildtime"):
```bash
NODE_ENV=production
```

### 2. Configuración del Proyecto en Coolify

1. **Tipo de Proyecto**: Docker Compose
2. **Archivo Docker Compose**: `docker-compose.prod.yaml`
3. **Branch**: `main`
4. **Build Pack**: Docker Compose

### 3. Configuraciones Especiales

#### Privilegios del Contenedor
El servicio `stream-screen` requiere:
- ✅ **Privileged Mode**: Habilitado
- ✅ **Capabilities**: `SYS_ADMIN`
- ✅ **Devices**: `/dev/snd` (para audio)

#### Recursos Recomendados
```yaml
stream-screen:
  memory: 2048MB
  cpu: 2 cores
  
stream-socket:
  memory: 256MB
  
restreamer:
  memory: 512MB
  
redis:
  memory: 128MB
```

## 🔧 Solución de Problemas

### Error: "container stream-socket is unhealthy"

**Causa**: El health check está verificando el puerto o endpoint incorrecto.

**Solución**: Asegúrate de que `docker-compose.prod.yaml` tenga:
```yaml
stream-socket:
  healthcheck:
    test: [ "CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health" ]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 20s
```

### Error: "NODE_ENV=development skips devDependencies"

**Causa**: La variable `NODE_ENV` está configurada como "Available at Buildtime".

**Solución**:
1. Ve a la configuración de variables de entorno en Coolify
2. Busca `NODE_ENV`
3. **Desmarca** "Available at Buildtime"
4. Deja solo "Available at Runtime"

### Error: "restreamer is unhealthy"

**Causa**: El health check está verificando el puerto 8181 en lugar del 8080 interno.

**Solución**: El archivo `docker-compose.prod.yaml` ya está corregido para usar el puerto 8080:
```yaml
restreamer:
  healthcheck:
    test: [ "CMD", "wget", "--spider", "-q", "http://localhost:8080" ]
```

## 📊 Verificación Post-Despliegue

### 1. Verificar Contenedores
```bash
docker ps
```

Deberías ver 4 contenedores corriendo:
- `stream-screen` (healthy)
- `stream-socket` (healthy)
- `restreamer` (healthy)
- `redis` (healthy)

### 2. Verificar Logs
```bash
# Stream Screen
docker logs -f <container-id-stream-screen>

# Socket Server
docker logs -f <container-id-stream-socket>

# Restreamer
docker logs -f <container-id-restreamer>
```

### 3. Verificar Endpoints

#### Health Checks
- Stream Screen: `https://tu-dominio.com/api/health` → debe retornar 200
- Socket Server: `http://localhost:3001/health` → debe retornar "OK"
- Restreamer UI: `https://tu-dominio.com:8181` → debe cargar la interfaz

#### Funcionalidad
- Página Principal: `https://tu-dominio.com/` → debe mostrar el juego
- Votación: `https://tu-dominio.com/vote` → debe mostrar la interfaz de votación
- Stream RTMP: `rtmp://tu-dominio.com:1935/live/pantalla`

## 🔄 Proceso de Actualización

1. **Push al repositorio**:
   ```bash
   git add .
   git commit -m "Update configuration"
   git push origin main
   ```

2. **Coolify detectará automáticamente** el cambio y comenzará el redespliegue.

3. **Monitorear el despliegue** en el panel de Coolify.

## 🎯 Checklist de Despliegue

- [ ] Variables de entorno configuradas correctamente
- [ ] `NODE_ENV` configurado SOLO como Runtime
- [ ] Privileged mode habilitado para `stream-screen`
- [ ] Health checks configurados correctamente
- [ ] Base de datos accesible y sincronizada (Prisma)
- [ ] Todos los contenedores en estado "healthy"
- [ ] Endpoints de salud respondiendo correctamente
- [ ] Interfaz de votación accesible
- [ ] Stream RTMP funcionando

## 📝 Notas Adicionales

### Inicialización de Base de Datos
Si es el primer despliegue, asegúrate de que Prisma sincronice el esquema:
```bash
# Esto se ejecuta automáticamente en el start.sh del contenedor
npx prisma db push
```

### Rotación Automática
El sistema está configurado para rotar automáticamente cada 3 minutos:
- Timer de combate: 180 segundos
- Delay post-combate: 8 segundos
- Generación de nuevo poll: automática

### Monitoreo
- Redis almacena el estado del combate con TTL de 1 hora
- Socket.io emite actualizaciones cada 200ms (5 FPS)
- FFmpeg transmite a 30 FPS con preset ultrafast

---

**Última actualización**: 2026-01-02
**Versión**: 1.0.0
