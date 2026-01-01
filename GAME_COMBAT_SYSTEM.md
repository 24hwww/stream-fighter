# Sistema de Combate - Stream Fighter

## 🎮 Cómo Funciona el Combate

### 📋 Flujo de Votos → Ataques

```mermaid
graph TD
    A[Usuario vota en /vote] --> B[PollService.registerVote()]
    B --> C[Registro en Base de Datos]
    C --> D[FighterStateService.updateCombat()]
    D --> E[Genera ataque aleatorio]
    E --> F[Actualiza HP del oponente]
    F --> G[FighterGame recibe actualización]
    G --> H[PixiRenderer muestra animación]
```

## 🔄 Mecánica de Combate

### 1. **Registro de Votos**
- Los usuarios votan por opción A o B en `/vote`
- Cada voto se registra en la base de datos
- Se invalida el cache de Redis para sincronización

### 2. **Procesamiento de Combate**
```javascript
// En FighterStateService.updateCombat()
if (deltaA > 0) {  // Si A recibió votos
    const actions = ['punch', 'kick', 'special'];
    state.fighterA.animation = actions[Math.floor(Math.random() * actions.length)];
    state.fighterB.hp = Math.max(0, state.fighterB.hp - (deltaA * 0.05));
}
```

### 3. **Ataques Aleatorios**
- **3 tipos de ataques**: `punch`, `kick`, `special`
- **Animación**: 400ms de duración
- **Cooldown**: 500ms entre acciones
- **Daño**: 5% de HP por voto

### 4. **Cálculo de HP**
```javascript
hp_fighterA = Math.max(0, 1.0 - (votos_B / total_votos));
hp_fighterB = Math.max(0, 1.0 - (votos_A / total_votos));
```

## 🎯 Estados de Luchadores

### Fighter State Structure
```javascript
{
    fighterA: {
        hp: 1.0,                    // 0.0 - 1.0
        lastHit: 1234567890,        // Timestamp
        animation: 'idle',          // 'idle', 'punch', 'kick', 'special'
        prevVotes: 5,               // Votos anteriores
        lastActionTime: 1234567890  // Cooldown tracking
    },
    fighterB: {
        hp: 0.8,
        lastHit: 1234567890,
        animation: 'punch',
        prevVotes: 3,
        lastActionTime: 1234567890
    }
}
```

## 🎬 Animaciones en Pixi.js

### Tipos de Ataques
1. **Punch (Puñetazo)**
   - Brazo derecho se extiende
   - Rotación: -1.4 radianes
   - Animación rápida

2. **Kick (Patada)**
   - Pierna derecha se levanta
   - Rotación: -1.5 radianes
   - Daño mayor visual

3. **Special (Especial)**
   - Ambos brazos se extienden
   - Rotación: -1.2 radianes cada uno
   - Efecto especial

### Efectos Visuales
- **Respiración**: Movimiento sutil constante
- **Daño**: Parpadeo blanco cuando HP < 40%
- **Flip**: Los luchadores se voltean horizontalmente
- **Bounce**: Movimiento vertical sinusoidal

## 🔌 Sincronización en Tiempo Real

### Socket.IO Events
- `vote`: Nuevo voto registrado
- `poll-refresh`: Poll actualizado
- `vote-update`: Actualización de votos

### Redis Storage
- Estado persistido por 1 hora (`EX`, 3600)
- Key pattern: `fighter:{pollId}`
- Sincronización entre múltiples instancias

## 🎮 Interfaz de Usuario

### FighterGame Component
```javascript
// Renderizado de luchadores
const renderState = {
    fighters: [
        { 
            x: 300, y: 550, 
            hp: fighterState.fighterA.hp, 
            flip: false, 
            action: fighterState.fighterA.animation 
        },
        { 
            x: 980, y: 550, 
            hp: fighterState.fighterB.hp, 
            flip: true, 
            action: fighterState.fighterB.animation 
        }
    ],
    timer: timeRemaining
};
```

### Overlays Visuales
- **Nombres de jugadores**: Esquina superior
- **Link de votación**: Parte inferior
- **Efectos CRT**: Simulación de monitor arcade
- **Loading screen**: Durante inicialización

## 🚀 Optimizaciones

### Performance
- **RequestAnimationFrame**: 60 FPS smooth
- **Redis**: Cache de estado para acceso rápido
- **Debouncing**: Evita spam de votos
- **State batching**: Actualizaciones en lotes

### Experiencia de Usuario
- **Retro styling**: Efectos CRT auténticos
- **Feedback inmediato**: Animaciones instantáneas
- **Responsive**: Se adapta a diferentes tamaños
- **Accessible**: Controles claros y simples

## 🔧 Configuración

### Variables de Entorno
```bash
# Redis para estado de combate
REDIS_URL=redis://redis:6379

# WebSocket para tiempo real
NEXT_PUBLIC_SOCKET_URL=http://localhost:3011
```

### Configuración de Pixi
```javascript
// Inicialización del renderizador
const renderer = new PixiRenderer(1280, 720);
await renderer.initialize(false); // Browser mode

// Configuración de canvas
renderer.app.canvas.style.imageRendering = "pixelated";
```

## 📊 Métricas de Rendimiento

### FPS
- **Target**: 30-60 FPS
- **Actual**: Variable según complejidad de animaciones
- **Fallback**: Si Pixi falla, usa Canvas Renderer

### Latencia
- **Voto → Animación**: ~100ms
- **Estado → Redis**: ~10ms
- **Socket → Cliente**: ~50ms

### Memoria
- **Estado por poll**: ~1KB en Redis
- **Animaciones**: ~10MB en memoria
- **Cleanup**: Automático tras expiración

---

## 🧪 Testing

### Comandos de Prueba
```bash
# Simular votos
curl -X POST http://localhost:3010/api/vote \
  -H 'Content-Type: application/json' \
  -d '{"pollId":"test","optionId":"optionA"}'

# Verificar estado
redis-cli GET fighter:test

# Monitorear logs
docker compose logs -f stream-screen | grep "FighterGame"
```

### Casos de Prueba
1. ✅ **Voto único**: Luchador A ataca a B
2. ✅ **Múltiples votos**: Daño acumulativo
3. ✅ **Cooldown**: No spam de ataques
4. ✅ **Animaciones**: Todos los tipos funcionan
5. ✅ **HP**: Cálculo correcto
6. ✅ **Sincronización**: Estado persiste en Redis

---

**Estado**: ✅ **Funcional**
**Última actualización**: 31/12/2025
**Componentes**: FighterGame + FighterStateService + PollService + PixiRenderer