# 🔧 Corrección del Puerto del Socket

## 🐛 Problema

El cliente está intentando conectarse a `localhost:3001` pero el socket está en el puerto `3011` (puerto externo).

**Error:**
```
GET http://localhost:3001/socket.io/?EIO=4&transport=polling net::ERR_CONNECTION_REFUSED
```

## ✅ Solución Aplicada

### 1. Código Corregido (`lib/socketClient.js`)

El código ahora usa el puerto correcto `3011` como fallback:

```javascript
if (typeof window !== 'undefined') {
    // Cliente (navegador)
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
        socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    } else {
        const hostname = window.location.hostname;
        socketUrl = `http://${hostname}:3011`; // ✅ Puerto correcto
    }
}
```

### 2. Configuración en `next.config.mjs`

Agregado para exponer variables de entorno:

```javascript
env: {
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_SOCKET_PORT: process.env.NEXT_PUBLIC_SOCKET_PORT || '3011',
},
```

## 🔄 Pasos para Aplicar la Corrección

### Opción 1: Reconstruir la Imagen (Recomendado)

```bash
# Reconstruir la imagen con los cambios
docker compose -f docker-compose.yaml build stream-screen

# Reiniciar el servicio
docker compose -f docker-compose.yaml up -d stream-screen
```

### Opción 2: Solución Temporal (Sin Reconstruir)

Si el build está fallando, puedes forzar la URL del socket en el navegador:

1. Abre la consola del navegador (F12)
2. Ejecuta:
```javascript
// Esto forzará la URL correcta
localStorage.setItem('socket_url', 'http://localhost:3011');
```

Luego recarga la página.

### Opción 3: Usar Variable de Entorno en Build

Asegúrate de que `NEXT_PUBLIC_SOCKET_URL` esté disponible durante el build:

```bash
# En docker-compose.yaml ya está configurado:
environment:
  - NEXT_PUBLIC_SOCKET_URL=http://10.0.0.15:3011
```

Pero esto solo funciona si se reconstruye la imagen.

## 🔍 Verificación

Después de reconstruir, verifica en la consola del navegador:

1. Abre `http://localhost:3010/vote`
2. Abre la consola (F12)
3. Deberías ver:
   ```
   [SocketClient] Using fallback URL: http://localhost:3011
   [SocketClient] Connected: <socket-id> to http://localhost:3011
   ```

Si ves `localhost:3001`, el código compilado todavía tiene la URL antigua y necesitas reconstruir.

## 📝 Notas

- Las variables `NEXT_PUBLIC_*` se inyectan en **build time**, no en runtime
- El código fuente ya está corregido, pero el código compilado necesita ser reconstruido
- El fallback usa el puerto `3011` que es el puerto externo correcto
- El puerto interno del socket es `3001` (dentro de Docker)
- El puerto externo del socket es `3011` (accesible desde el host)

## 🚀 Estado Actual

- ✅ Código fuente corregido
- ✅ Fallback al puerto correcto (3011)
- ⚠️ Necesita reconstruir la imagen para aplicar cambios
- ⚠️ Build actualmente fallando (posible problema con dependencias)





