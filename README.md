# Predicta

Plataforma de quinielas privadas y personalizables, centrada en el Mundial 2026 y diseñada para escalar a cualquier torneo.

**Dominio:** [predictaclub.com](https://predictaclub.com)  
**Stack actual:** React 19 · Vite 6 · TypeScript · Firebase (Auth + Firestore) · CSS nativo  
**Estado:** MVP jugable — Auth, ligas, predicciones, clasificación e invitaciones con QR.

---

## Registro de progreso

Actualizado: **7 jun 2026**

### Completado

| Fase | Estado | Detalle |
|------|--------|---------|
| 0 — Fundamentos | ✅ | `react-router-dom`, carpetas modulares, rutas URL |
| 1 — Auth | ✅ | Login/registro email, Google, perfiles en `users/{uid}`, rutas protegidas |
| 2 — Ligas CRUD (parcial) | ✅ | Crear liga en Firestore, listar mis ligas, código de invitación |
| 3 — Invitaciones (parcial) | ✅ | `/unirse/:codigo`, preview, unirse, copiar/compartir link |
| 5 — Predicciones (parcial) | ✅ | Inputs editables, guardar en Firestore, cierre por kickoff |
| 4 — Partidos reales (parcial) | ✅ | API [worldcup26.ir](https://worldcup26.ir) integrada (104 partidos, estadios, estados) |
| Diseño | ✅ | UI reestructurada (tipografía Oswald + IBM Plex, estilo broadcast) |
| Firebase config | ✅ | `.env` con proyecto `clutch-330a9`, reglas iniciales en `firestore.rules` |

### En progreso / con fallos conocidos corregidos

| Item | Notas |
|------|-------|
| Índice Firestore `collectionGroup` | **Corregido** — se reemplazó por `users/{uid}/leagueMemberships` (sin índice especial) |
| API worldcup26.ir "Load failed" en Safari | **Corregido** — proxy Vite en dev + respaldo en `public/data/` si CORS bloquea el navegador |
| Verificación de código único | **Corregido** — colección `inviteCodes/{code}` en lugar de query sobre `leagues` |
| Errores mezclados en UI | **Corregido** — `loadError` y `saveError` separados en contexto de ligas |

### Pendiente (siguiente trabajo)

| Fase | Prioridad | Qué falta |
|------|-----------|-----------|
| 3 — Invitaciones | ~~Alta~~ Parcial | Falta: buscar usuario por email, QR |
| 5 — Predicciones | ~~Alta~~ Parcial | Falta: ver predicciones de otros tras cierre, guardado por partido |
| 6 — Puntuación | Media | Calcular puntos al actualizar resultados de la API |
| 7 — Pulido beta | Media | Estados vacíos, toasts, PWA, analytics |

### Desplegar reglas Firestore (obligatorio)

Cada vez que cambien `firestore.rules`, publicar en Firebase Console o con:

```bash
firebase deploy --only firestore:rules
```

---

## Tabla de contenidos

1. [Visión del producto](#visión-del-producto)
2. [Estado actual](#estado-actual)
3. [Arquitectura objetivo](#arquitectura-objetivo)
4. [Esquema de Firestore](#esquema-de-firestore)
5. [Reglas de negocio](#reglas-de-negocio)
6. [Plan de implementación por fases](#plan-de-implementación-por-fases)
7. [Autenticación y perfiles](#autenticación-y-perfiles)
8. [Sistema de invitaciones](#sistema-de-invitaciones)
9. [Datos del torneo (partidos)](#datos-del-torneo-partidos)
10. [Seguridad Firestore](#seguridad-firestore)
11. [UX y accesibilidad pendientes](#ux-y-accesibilidad-pendientes)
12. [Infraestructura y despliegue](#infraestructura-y-despliegue)
13. [Testing](#testing)
14. [Checklist pre-lanzamiento](#checklist-pre-lanzamiento)
15. [Arranque local](#arranque-local)

---

## Visión del producto

Predicta permite que un **administrador** cree una liga privada, configure cómo se puntúan las predicciones, invite participantes y siga una clasificación en tiempo real durante un torneo.

### Flujo principal

```
Admin crea liga → Invita participantes → Cada jornada marca predicciones
→ Partido inicia (cierre automático) → Sistema calcula puntos → Clasificación actualizada
```

### Personalización por liga

| Configuración | Opciones |
|---------------|----------|
| Nombre y premio | Texto libre definido por el admin |
| Ganadores premiados | 1–10 (o más) |
| Modo de puntuación | Solo resultado · Marcador exacto · Híbrido (resultado + bonus exacto) |
| Puntos | Configurables por liga (`resultPoints`, `exactBonus`) |
| Múltiples ligas | Un usuario puede participar en varias a la vez |

### Roles

- **Admin de liga:** crea la liga, edita reglas (antes del inicio), gestiona invitaciones, puede expulsar miembros.
- **Participante:** envía y edita predicciones (hasta el kickoff), ve clasificación y reglas.
- **Super-admin (futuro):** gestión de torneos globales, moderación, soporte.

---

## Estado actual

### Lo que ya funciona

| Área | Completitud | Detalle |
|------|-------------|---------|
| Diseño visual | ~90% | Paleta oficial, responsive, 7 rutas |
| Navegación | ~95% | `react-router-dom` con URLs reales |
| Auth | ~90% | Email + Google, sesión persistente, `/entrar` |
| Ligas | ~60% | Crear y listar en Firestore; falta unirse por código |
| Partidos | ~80% | 104 partidos desde `worldcup26.ir`; cierre por horario |
| Predicciones | ~75% | Guardar/cargar por usuario; falta ver predicciones ajenas post-cierre |
| Clasificación | ~10% | Demo estática en `mockData.ts` |
| Lógica de puntos | 0% | Solo tipos y reglas en copy |
| Invitaciones | ~20% | Código generado; falta flujo de unión |

### Rutas implementadas

| Ruta | Archivo | Función real hoy |
|------|---------|------------------|
| `/` | `LandingPage` | Hero + preview de partidos reales |
| `/entrar` | `LoginPage` | Login, registro, Google |
| `/mis-ligas` | `DashboardPage` | Ligas del usuario desde Firestore |
| `/crear` | `CreateLeaguePage` | Crea liga real en Firestore |
| `/predicciones` | `PredictionsPage` | Partidos abiertos (solo lectura) |
| `/clasificacion` | `LeaderboardPage` | Ranking demo |
| `/reglas` | `RulesPage` | Reglas de la liga seleccionada |

### Deuda técnica inmediata

- Monolito de ~535 líneas en un solo `App.tsx` — sin separación en páginas, componentes ni hooks.
- Sin `react-router-dom` — imposible compartir links a una liga o vista específica.
- Sin contexto de usuario autenticado.
- Sin validación de formularios.
- Sin manejo de errores ni estados de carga.
- `vite-env.d.ts` no declara variables `VITE_FIREBASE_*`.
- Sin reglas de Firestore ni Cloud Functions en el repo.

---

## Arquitectura objetivo

### Estructura de carpetas recomendada

```
src/
├── app/                    # Providers, router, layout shell
├── components/
│   ├── ui/                 # Botones, inputs, modales reutilizables
│   ├── league/             # LeagueCard, InviteBox, ScoringPicker
│   ├── match/              # MatchRow, PredictionForm, ScoreInput
│   └── leaderboard/        # LeaderRow, Podium
├── pages/                  # Landing, Dashboard, CreateLeague, etc.
├── hooks/                  # useAuth, useLeague, usePredictions
├── services/
│   ├── auth.ts
│   ├── leagues.ts
│   ├── predictions.ts
│   ├── matches.ts          # Catálogo del torneo (Mundial 2026)
│   └── scoring.ts          # Cálculo puro de puntos
├── context/                # AuthContext, LeagueContext
├── types/                  # Tipos de dominio + Firestore converters
├── utils/                  # fechas, códigos de invitación, clipboard
├── data/                   # Seeds temporales (eliminar en producción)
└── firebase.ts
```

### Dependencias a añadir

| Paquete | Motivo |
|---------|--------|
| `react-router-dom` | Rutas URL, deep linking (`/liga/:id`, `/unirse/:code`) |
| `react-hook-form` + `zod` | Validación de formularios |
| `date-fns` o `dayjs` | Cierre de predicciones por hora de kickoff |
| `@tanstack/react-query` (opcional) | Cache y sincronización con Firestore |

### Rutas objetivo

```
/                           → Landing (pública)
/entrar                     → Login / registro
/crear                      → Crear liga (auth requerida)
/mis-ligas                  → Dashboard del usuario
/liga/:leagueId             → Vista principal de una liga
/liga/:leagueId/predicciones
/liga/:leagueId/clasificacion
/liga/:leagueId/reglas
/liga/:leagueId/config      → Solo admin
/unirse/:inviteCode         → Flujo de unión a liga
/perfil                     → Nombre, avatar, ligas activas
```

---

## Esquema de Firestore

### Colecciones

#### `users/{userId}`

```typescript
{
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `leagues/{leagueId}`

```typescript
{
  name: string;
  prize: string;
  winners: number;
  scoringMode: "result" | "exact" | "hybrid";
  resultPoints: number;
  exactBonus: number;
  adminId: string;           // uid del creador
  inviteCode: string;        // único, indexado
  tournamentId: string;        // ej. "world-cup-2026"
  status: "draft" | "active" | "finished";
  memberCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `leagues/{leagueId}/members/{userId}`

```typescript
{
  userId: string;
  displayName: string;
  role: "admin" | "member";
  points: number;
  exactHits: number;
  joinedAt: Timestamp;
}
```

#### `leagues/{leagueId}/predictions/{userId}_{matchId}`

```typescript
{
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  pointsEarned?: number;     // calculado post-partido
  submittedAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `tournaments/{tournamentId}`

Metadatos del torneo (Mundial 2026, Liga MX futura, etc.).

#### `tournaments/{tournamentId}/matches/{matchId}`

```typescript
{
  group: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamCode: string;      // ISO / FIFA code para banderas
  awayTeamCode: string;
  kickoffAt: Timestamp;      // crítico para cierre automático
  venue: string;
  stage: "group" | "r16" | "qf" | "sf" | "final";
  homeScore?: number;        // resultado oficial
  awayScore?: number;
  status: "scheduled" | "live" | "finished" | "postponed";
}
```

#### `invitations/{inviteId}` (opcional)

Para invitaciones directas por email/usuario:

```typescript
{
  leagueId: string;
  invitedBy: string;
  invitedUserId?: string;
  email?: string;
  status: "pending" | "accepted" | "expired";
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

### Índices compuestos necesarios

- `leagues` → `inviteCode` (único)
- `leagues/{id}/members` → `points` DESC (clasificación)
- `leagues/{id}/predictions` → `userId` + `matchId`
- `tournaments/{id}/matches` → `kickoffAt` ASC

---

## Reglas de negocio

### Modos de puntuación

Implementar en `src/services/scoring.ts` como funciones puras y testeables:

#### `result` — Solo acertar quién gana o empate

```
Si predicción.homeScore > predicción.awayScore Y resultado.home > resultado.away → +resultPoints
Si predicción.homeScore < predicción.awayScore Y resultado.home < resultado.away → +resultPoints
Si predicción.homeScore === predicción.awayScore Y resultado.home === resultado.away → +resultPoints
En otro caso → 0
```

#### `exact` — Solo marcador exacto

```
Si predicción coincide exactamente con resultado → +resultPoints (o valor dedicado)
En otro caso → 0
```

#### `hybrid` — Resultado + bonus exacto

```
Puntos por acertar resultado (como en `result`) → +resultPoints
Si además el marcador es exacto → +exactBonus adicional
```

### Cierre de predicciones

- Una predicción **no se puede crear ni editar** después de `match.kickoffAt`.
- El frontend debe deshabilitar inputs; el backend (reglas Firestore) debe **rechazar escrituras** tardías.
- Mostrar countdown "Cierra en X horas" cuando falte poco.

### Cálculo de clasificación

**Opción A (recomendada para MVP):** Cloud Function que se dispara al actualizar `homeScore`/`awayScore` en un partido:

1. Obtiene todas las predicciones de ese `matchId` en todas las ligas del torneo (o por liga).
2. Calcula puntos según `scoringMode` de cada liga.
3. Actualiza `predictions.pointsEarned` y suma en `members.points` / `members.exactHits`.

**Opción B:** Cálculo en cliente al cargar (solo para prototipo; no confiar en producción).

### Desempates (definir antes del lanzamiento)

Orden sugerido:

1. Más puntos totales
2. Más marcadores exactos
3. Más aciertos de resultado
4. Quien se unió primero a la liga

Documentar esto en la pantalla de Reglas.

---

## Plan de implementación por fases

### Fase 0 — Fundamentos (1–2 semanas)

**Objetivo:** Proyecto estructurado y Firebase conectado.

- [ ] Reorganizar carpetas según arquitectura objetivo
- [ ] Añadir `react-router-dom` y migrar las 6 vistas a rutas URL
- [ ] Configurar `.env` con proyecto Firebase real
- [ ] Tipar `ImportMetaEnv` en `vite-env.d.ts`
- [ ] Crear proyecto Firebase: Auth, Firestore, Hosting
- [ ] Desplegar reglas Firestore mínimas (deny-all → permitir con auth)

**Criterio de done:** App arranca, rutas funcionan, Firebase inicializa sin errores.

---

### Fase 1 — Autenticación y perfiles (1 semana)

**Objetivo:** Usuarios reales con identidad persistente.

- [ ] Pantallas `/entrar`: registro e inicio con email/contraseña
- [ ] OAuth Google (mínimo para reducir fricción)
- [ ] `AuthContext` + `onAuthStateChanged`
- [ ] Crear documento `users/{uid}` al primer login
- [ ] Pantalla `/perfil`: editar `displayName`, ver ligas
- [ ] Rutas protegidas: redirigir a `/entrar` si no hay sesión
- [ ] Header muestra usuario logueado, no botón "Entrar" genérico

**Criterio de done:** Usuario puede registrarse, cerrar sesión, recargar y mantener sesión.

---

### Fase 2 — Ligas CRUD (1–2 semanas)

**Objetivo:** Crear, listar y gestionar ligas reales.

- [ ] Servicio `createLeague()` → escribe en `leagues/` + `members/{adminId}` con rol admin
- [ ] Generar `inviteCode` único (6–8 caracteres, sin ambigüedad: sin 0/O, 1/I)
- [ ] `listMyLeagues()` — query por membresía del usuario
- [ ] Dashboard carga ligas del usuario, no mock
- [ ] Formulario crear liga validado (nombre requerido, winners 1–20, puntos ≥ 0)
- [ ] Editar reglas solo si liga en `draft` o antes del primer partido
- [ ] Eliminar liga (solo admin, confirmación)

**Criterio de done:** Liga creada persiste en Firestore y aparece en "Mis ligas" tras recargar.

---

### Fase 3 — Invitaciones y membresía (1 semana)

**Objetivo:** Unirse a ligas de forma sencilla.

- [ ] Ruta `/unirse/:inviteCode` — busca liga, muestra preview, botón "Unirme"
- [ ] `joinLeague()` — crea `members/{userId}`, incrementa `memberCount`
- [ ] Copiar código al portapapeles (`navigator.clipboard`)
- [ ] Compartir link nativo (`navigator.share`) con fallback a copiar URL
- [ ] Buscar usuario por email/displayName e invitar (colección `invitations`)
- [ ] Prevenir unión duplicada y ligas llenas (si se define límite)
- [ ] Admin puede expulsar miembro

**Criterio de done:** Usuario B se une con link/código y aparece en la liga de Usuario A.

---

### Fase 4 — Catálogo de partidos Mundial 2026 (1–2 semanas)

**Objetivo:** Partidos reales con fechas de cierre.

- [ ] Importar calendario oficial FIFA (JSON seed o script de carga)
- [ ] Poblar `tournaments/world-cup-2026/matches/`
- [ ] UI de partidos lee del catálogo, no de mock
- [ ] Mostrar banderas (SVG o emoji por código FIFA)
- [ ] Agrupar por jornada / fase
- [ ] Admin de torneo (futuro): actualizar resultados oficiales

**Fuente de datos:** API pública (ej. football-data.org, API-Football) o dataset estático actualizado manualmente para MVP.

**Criterio de done:** Dashboard muestra partidos del torneo con kickoff real.

---

### Fase 5 — Predicciones y cierre (1–2 semanas)

**Objetivo:** Flujo central del producto funcional.

- [ ] Formulario editable de marcadores (inputs numéricos 0–15)
- [ ] `savePrediction()` — upsert en `leagues/{id}/predictions/`
- [ ] Validar: no negativos, no editar si `now >= kickoffAt`
- [ ] UI: estado "Abierto" / "Cerrado" / "Finalizado" por partido
- [ ] Guardado automático o botón "Guardar jornada" con feedback
- [ ] Ver predicciones de otros participantes **solo después** del cierre del partido (privacidad)
- [ ] Reglas Firestore que bloqueen escritura post-kickoff

**Criterio de done:** Usuario guarda predicción, recarga, y no puede editarla tras el kickoff.

---

### Fase 6 — Puntuación y clasificación (1 semana)

**Objetivo:** Ranking automático y confiable.

- [ ] Implementar `scoring.ts` con tests unitarios
- [ ] Cloud Function `onMatchResultUpdated` calcula puntos
- [ ] Actualizar `members.points` y `members.exactHits`
- [ ] Leaderboard lee de Firestore ordenado por puntos
- [ ] Indicador de tendencia (comparar posición vs jornada anterior)
- [ ] Resaltar ganadores según `league.winners`
- [ ] Pantalla de desglose: "¿Por qué tengo X puntos en este partido?"

**Criterio de done:** Al ingresar resultado de un partido, la clasificación se actualiza sola.

---

### Fase 7 — Pulido pre-beta (1–2 semanas)

**Objetivo:** Listo para usuarios reales.

- [ ] Estados vacíos ("Aún no tienes ligas", "No hay partidos esta jornada")
- [ ] Loading skeletons y manejo de errores con mensajes claros
- [ ] Toasts de confirmación (guardado, copiado, unido)
- [ ] PWA básica (manifest + iconos) para "añadir a inicio" en móvil
- [ ] SEO: meta tags, Open Graph para links de invitación
- [ ] Analytics (Firebase Analytics o Plausible)
- [ ] Página de términos y privacidad (requerido si hay registro)
- [ ] Modo claro opcional (la paleta lo permite: 60% blanco/gris)

**Criterio de done:** 5 usuarios externos completan el flujo sin ayuda.

---

### Fase 8 — Post-Mundial / escalabilidad (futuro)

- [ ] Soporte multi-torneo (Liga MX, Champions, etc.)
- [ ] Ligas públicas vs privadas
- [ ] Notificaciones push (FCM): "Cierra en 1h el México vs USA"
- [ ] Chat o comentarios por liga
- [ ] Exportar clasificación a PDF/CSV
- [ ] Panel super-admin
- [ ] Internacionalización (i18n)

---

## Autenticación y perfiles

### Métodos recomendados (orden de prioridad)

1. **Google OAuth** — menor fricción para grupos de amigos
2. **Email + contraseña** — para quien no usa Google
3. **Magic link** (opcional) — sin contraseña

### Datos mínimos de perfil

- `displayName` (obligatorio, editable)
- `email` (de Auth)
- Avatar opcional (Google photo o upload a Firebase Storage)

### Consideraciones

- No permitir acciones de liga sin `displayName` configurado
- Sincronizar `displayName` en `members` al actualizar perfil (o resolver en lectura)

---

## Sistema de invitaciones

### Métodos a implementar

| Método | Implementación |
|--------|----------------|
| Link directo | `https://predictaclub.com/unirse/CODIGO` |
| Código corto | Input en pantalla "Unirme a una liga" |
| Buscar usuario | Query `users` por email (con privacidad: solo si acepta invitaciones) |
| Compartir nativo | Web Share API en móvil |

### UX recomendada

- Al crear liga: modal "¡Lista! Comparte este link" con copiar + compartir
- QR code opcional para grupos presenciales
- Preview antes de unirse: nombre liga, admin, N participantes, premio

---

## Datos del torneo (partidos)

### Mundial 2026 — consideraciones

- 48 equipos, 104 partidos, 3 países sede
- Fechas en zona horaria del usuario (mostrar en local, guardar UTC)
- Fases: grupos → dieciseisavos → octavos → cuartos → semifinal → final

### Estrategia MVP

1. **Seed estático** en JSON commiteado → script `npm run seed:matches` carga a Firestore
2. Actualizar resultados manualmente vía consola o mini-panel admin
3. **Fase 2:** integrar API externa con cron diario

### Campos críticos

`kickoffAt` es el campo más importante: todo el cierre de predicciones depende de él.

---

## Seguridad Firestore

### Principios

- Nunca confiar en validación solo del cliente
- Usuario solo lee/escribe lo que le corresponde
- Admin de liga ≠ super-admin del sistema

### Reglas esquemáticas (borrador)

```javascript
// users: solo el propio usuario
match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

// leagues: miembros leen; solo admin crea/edita config
match /leagues/{leagueId} {
  allow read: if isMember(leagueId);
  allow create: if request.auth != null;
  allow update: if isAdmin(leagueId);
}

// predictions: solo el autor, solo antes del kickoff
match /leagues/{leagueId}/predictions/{predId} {
  allow read: if isMember(leagueId) && (isPastKickoff(predId) || resource.data.userId == request.auth.uid);
  allow write: if isMember(leagueId)
    && request.resource.data.userId == request.auth.uid
    && !isPastKickoff(request.resource.data.matchId);
}
```

### Archivos a crear

```
firestore.rules
firestore.indexes.json
functions/                  # Cloud Functions para scoring
```

---

## UX y accesibilidad pendientes

### Interacciones hoy sin implementar

- [ ] Copiar código de invitación
- [ ] Compartir liga
- [ ] Editar predicción
- [ ] Guardar borrador / crear liga real
- [ ] Cerrar sesión
- [ ] Notificaciones de error de red

### Accesibilidad (WCAG 2.1 AA)

- [ ] Contraste verificado en naranja sobre azul (botones CTA)
- [ ] Navegación por teclado en formularios de marcador
- [ ] `aria-live` para actualizaciones de clasificación
- [ ] Labels en todos los inputs (parcialmente hecho)
- [ ] Focus visible consistente (ya hay en inputs)
- [ ] No depender solo de color para estados (añadir texto/icono)

### Mobile-first

- La quiniela se usará mayormente en celular durante partidos
- Inputs de marcador grandes (mín. 44×44px touch target) ✓ parcial
- Bottom sheet para predicciones en móvil (mejora futura)

---

## Infraestructura y despliegue

### Firebase Hosting (recomendado)

```bash
npm run build
firebase deploy --only hosting
```

### Variables de entorno

Copiar `.env.example` → `.env`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Dominio

- Configurar `predictaclub.com` en Firebase Hosting
- SSL automático

### Costos estimados (MVP)

- Firebase Spark (gratis): suficiente para beta con <1000 usuarios
- Blaze si se usan Cloud Functions intensivamente

---

## Testing

### Unitarios (prioridad alta)

- `scoring.ts` — todos los modos y casos borde (empates, 0-0, goleadas)
- Generación de `inviteCode` — unicidad y formato
- Utilidades de fecha/kickoff

### Integración

- Flujo crear liga → unirse → predecir → calcular puntos (con emulador Firestore)

### E2E (opcional para beta)

- Playwright: registro, crear liga, enviar predicción

### Herramientas sugeridas

- Vitest + Testing Library
- Firebase Emulator Suite (`auth`, `firestore`, `functions`)

---

## Checklist pre-lanzamiento

### Funcional

- [ ] Registro e inicio de sesión funcionan
- [ ] Crear liga persiste
- [ ] Invitación por link funciona entre 2+ usuarios reales
- [ ] Predicciones se guardan y bloquean al kickoff
- [ ] Puntos se calculan correctamente (validado con casos manuales)
- [ ] Clasificación ordenada con desempates documentados
- [ ] Admin puede ver todos los miembros

### Seguridad

- [ ] Reglas Firestore desplegadas y probadas con emulador
- [ ] No se puede editar predicción ajena
- [ ] No se puede unir sin código válido
- [ ] Variables de entorno fuera del repo

### Legal / producto

- [ ] Política de privacidad
- [ ] Términos de uso
- [ ] Aviso: no es apuesta con dinero real (si aplica en tu jurisdicción)

### Performance

- [ ] Lighthouse Performance > 80 en móvil
- [ ] First load < 3s en 4G

### Observabilidad

- [ ] Error tracking (Sentry o Firebase Crashlytics)
- [ ] Analytics básico de funnel: registro → crear liga → primera predicción

---

## Arranque local

```bash
npm install
npm run dev
```

La app corre en `http://localhost:5173`. No requiere `.env` para ver el prototipo mock.

Cuando conectes Firebase:

```bash
cp .env.example .env
# Completa las variables en .env
```

---

## Paleta de colores oficial

| Token | Hex | Uso |
|-------|-----|-----|
| Azul oscuro principal | `#0E294B` | Fondos, paneles |
| Azul de acento | `#0A1C33` | Fondo base, sombras |
| Naranja energético | `#F25C05` | CTAs, acentos activos |
| Naranja dorado | `#D94104` | Hover, gradientes CTA |
| Blanco | `#FFFFFF` | Texto principal |
| Gris claro | `#E2E8F0` | Texto secundario, bordes |

**Regla 60-30-10:** 60% azules, 30% blanco/gris para lectura, 10% naranja solo en acciones principales.

---

## Resumen ejecutivo

| Dimensión | Hoy | Objetivo |
|-----------|-----|----------|
| UI | Prototipo pulido | Producción con estados reales |
| Datos | Mock estático | Firestore + catálogo de partidos |
| Auth | Ninguna | Google + email |
| Lógica de negocio | Tipos solamente | Scoring + cierre automático |
| Arquitectura | Monolito | Modular con router y servicios |

**Tiempo estimado hasta beta:** 8–12 semanas con 1 desarrollador a tiempo parcial, siguiendo las fases 0–7 en orden.

---

*Última actualización: junio 2026 — refleja el estado del prototipo en `src/`.*
