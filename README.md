# Predicta

**Quinielas privadas para el Mundial 2026** — ligas entre amigos con reglas personalizables, predicciones en tiempo real y clasificación automática.

| | |
|---|---|
| **Dominio** | [predictaclub.com](https://predictaclub.com) |
| **Repo** | [github.com/dannybaylon28/predicta](https://github.com/dannybaylon28/predicta) |
| **Hosting** | Vercel (`daniel-baylons-projects/predicta`) |
| **Firebase** | Proyecto `clutch-330a9` (Auth + Firestore) |
| **Stack** | React 19 · Vite 6 · TypeScript · Firebase · CSS nativo |
| **Estado** | MVP en producción — jugable de punta a punta |

---

## Contexto para IA / onboarding rápido

### Qué es Predicta

Predicta es una **plataforma web de entretenimiento** (no apuestas con dinero) donde grupos de amigos, familiares o compañeros crean **ligas privadas** para pronosticar resultados del **Mundial FIFA 2026**. Cada liga tiene su propio administrador, reglas de puntuación, premio simbólico (definido por el grupo) y clasificación en vivo.

**Objetivo del producto:** que cualquier persona pueda armar su quiniela privada en minutos, invitar a su grupo por link o QR, marcar predicciones antes de cada partido y ver quién va ganando — sin depender de hojas de Excel ni grupos de WhatsApp desordenados.

**Público:** aficionados al fútbol en México/LATAM que quieren competir con su círculo cercano durante el Mundial 2026.

### Cómo funciona (flujo completo)

```
1. Usuario se registra (email o Google)
2. Crea una liga → define nombre, premio, ganadores, modo de puntuación
3. Invita participantes → link, compartir nativo o QR descargable
4. Cada jornada → cada miembro marca marcadores (0–15) antes del kickoff
5. Al iniciar el partido → predicciones se bloquean automáticamente
6. Al finalizar el partido → el sistema calcula puntos según reglas de la liga
7. Clasificación → ranking ordenado por puntos (y exactos como desempate)
```

### Modos de puntuación (por liga)

| Modo | Descripción |
|------|-------------|
| `result` | Solo acertar quién gana o si empatan |
| `exact` | Solo marcador exacto |
| `hybrid` | Puntos por resultado + bonus si además es exacto |

Puntos configurables: `resultPoints` y `exactBonus` por liga.

### Roles

- **Admin de liga:** crea la liga, define reglas, invita, comparte.
- **Participante:** predice, ve clasificación, ve predicciones ajenas solo tras cierre del partido.

### Arquitectura técnica

```
src/
├── app/router.tsx          # Rutas React Router
├── pages/                  # Landing, Login, Dashboard, Predicciones, Clasificación, etc.
├── components/             # UI, match rows, QR, PWA banner, layout
├── context/                # Auth, League, Matches, Toast
├── hooks/                  # usePredictions, useLeaderboard
├── services/               # Firebase: auth, leagues, predictions, members, worldCupApi
├── utils/                  # scoring, match filters, invite links, page meta
└── constants/brand.ts      # APP_NAME, dominio, URLs
```

**Datos externos:** calendario y resultados del Mundial vía [worldcup26.ir](https://worldcup26.ir) (104 partidos + estadios).

**Importante — proxy API:** el navegador no puede llamar a `worldcup26.ir` directo por CORS. La app usa `/api/worldcup`:
- **Dev:** proxy en `vite.config.ts`
- **Prod:** rewrite en `vercel.json` → `https://worldcup26.ir/get/:path*`

**Puntuación:** calculada en **cliente** (`src/utils/scoring.ts`) al cargar clasificación. No hay Cloud Function aún.

**PWA:** manifest manual, service worker (`public/sw.js`), banner de instalación, iconos 192/512 PNG generados desde `logo_predicta.png`.

### Rutas

| Ruta | Acceso | Función |
|------|--------|---------|
| `/` | Público | Landing con preview de partidos reales |
| `/entrar` | Público | Login, registro, Google |
| `/terminos` | Público | Términos de uso |
| `/privacidad` | Público | Política de privacidad |
| `/crear` | Auth | Crear liga |
| `/mis-ligas` | Auth | Dashboard, invitar, compartir, QR |
| `/unirse` y `/unirse/:codigo` | Auth | Unirse a liga por código |
| `/predicciones` | Auth | Marcar predicciones (filtros por jornada, abiertos/finalizados) |
| `/clasificacion` | Auth | Ranking con puntos reales |
| `/reglas` | Auth | Reglas de la liga seleccionada |

### Firestore (colecciones principales)

- `users/{uid}` — perfil
- `leagues/{id}` — config de liga (nombre, premio, scoring, inviteCode)
- `leagues/{id}/members/{uid}` — membresía, puntos, exactHits
- `leagues/{id}/predictions/{uid}_{matchId}` — predicción por partido
- `inviteCodes/{code}` — lookup rápido de código → leagueId
- `users/{uid}/leagueMemberships/{leagueId}` — índice de ligas del usuario

Reglas en `firestore.rules`. **Deben publicarse manualmente** tras cada cambio:

```bash
firebase deploy --only firestore:rules
```

### Variables de entorno (Vite)

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_APP_URL=https://predictaclub.com
VITE_USE_LOCAL_MATCHES=false   # true solo en dev para JSON local
```

Archivo local de referencia: `.env.vercel` (gitignored). Script para subir a Vercel: `npm run vercel:env`.

### Archivos clave para modificar

| Área | Archivos |
|------|----------|
| Predicciones | `src/pages/PredictionsPage.tsx`, `src/hooks/usePredictions.ts`, `src/services/predictions.ts` |
| Clasificación | `src/pages/LeaderboardPage.tsx`, `src/hooks/useLeaderboard.ts`, `src/utils/scoring.ts` |
| Partidos/API | `src/services/worldCupApi.ts`, `vercel.json`, `vite.config.ts` |
| Invitaciones/QR | `src/components/invite/InviteQrPanel.tsx`, `src/utils/inviteLink.ts` |
| Marca/SEO | `src/constants/brand.ts`, `src/utils/pageMeta.ts`, `index.html` |
| Legal | `src/pages/TermsPage.tsx`, `src/pages/PrivacyPage.tsx` |

---

## Registro de progreso

**Actualizado: 8 jun 2026**

### Completado (MVP)

| Área | Detalle |
|------|---------|
| **Auth** | Email + Google, sesión persistente, perfiles en Firestore |
| **Ligas** | Crear, listar, seleccionar liga activa, código de invitación único |
| **Invitaciones** | `/unirse/:codigo`, preview, unirse, copiar link, compartir nativo, QR descargable (PNG) |
| **Predicciones** | Inputs 0–15, guardado por partido modificado, cierre por kickoff, filtros por jornada |
| **Finalizados** | Resultado oficial + predicciones de todos los miembros (propia resaltada) |
| **Estados partido** | Abierto (countdown <48h), En juego, Final |
| **Clasificación** | Puntos reales en cliente (modos result/exact/hybrid), desempate por exactos |
| **Partidos** | API worldcup26.ir vía proxy (dev + prod), 104 partidos |
| **UX** | Toasts, skeletons, estados vacíos, landing con datos reales |
| **PWA** | Manifest, service worker, banner instalación, iconos 192/512 |
| **Legal** | Términos (`/terminos`) y privacidad (`/privacidad`) |
| **SEO/OG** | Meta dinámico en invitaciones, dominio predictaclub.com |
| **Marca** | Rebrand Clutch → Predicta, logo oficial, dominio predictaclub.com |
| **Deploy** | GitHub + Vercel, variables de entorno, DNS Hostinger, fix CORS producción |
| **Tests** | `src/utils/scoring.test.ts` (vitest) |

### Último trabajo realizado

1. **Rebrand completo** a Predicta / predictaclub.com
2. **Logo oficial** aplicado (header, favicon, PWA, OG image)
3. **Términos y privacidad** + footer legal
4. **Publicación en GitHub** → `dannybaylon28/predicta`
5. **Deploy en Vercel** con variables de entorno (Firebase + `VITE_APP_URL`)
6. **DNS Hostinger** → Vercel (`A @ 76.76.21.21`, `CNAME www → vercel-dns`)
7. **Fix CORS en producción** — proxy `/api/worldcup` en `vercel.json` para que carguen los partidos en predictaclub.com
8. Scripts utilitarios: `npm run generate:icons`, `npm run vercel:env`

### Errores resueltos

| Problema | Solución |
|----------|----------|
| Permisos clasificación en Firestore | Reglas: miembros pueden leer predicciones de su liga |
| 0 puntos con partidos cerrados | Carga por matchId/miembro + reglas publicadas |
| "Load failed" partidos en Safari/prod | Proxy same-origin en Vercel (no fetch directo a worldcup26.ir) |
| QR sin descarga | Export SVG → PNG con `downloadQrImage.ts` |
| PWA build fallaba con vite-plugin-pwa | PWA manual (manifest + sw.js) |

### Pendiente — próximas tareas

| Prioridad | Tarea | Notas |
|-----------|-------|-------|
| **Alta** | **Plan free** | Modelo freemium: definir límites del plan gratuito (ligas, miembros, torneos), UI de planes, posible integración de pagos futura |
| **Alta** | **Traducir la app (i18n)** | Soporte multi-idioma (es/en como mínimo); evaluar `react-i18next` o similar; textos en UI, legal, toasts, meta tags |
| **Media** | **GIFs / imágenes de fondo** | Añadir assets visuales al landing y secciones clave (estadio, celebración, balón) para más dinamismo y personalidad sin sacrificar rendimiento |
| Media | Cloud Function para scoring | Cálculo en servidor, anti-trampa, más fiable |
| Media | Desglose "¿por qué X puntos?" | UX en clasificación |
| Baja | Invitar por email | Flujo directo además de link/QR |
| Baja | Iconos PWA optimizados | Comprimir logo (actual ~1 MB en repo) |
| Baja | Analytics / error tracking | Firebase Analytics, Sentry |

### Post-deploy checklist (manual)

- [x] Variables en Vercel
- [x] DNS predictaclub.com + www
- [x] Fix CORS partidos en producción
- [ ] Dominios en Firebase Auth → Authorized domains (`predictaclub.com`, `www.predictaclub.com`)
- [ ] Reglas Firestore publicadas en producción
- [ ] Redeploy tras cambios de env o código

---

## Arranque local

```bash
npm install
cp .env.example .env   # completar con credenciales Firebase
npm run dev            # http://localhost:5173
```

**Probar con JSON local** (sin API): en `.env` poner `VITE_USE_LOCAL_MATCHES=true`.

**Sincronizar calendario local:**

```bash
npm run sync:matches
```

**Build y tests:**

```bash
npm run build
npm run test
```

**Regenerar iconos PWA** (tras cambiar `logo_predicta.png`):

```bash
npm run generate:icons
```

---

## Despliegue

### Vercel (actual)

Conectado al repo GitHub. Cada push a `main` despliega automáticamente.

```bash
npm run build          # output: dist/
```

`vercel.json` incluye:
- Rewrite API: `/api/worldcup/*` → worldcup26.ir
- SPA fallback: `/*` → `index.html`

### Firebase

```bash
firebase deploy --only firestore:rules
```

Proyecto: `clutch-330a9` (nombre legacy; la marca visible es Predicta).

---

## Reglas de negocio (resumen)

### Cierre de predicciones

- No se puede crear ni editar una predicción después de `match.kickoffAt`.
- Frontend deshabilita inputs; Firestore debe rechazar escrituras tardías.

### Privacidad de predicciones

- Predicciones ajenas visibles **solo después** de que el partido cierra (kickoff pasado o finalizado).

### Desempates (clasificación)

1. Más puntos totales
2. Más marcadores exactos
3. (Futuro: más aciertos de resultado, fecha de ingreso)

---

## Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| Azul oscuro | `#0E294B` | Fondos, paneles |
| Azul base | `#0A1C33` | Fondo principal, theme-color |
| Naranja | `#F25C05` | CTAs, acentos |
| Naranja hover | `#D94104` | Hover |
| Blanco | `#FFFFFF` | Texto principal |
| Gris | `#E2E8F0` | Texto secundario |

Tipografía: **Oswald** (display) + **IBM Plex Sans** (cuerpo).

---

## Testing

```bash
npm run test    # vitest — scoring.ts
```

Casos cubiertos: modos `result`, `exact`, `hybrid`; empates, 0-0, goleadas.

---

*Última actualización: 8 jun 2026 — refleja el estado en producción de predictaclub.com.*
