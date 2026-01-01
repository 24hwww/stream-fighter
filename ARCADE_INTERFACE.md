# 🎮 Stream Fighter - Arcade Fighting Game Interface

## 🎯 Nueva Interfaz de Votación

La interfaz de votación ha sido completamente rediseñada con un estilo **retro arcade** inspirado en juegos de pelea clásicos como Street Fighter y Mortal Kombat.

---

## ✨ Características Implementadas

### 🕹️ Interfaz Arcade Retro
- **Pantalla CRT** con efecto de scanlines
- **Pixel art fighters** animados
- **Escenario de pelea** con fondo desértico/arena
- **Barras de salud** que cambian según los votos
- **Cuenta regresiva de 5 minutos** con cambio de color
- **Botones arcade** estilo máquina recreativa

### 🤖 Generación Inteligente de Personajes
La IA ahora genera matchups icónicos y emocionantes:

**Categorías disponibles:**
- **Music**: Michael Jackson vs Prince, Beyoncé vs Madonna, etc.
- **Movies**: Batman vs Superman, Arnold vs Stallone, etc.
- **Sports**: Messi vs Ronaldo, Lakers vs Bulls, etc.
- **Gaming**: Mario vs Sonic, Link vs Cloud, etc.
- **General**: Cualquier batalla épica de cultura pop

### ⚡ Sincronización en Tiempo Real
- **WebSocket** para actualizaciones instantáneas
- **Votos en vivo** reflejados en las barras de salud
- **Rotación automática** cada 5 minutos
- **Animaciones** de personajes basadas en votos

---

## 🚀 Cómo Usar

### Acceder a la Interfaz de Votación

```
http://localhost:3010/vote
```

### Generar Nuevo Poll Manualmente

```bash
# Generar poll de música
curl -X POST http://localhost:3010/api/poll/generate \
  -H "Content-Type: application/json" \
  -d '{"category":"Music"}'

# Generar poll de películas
curl -X POST http://localhost:3010/api/poll/generate \
  -H "Content-Type: application/json" \
  -d '{"category":"Movies"}'

# Generar poll general
curl -X POST http://localhost:3010/api/poll/generate \
  -H "Content-Type: application/json" \
  -d '{"category":"General"}'
```

### Votar

Los usuarios pueden votar haciendo clic en los **botones arcade** debajo de la pantalla:
- **Botón Rojo** (izquierda): Fighter 1
- **Botón Azul** (derecha): Fighter 2

---

## 🎨 Elementos Visuales

### Pantalla de Juego
```
┌─────────────────────────────────────────────────────────┐
│  [HEALTH BAR 1]    ROUND 1    [HEALTH BAR 2]           │
│     SCORE: 0        5:00         SCORE: 0              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│     🌴                🏛️                🌴             │
│                                                         │
│    🥊 Fighter 1              Fighter 2 🥊              │
│   (Pixel Art)                (Pixel Art)               │
│                                                         │
│  ═══════════════════════════════════════════════════   │
└─────────────────────────────────────────────────────────┘
```

### Botones de Control
```
┌──────────────────────┐  ┌──────────────────────┐
│   🔴 FIGHTER 1       │  │   🔵 FIGHTER 2       │
│   Michael Jackson    │  │   Prince             │
│   ████████░░ 80%     │  │   ████░░░░░░ 20%     │
│   120 votes          │  │   30 votes           │
└──────────────────────┘  └──────────────────────┘
```

---

## 🔧 Configuración

### Variables de Entorno

```bash
# IA para generar personajes
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct

# WebSocket para sincronización
NEXT_PUBLIC_SOCKET_URL=http://localhost:3011
INTERNAL_SOCKET_URL=http://stream-socket:3001

# Base de datos
DATABASE_URL=postgresql://...
```

### Personalizar Categorías

Editar `stream-screen/lib/ai.js`:

```javascript
const categoryPrompts = {
    "Music": "Generate epic music battle...",
    "Movies": "Generate movie character battle...",
    "Sports": "Generate sports legend battle...",
    "Gaming": "Generate video game battle...",
    "Custom": "Your custom prompt here...",
};
```

---

## 📊 Flujo de Datos

```
Usuario → Click en botón
    ↓
POST /api/vote
    ↓
PollService.registerVote()
    ↓
Socket.emit("vote")
    ↓
Redis Cache Update
    ↓
Todos los clientes reciben actualización
    ↓
Barras de salud se actualizan
```

---

## 🎯 Rotación Automática de Polls

### Cada 5 minutos:
1. El poll actual expira
2. Se desactiva en la base de datos
3. La IA genera un nuevo matchup
4. Se crea un nuevo poll
5. Socket notifica a todos los clientes
6. La pantalla se actualiza con nuevos fighters

### Proceso de Generación:
```javascript
// 1. Seleccionar categoría (aleatorio o específico)
const category = "Music";

// 2. IA genera matchup
const matchup = await generateNewPoll(category);
// Resultado: {
//   optionA: { name: "Michael Jackson", ... },
//   optionB: { name: "Prince", ... }
// }

// 3. Crear poll en DB
const poll = await PollService.rotatePoll(category);

// 4. Notificar clientes
socket.emit("poll-refresh", poll);
```

---

## 🎮 Tecnologías Utilizadas

- **Phaser.js 3**: Motor de juego 2D para renderizado
- **Next.js 16**: Framework React
- **Socket.io**: WebSocket para tiempo real
- **Prisma**: ORM para base de datos
- **OpenRouter AI**: Generación de personajes
- **Redis**: Cache de alta velocidad
- **Tailwind CSS**: Estilos de UI

---

## 🐛 Troubleshooting

### El juego no se carga
```bash
# Verificar que Phaser está instalado
npm list phaser

# Reinstalar si es necesario
npm install phaser --legacy-peer-deps
```

### Los votos no se actualizan
```bash
# Verificar WebSocket
curl http://localhost:3011/health

# Ver logs de socket
docker compose logs -f stream-socket
```

### La IA no genera personajes
```bash
# Verificar API key
echo $OPENROUTER_API_KEY

# Probar generación manual
curl -X POST http://localhost:3010/api/poll/generate \
  -H "Content-Type: application/json" \
  -d '{"category":"General"}'
```

### Pantalla en blanco
```bash
# Verificar consola del navegador (F12)
# Verificar que el poll existe
curl http://localhost:3010/api/poll
```

---

## 🎨 Personalización Avanzada

### Cambiar Colores de Fighters

Editar `components/arcade/FighterGame.jsx`:

```javascript
// Línea ~200
const fighter1 = createPixelFighter(
    scene, 200, height - 200, 
    0xff4444, // ← Cambiar color (hex)
    poll.optionA.name, 
    "left"
);
```

### Añadir Más Animaciones

```javascript
// En createPixelFighter()
scene.tweens.add({
    targets: container,
    rotation: 0.1,
    duration: 100,
    yoyo: true,
    repeat: 0
});
```

### Cambiar Tiempo de Poll

Editar `services/PollService.js`:

```javascript
// Línea ~64
expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
```

---

## 📈 Métricas y Analytics

### Endpoints Útiles

```bash
# Poll actual
GET /api/poll

# Generar nuevo poll
POST /api/poll/generate

# Registrar voto
POST /api/vote
{
  "pollId": "...",
  "optionId": "..."
}

# Health check
GET /api/health
```

---

## 🚀 Próximas Mejoras

### Corto Plazo
- [ ] Sprites personalizados por personaje
- [ ] Efectos de sonido retro
- [ ] Animaciones de golpes cuando se vota
- [ ] Combo counter para votos consecutivos

### Mediano Plazo
- [ ] Sistema de rounds múltiples
- [ ] Avatares generados con IA
- [ ] Modo torneo con bracket
- [ ] Leaderboard de fighters más votados

### Largo Plazo
- [ ] Modo multijugador en tiempo real
- [ ] NFTs de fighters ganadores
- [ ] Integración con Twitch/YouTube chat
- [ ] Machine learning para predecir ganadores

---

## 📝 Notas de Desarrollo

### Estructura de Archivos
```
stream-screen/
├── components/
│   └── arcade/
│       └── FighterGame.jsx       # Componente principal
├── app/
│   ├── vote/
│   │   └── page.js                # Página de votación
│   └── api/
│       ├── poll/
│       │   ├── route.js           # GET poll actual
│       │   └── generate/
│       │       └── route.js       # POST generar poll
│       └── vote/
│           └── route.js           # POST votar
├── lib/
│   └── ai.js                      # Generación IA
└── services/
    └── PollService.js             # Lógica de polls
```

---

## 🎉 Conclusión

La nueva interfaz de votación transforma Stream Fighter en una experiencia arcade retro completa, con:

✅ **Estética retro** auténtica  
✅ **Generación inteligente** de matchups  
✅ **Sincronización en tiempo real**  
✅ **Rotación automática** cada 5 minutos  
✅ **Animaciones fluidas** con Phaser.js  

**¡Disfruta de la arena de batalla!** 🥊🎮

---

**Creado por:** Antigravity AI  
**Fecha:** 2025-12-31  
**Versión:** 3.0 - Arcade Edition
