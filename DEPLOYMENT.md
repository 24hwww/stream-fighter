# Análisis de Despliegue - Stream Fighter

## 📋 Resumen del Proyecto

**Stream Fighter** es una aplicación de streaming 24/7 que permite transmitir contenido a múltiples plataformas sin OBS. El proyecto utiliza una arquitectura de microservicios con Docker Compose.

## 🏗️ Arquitectura del Sistema

### Servicios Identificados

1. **stream-screen** (Next.js)
   - Puerto: 3000 (interno), 3010 (exterior)
   - Framework: Next.js 16.1.1
   - Base de datos: PostgreSQL (Supabase) con Prisma ORM
   - Funcionalidad: Interfaz web principal, overlay de streaming, gestión de polls/votaciones
   - Recursos: 1-2GB RAM, requiere Chromium, FFmpeg, Xvfb, PulseAudio

2. **stream-socket** (Node.js)
   - Puerto: 3001 (interno), 3011 (exterior)
   - Funcionalidad: Servidor WebSocket para votaciones en tiempo real
   - Recursos: 256MB RAM

3. **stream-manager** (Node.js/Express)
   - Puerto: 3020
   - Funcionalidad: API para gestionar streams dinámicos
   - Requisitos especiales: Acceso a Docker socket (`/var/run/docker.sock`)
   - Recursos: 512MB RAM

4. **restreamer** (Datarhei Restreamer)
   - Puertos: 8080/8181 (web), 1935 (RTMP)
   - Imagen: `datarhei/restreamer:2.6.1` o `latest`
   - Funcionalidad: Servidor RTMP para retransmisión
   - Recursos: 512MB RAM
   - Volúmenes: `restreamer-data`

5. **streamer** (Opcional - Generador de contenido)
   - Funcionalidad: Genera contenido automático usando Chromium + FFmpeg
   - Dependencias: stream-screen y restreamer deben estar saludables
   - Recursos: 1GB RAM

## 🔐 Variables de Entorno Requeridas

### Variables Globales (.env en raíz)

```bash
# Base de Datos (PostgreSQL/Supabase)
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
DIRECT_URL="postgresql://user:password@host:5432/database?schema=public"

# OpenRouter AI (para generación de polls)
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="google/gemini-2.0-flash-001"

# Stream Configuration
STREAM_KEY="your-stream-key-here"
RTMP_URL="rtmp://restreamer:1935/live"

# Socket.IO (URL pública del socket server)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3011"  # Local
# NEXT_PUBLIC_SOCKET_URL="https://socket.tudominio.com"  # Producción

# Donación (opcional)
NEXT_PUBLIC_DONATION_URL="https://paypal.me/yourid"

# Stream Manager
NETWORK_NAME="stream-net"  # o "stream-fighter_default"
SCREEN_API_URL="http://stream-screen:3000/api/stream"
```

### Variables por Servicio

#### stream-screen
- `DATABASE_URL` (requerido)
- `DIRECT_URL` (requerido)
- `OPENROUTER_API_KEY` (requerido)
- `OPENROUTER_MODEL` (opcional, default: `google/gemini-2.0-flash-001`)
- `STREAM_KEY` (opcional, para auto-start)
- `RTMP_URL` (opcional, default: `rtmp://restreamer:1935/live`)
- `NEXT_PUBLIC_SOCKET_URL` (requerido para votaciones)
- `NEXT_PUBLIC_DONATION_URL` (opcional)

#### stream-socket
- `PORT` (opcional, default: 3001)

#### stream-manager
- `RTMP_URL` (opcional, default: `rtmp://restreamer:1935/live`)
- `NETWORK_NAME` (opcional, default: `stream-fighter_default`)
- `SCREEN_API_URL` (opcional, default: `http://stream-screen:3000/api/stream`)

#### streamer
- `TARGET_URL` (default: `http://stream-screen:3010`)
- `RTMP_URL` (default: `rtmp://restreamer:1935/live`)
- `STREAM_KEY` (requerido si se usa)

## 🚀 Despliegue Local

### Prerrequisitos

- Docker y Docker Compose instalados
- PostgreSQL (local o Supabase)
- Al menos 4GB de RAM disponible
- 10GB de espacio en disco

### Pasos para Despliegue Local

1. **Clonar y configurar**
```bash
cd stream-fighter
cp .env.example .env  # Si existe, o crear manualmente
```

2. **Configurar variables de entorno**
Editar `.env` con tus credenciales:
```bash
DATABASE_URL="postgresql://usuario:password@localhost:5432/stream_fighter"
DIRECT_URL="postgresql://usuario:password@localhost:5432/stream_fighter"
OPENROUTER_API_KEY="tu-api-key"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3011"
```

3. **Inicializar base de datos**
```bash
cd stream-screen
npx prisma generate
npx prisma db push
cd ..
```

4. **Construir e iniciar servicios**
```bash
docker compose -f docker-compose.yaml up --build
```

5. **Acceder a los servicios**
- Overlay: http://localhost:3010
- Restreamer UI: http://localhost:8181
- Stream Manager API: http://localhost:3020
- Socket Server: ws://localhost:3011

### Notas para Despliegue Local

- El archivo `docker-compose.yaml` es más completo que `docker-compose.yml`
- Usar `docker-compose.yaml` para mejor configuración de redes y healthchecks
- El servicio `streamer` es opcional y solo se ejecuta si está configurado

## ☁️ Despliegue en Coolify

### Consideraciones para Coolify

Coolify es una plataforma de despliegue que gestiona aplicaciones Docker. Para este proyecto, hay varias opciones:

#### Opción 1: Despliegue como Aplicación Docker Compose (Recomendado)

Coolify soporta aplicaciones Docker Compose directamente.

1. **Crear nueva aplicación en Coolify**
   - Tipo: Docker Compose
   - Repositorio: URL de tu repositorio Git
   - Docker Compose File: `docker-compose.yaml`

2. **Configurar variables de entorno en Coolify**
   - Ir a la sección de Environment Variables
   - Agregar todas las variables del archivo `.env`

3. **Configuraciones especiales necesarias**

   **Para stream-manager:**
   - Habilitar "Docker Socket" en las opciones avanzadas
   - O configurar un volumen: `/var/run/docker.sock:/var/run/docker.sock`

   **Para stream-screen:**
   - Aumentar memoria a mínimo 2GB
   - Habilitar "Privileged Mode" (puede ser necesario para Xvfb/PulseAudio)
   - O configurar capabilities: `SYS_ADMIN`, `SYS_RESOURCE`

4. **Redes Docker**
   - Coolify crea su propia red, ajustar `NETWORK_NAME` en variables de entorno
   - O usar la red por defecto de Coolify

#### Opción 2: Despliegue Individual de Servicios

Desplegar cada servicio como aplicación separada en Coolify.

**stream-screen:**
```yaml
# Dockerfile ya existe en stream-screen/
# Variables de entorno necesarias:
- DATABASE_URL
- DIRECT_URL
- OPENROUTER_API_KEY
- NEXT_PUBLIC_SOCKET_URL
- RTMP_URL
```

**stream-socket:**
```yaml
# Dockerfile ya existe en stream-socket/
# Puerto: 3001
# Variables: PORT (opcional)
```

**stream-manager:**
```yaml
# Dockerfile ya existe en stream-manager/
# Puerto: 3020
# Requiere: Docker socket access
# Variables: RTMP_URL, NETWORK_NAME, SCREEN_API_URL
```

**restreamer:**
```yaml
# Usar imagen: datarhei/restreamer:2.6.1
# Puertos: 8181 (web), 1935 (RTMP)
# Volumen: restreamer-data
```

### Configuración de Redes en Coolify

Los servicios necesitan comunicarse entre sí. Opciones:

1. **Usar nombres de servicio internos de Coolify**
   - Coolify asigna nombres basados en el nombre de la aplicación
   - Ejemplo: `stream-screen-app`, `stream-socket-app`
   - Ajustar URLs en variables de entorno

2. **Usar variables de entorno para URLs internas**
   ```bash
   SCREEN_API_URL="http://stream-screen-app:3000/api/stream"
   NEXT_PUBLIC_SOCKET_URL="https://socket.tudominio.com"  # URL pública
   RTMP_URL="rtmp://restreamer-app:1935/live"
   ```

### Problemas Conocidos y Soluciones

#### 1. Docker Socket en stream-manager
**Problema:** stream-manager necesita acceso al socket de Docker
**Solución:** 
- En Coolify, habilitar "Docker Socket" en configuración avanzada
- O usar un servicio externo para gestión de streams

#### 2. Permisos para Xvfb/PulseAudio
**Problema:** stream-screen necesita permisos especiales para Xvfb
**Solución:**
- Habilitar "Privileged Mode" en Coolify
- O ajustar capabilities del contenedor

#### 3. Puerto 1935 (RTMP) en Coolify
**Problema:** Coolify puede no exponer puertos UDP/TCP personalizados fácilmente
**Solución:**
- Configurar reverse proxy para RTMP
- O usar un servicio RTMP externo (Cloudflare Stream, etc.)

#### 4. Base de datos
**Problema:** Necesita PostgreSQL accesible
**Solución:**
- Usar Supabase (recomendado)
- O desplegar PostgreSQL en Coolify
- O usar servicio PostgreSQL externo

#### 5. Variables NEXT_PUBLIC_*
**Problema:** Variables `NEXT_PUBLIC_*` deben estar disponibles en build time
**Solución:**
- Configurar todas las variables antes del build
- Coolify las inyecta automáticamente durante el build

### Archivo de Configuración Recomendado para Coolify

Crear `docker-compose.coolify.yaml`:

```yaml
version: "3.9"

services:
  stream-screen:
    build:
      context: ./stream-screen
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env
    restart: unless-stopped
    mem_limit: 2048m
    shm_size: '512mb'
    privileged: true  # Necesario para Xvfb
    healthcheck:
      test: [ "CMD", "curl", "-f", "http://localhost:3000/api/health" ]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - stream-net

  stream-socket:
    build:
      context: ./stream-socket
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    restart: unless-stopped
    mem_limit: 256m
    healthcheck:
      test: [ "CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3001/health" ]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - stream-net

  stream-manager:
    build:
      context: ./stream-manager
      dockerfile: Dockerfile
    ports:
      - "3020:3020"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - RTMP_URL=rtmp://restreamer:1935/live
      - NETWORK_NAME=stream-net
      - SCREEN_API_URL=http://stream-screen:3000/api/stream
    restart: unless-stopped
    mem_limit: 512m
    networks:
      - stream-net

  restreamer:
    image: datarhei/restreamer:2.6.1
    ports:
      - "8181:8181"
      - "1935:1935"
    volumes:
      - restreamer-data:/core/data
    restart: unless-stopped
    mem_limit: 512m
    healthcheck:
      test: [ "CMD", "wget", "--spider", "http://localhost:8181" ]
      interval: 30s
      timeout: 10s
      retries: 5
    networks:
      - stream-net

volumes:
  restreamer-data:

networks:
  stream-net:
    driver: bridge
```

## 📝 Checklist de Despliegue

### Pre-despliegue
- [ ] Variables de entorno configuradas
- [ ] Base de datos PostgreSQL creada y accesible
- [ ] API key de OpenRouter obtenida
- [ ] Repositorio Git configurado (para Coolify)

### Despliegue Local
- [ ] Docker y Docker Compose instalados
- [ ] Archivo `.env` creado y configurado
- [ ] Base de datos inicializada con Prisma
- [ ] Servicios construidos correctamente
- [ ] Healthchecks pasando

### Despliegue Coolify
- [ ] Aplicación Docker Compose creada en Coolify
- [ ] Variables de entorno configuradas en Coolify
- [ ] Docker socket habilitado (para stream-manager)
- [ ] Privileged mode habilitado (para stream-screen)
- [ ] Puertos configurados correctamente
- [ ] Redes configuradas para comunicación entre servicios
- [ ] URLs públicas configuradas (para NEXT_PUBLIC_*)

## 🔍 Troubleshooting

### Problema: stream-screen no inicia
- Verificar variables de entorno (especialmente DATABASE_URL)
- Verificar que Prisma esté generado: `npx prisma generate`
- Revisar logs: `docker compose logs stream-screen`

### Problema: No se pueden crear streams
- Verificar que restreamer esté saludable
- Verificar RTMP_URL en variables de entorno
- Verificar que stream-manager tenga acceso a Docker socket

### Problema: Votaciones no funcionan
- Verificar que stream-socket esté corriendo
- Verificar NEXT_PUBLIC_SOCKET_URL apunta a la URL correcta
- Verificar CORS en stream-socket

### Problema: Base de datos no conecta
- Verificar DATABASE_URL y DIRECT_URL
- Verificar que la base de datos esté accesible desde el contenedor
- Ejecutar migraciones: `npx prisma db push`

## 📚 Recursos Adicionales

- [Documentación de Coolify](https://coolify.io/docs)
- [Documentación de Restreamer](https://docs.restreamer.io/)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Next.js](https://nextjs.org/docs)

