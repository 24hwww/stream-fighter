# 🚨 ACCIONES REQUERIDAS PARA COOLIFY

## ⚡ Cambios Críticos Realizados

### 1. ✅ Archivo `docker-compose.prod.yaml` Actualizado

Se han corregido los siguientes problemas:

#### Health Checks Corregidos:
- **stream-socket**: Ahora verifica `http://localhost:3001/health` (antes fallaba)
- **restreamer**: Ahora verifica `http://localhost:8080` (puerto interno correcto)
- **redis**: Agregado health check con `redis-cli ping`

#### Configuraciones Agregadas:
- `start_period` aumentado para dar tiempo de inicialización
- Variables de entorno `CORE_RTMP_ENABLE` y `CORE_RTMP_APP` para Restreamer
- Variable `USE_CANVAS_RENDERER=true` para mejor rendimiento

### 2. ✅ Servidor de Sockets Refactorizado

El archivo `stream-socket/index.js` ha sido completamente reescrito para:
- Evitar el error `ERR_HTTP_HEADERS_SENT`
- Manejar correctamente las solicitudes HTTP y WebSocket
- Responder correctamente al health check en `/health`

### 3. ✅ Documentación Creada

- **COOLIFY_DEPLOYMENT.md**: Guía completa de despliegue
- **.env.example**: Plantilla actualizada con todas las variables
- **verify-coolify.sh**: Script de verificación post-despliegue

---

## 🎯 PASOS A SEGUIR EN COOLIFY

### Paso 1: Configurar Variables de Entorno

Ve a tu proyecto en Coolify → Environment Variables y configura:

#### ⚠️ CRÍTICO: NODE_ENV
```
Variable: NODE_ENV
Valor: production
✅ Available at Runtime
❌ Available at Buildtime (DESMARCA ESTO)
```

#### Base de Datos
```
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...
```

#### API Keys
```
OPENROUTER_API_KEY=sk-or-v1-...
```

#### URLs Públicas
```
NEXT_PUBLIC_SOCKET_URL=https://tu-dominio.com
```

### Paso 2: Verificar Configuración del Proyecto

1. **Docker Compose File**: Asegúrate de que esté configurado como `docker-compose.prod.yaml`
2. **Branch**: `main`
3. **Build Pack**: Docker Compose

### Paso 3: Hacer Push de los Cambios

```bash
git add .
git commit -m "Fix Coolify deployment: health checks and socket server"
git push origin main
```

### Paso 4: Redesplegar en Coolify

1. Ve a tu proyecto en Coolify
2. Click en "Deploy"
3. Espera a que termine el build (puede tomar 3-5 minutos)

### Paso 5: Verificar el Despliegue

Una vez desplegado, ejecuta desde tu servidor:

```bash
./verify-coolify.sh
```

O manualmente verifica:

```bash
# Ver contenedores
docker ps

# Ver logs
docker logs -f <container-name>

# Verificar health
docker inspect <container-id> | grep -A 10 Health
```

---

## 🔍 Diagnóstico de Errores Comunes

### Error: "stream-socket is unhealthy"

**Causa**: El contenedor no puede responder al health check.

**Solución**:
1. Verifica que el archivo `stream-socket/index.js` esté actualizado (debe tener la función de health check)
2. Revisa los logs: `docker logs <socket-container-id>`
3. Verifica que Redis esté healthy primero

### Error: "NODE_ENV=development skips devDependencies"

**Causa**: NODE_ENV está marcado como "Available at Buildtime".

**Solución**:
1. Ve a Environment Variables en Coolify
2. Edita `NODE_ENV`
3. **DESMARCA** "Available at Buildtime"
4. Guarda y redesplega

### Error: "restreamer is unhealthy"

**Causa**: Health check verificando puerto incorrecto.

**Solución**: Ya está corregido en `docker-compose.prod.yaml`. Solo necesitas redesplegar.

### Error: "Call retries were exceeded" durante npm run build

**Causa**: Conflicto con la configuración de Turbopack en Next.js.

**Solución**: Ya está corregido en el commit `73bd9e6f`. Los cambios incluyen:
1. Eliminación de la configuración `turbo` de `next.config.mjs`
2. Uso explícito de webpack en lugar de Turbopack
3. Corrección del formato ENV en el Dockerfile

Si aún ves este error:
1. Asegúrate de que Coolify esté usando el commit más reciente
2. Limpia la caché de build en Coolify (si está disponible)
3. Verifica que todas las variables de entorno estén configuradas correctamente

---

## 📊 Verificación de Éxito

Deberías ver:

```
✓ stream-screen (healthy)
✓ stream-socket (healthy)
✓ restreamer (healthy)
✓ redis (healthy)
```

Y poder acceder a:
- `https://tu-dominio.com/` → Interfaz principal
- `https://tu-dominio.com/vote` → Interfaz de votación
- `https://tu-dominio.com:8181` → Restreamer UI

---

## 🆘 Si Aún Tienes Problemas

1. **Revisa los logs en tiempo real**:
   ```bash
   docker logs -f <container-name>
   ```

2. **Verifica las variables de entorno**:
   ```bash
   docker exec <container-id> printenv
   ```

3. **Ejecuta el script de verificación**:
   ```bash
   ./verify-coolify.sh
   ```

4. **Consulta la documentación completa**:
   - `COOLIFY_DEPLOYMENT.md`
   - `.env.example`

---

**Última actualización**: 2026-01-02
**Commit requerido**: b977ce8 o posterior
