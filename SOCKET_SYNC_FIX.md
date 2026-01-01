# 🔄 Corrección de Sincronización Socket.IO

## 🐛 Problema Identificado

La página de votación (`http://localhost:3010/vote`) no se sincronizaba correctamente con la página principal (`http://localhost:3010`) debido a:

1. **URLs inconsistentes del socket**: Diferentes componentes usaban diferentes URLs
2. **Eventos no sincronizados**: `poll-refresh` vs `poll-update` vs `vote-update`
3. **Configuración incorrecta**: Variables de entorno no aplicadas correctamente

## ✅ Correcciones Aplicadas

### 1. Helper Centralizado de Socket (`lib/socketClient.js`)

Creado un helper centralizado que:
- Detecta automáticamente si está en servidor o cliente
- Usa la URL correcta según el contexto
- Configura opciones de reconexión consistentes
- Maneja errores de conexión

### 2. Socket Server Mejorado (`stream-socket/index.js`)

- Ahora emite tanto `poll-refresh` como `vote-update` cuando hay cambios
- Propaga correctamente los eventos de votación
- Logs mejorados para debugging

### 3. Componentes Actualizados

Todos los componentes ahora usan `createSocketClient()`:
- `MobileVoting.jsx` - Página de votación
- `PollSection.jsx` - Sección de poll en overlay
- `Footer.jsx` - Footer con estadísticas
- `PollService.js` - Servicio backend

### 4. Variables de Entorno

Agregado en `docker-compose.yaml`:
```yaml
environment:
  - NEXT_PUBLIC_SOCKET_URL=http://10.0.0.15:3011
```

## 🔍 Flujo de Sincronización

### Cuando se registra un voto:

1. Cliente envía voto → `/api/vote` (POST)
2. `PollService.registerVote()` crea el voto en DB
3. `PollService` emite `vote` al socket server
4. Socket server recibe `vote` y emite:
   - `vote-update` → Actualiza contadores en todos los clientes
   - `poll-refresh` → Refresca el poll completo
5. Todos los clientes (overlay + página de votación) se actualizan

### Cuando se rota un poll:

1. `PollService.rotatePoll()` crea nuevo poll
2. `PollService` emite `poll-update` al socket server
3. Socket server recibe `poll-update` y emite:
   - `poll-refresh` → Refresca el poll en todos los clientes
   - `vote-update` → Actualiza contadores
4. Todos los clientes se actualizan

## 🧪 Verificación

### Verificar conexión del socket:

```bash
# Ver logs del socket server
docker compose logs stream-socket | grep -i "connect"

# Deberías ver:
# Client connected: <socket-id>
```

### Verificar sincronización:

1. Abrir `http://localhost:3010` (overlay)
2. Abrir `http://localhost:3010/vote` (página de votación)
3. Votar desde la página de votación
4. Verificar que el overlay se actualiza automáticamente

### Verificar eventos:

```bash
# Ver logs cuando hay votos
docker compose logs stream-socket | grep -i "vote"

# Deberías ver:
# Vote received: { pollId: ..., optionId: ... }
```

## 🔧 Configuración

### Variables de Entorno

```bash
# URL pública del socket (para clientes en navegador)
NEXT_PUBLIC_SOCKET_URL=http://10.0.0.15:3011

# O usar hostname automático (recomendado)
# Se detecta automáticamente desde window.location.hostname
```

### Puertos

- **Socket interno**: 3001 (dentro de Docker)
- **Socket externo**: 3011 (accesible desde host)
- **Stream-screen**: 3010 (exterior) → 3000 (interior)

## 📝 Eventos Socket.IO

### Eventos Emitidos por el Servidor:

- `vote-update`: Cuando hay un nuevo voto
- `poll-refresh`: Cuando hay un nuevo poll o actualización

### Eventos Escuchados por los Clientes:

- `vote-update`: Actualiza contadores de votos
- `poll-refresh`: Refresca el poll completo

## 🐛 Troubleshooting

### Los votos no se sincronizan

1. Verificar que el socket server esté corriendo:
   ```bash
   docker compose ps stream-socket
   ```

2. Verificar conexión en consola del navegador:
   ```javascript
   // En la consola del navegador
   // Deberías ver logs de conexión
   ```

3. Verificar logs del socket:
   ```bash
   docker compose logs stream-socket --tail=50
   ```

### El socket no se conecta

1. Verificar URL del socket:
   - Debe ser accesible desde el navegador
   - Si usas `localhost`, debe ser `http://localhost:3011`
   - Si usas IP de red, debe ser `http://10.0.0.15:3011`

2. Verificar CORS:
   - El socket server tiene CORS habilitado para `*`
   - No debería haber problemas de CORS

3. Verificar firewall:
   - El puerto 3011 debe estar abierto

### Los eventos no se propagan

1. Verificar que `PollService` esté emitiendo:
   ```bash
   docker compose logs stream-screen | grep -i "vote\|poll"
   ```

2. Verificar que el socket server esté recibiendo:
   ```bash
   docker compose logs stream-socket | grep -i "vote\|poll"
   ```

## ✅ Estado Actual

- ✅ Helper centralizado de socket creado
- ✅ Socket server mejorado con propagación correcta
- ✅ Todos los componentes actualizados
- ✅ Variables de entorno configuradas
- ✅ Reconexión automática habilitada
- ✅ Logs mejorados para debugging

La sincronización debería funcionar correctamente ahora. Los votos y actualizaciones de polls se propagan a todos los clientes conectados.




