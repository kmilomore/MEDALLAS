# Levantamiento de Necesidades de Reconocimientos — SLEP Colchagua

Documentación técnica del proyecto: arquitectura, flujos, estructura de archivos,
backend (Google Apps Script), autenticación, sistema de diseño y configuración de
despliegue. Pensada para retomar el desarrollo en el futuro sin perder contexto.

---

## 1. Qué es esta aplicación

Plataforma web para que las **directoras y directores de establecimientos
educacionales** del Servicio Local de Educación Pública (SLEP) Colchagua levanten
sus necesidades de reconocimientos institucionales (medallas, galvanos, diplomas,
trofeos, certificados, etc.), y para que el **equipo administrativo** consolide,
revise y exporte esa información desde un panel con indicadores y gráficos.

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + react-router-dom v6/v7
- **Backend**: Google Apps Script (Web App) — sin servidor propio
- **Base de datos**: Google Sheets (una planilla con varias hojas)
- **Autenticación**: Google OAuth 2.0 (flujo de redirección de página completa, sin popups)
- **Despliegue del frontend**: Vercel
- **Gráficos**: Recharts

---

## 2. Estructura del proyecto

```
MEDALLAS/
├── Code.gs                      # Backend completo en Google Apps Script
├── index.html                   # Punto de entrada Vite
├── preview/                     # Sistema de diseño (paletas, componentes, tipografía)
├── fonts/                       # Tipografía institucional Museo Sans (.woff)
├── src/
│   ├── main.tsx                 # Bootstrap de React + Router
│   ├── App.tsx                  # Definición de rutas + AuthProvider
│   ├── index.css                # Tema de Tailwind (@theme): colores, fuente, fondo
│   ├── assets/                  # Logo institucional
│   ├── context/
│   │   └── AuthContext.tsx      # Estado global de autenticación (React Context)
│   ├── services/
│   │   └── gasApi.ts            # Cliente HTTP hacia el Web App de Apps Script
│   ├── utils/
│   │   ├── googleAuth.ts        # Flujo OAuth de redirección (sin popups)
│   │   ├── validators.ts        # Validación del formulario de reconocimientos
│   │   ├── formatters.ts        # Formateo de fechas, números, campos de establecimiento
│   │   └── csvExport.ts         # Generación y descarga del CSV consolidado
│   ├── types/
│   │   └── index.ts             # Tipos compartidos (Establishment, RecognitionItem, etc.)
│   └── components/
│       ├── LoginDirector.tsx        # Pantalla de inicio de sesión (botón "Ingresar con Google")
│       ├── DirectorPortal.tsx       # Portal de directoras/directores ("/")
│       ├── AdminDashboard.tsx       # Panel administrativo ("/admin")
│       ├── AdminUsersModal.tsx      # Modal: gestión de usuarios administradores
│       ├── FormPreviewModal.tsx     # Modal: vista previa de solo lectura del formulario
│       ├── EstablishmentInfo.tsx    # Tarjeta con datos del establecimiento
│       ├── RecognitionForm.tsx      # Formulario de solicitud (lista de reconocimientos)
│       ├── RecognitionItem.tsx      # Bloque de un reconocimiento individual
│       ├── RequestSummary.tsx       # Resumen previo al envío de la solicitud
│       ├── RequestsTable.tsx        # Tabla de solicitudes recibidas (panel admin)
│       ├── FiltersPanel.tsx         # Filtros de la tabla de solicitudes
│       ├── KpiCard.tsx              # Tarjeta de indicador numérico
│       ├── AlertMessage.tsx         # Componente de alerta (success/error/info/warning)
│       └── LoadingSpinner.tsx       # Spinner de carga
└── package.json
```

---

## 3. Flujos de usuario

### 3.1 Directoras y directores (`/`)

1. Entran a la app y ven [LoginDirector.tsx](src/components/LoginDirector.tsx) con el
   botón **"Ingresar con Google"**.
2. Tras autenticarse (ver sección 5), su correo se valida contra la hoja de
   establecimientos. Si coincide:
   - Se muestra [EstablishmentInfo.tsx](src/components/EstablishmentInfo.tsx) con los
     datos de su establecimiento (cargados automáticamente desde la base oficial).
   - Completan [RecognitionForm.tsx](src/components/RecognitionForm.tsx): pueden
     agregar uno o más reconocimientos (tipo, cantidad, dimensión, subdimensión,
     acción asociada, fecha estimada, observaciones). La **dimensión y
     subdimensión** se seleccionan mediante una lista cerrada y encadenada según
     el marco oficial del PME — ver sección 3.5.
   - Pasan a [RequestSummary.tsx](src/components/RequestSummary.tsx) para revisar
     antes de confirmar el envío.
   - Al confirmar, se llama a `createRequest` (acción del backend) y se muestra una
     pantalla de éxito con el ID de la solicitud generada.
3. Si el correo corresponde a un **administrador**, se les muestra un aviso
   (`AdminAccountNotice` dentro de `DirectorPortal.tsx`) indicando que su cuenta es
   de perfil administrador y dirigiéndolos al panel `/admin`.
4. Si el correo no está registrado en ninguna base, se muestra un mensaje de "no
   autorizado" con la posibilidad de cerrar sesión.

### 3.2 Equipo administrativo (`/admin`)

[AdminDashboard.tsx](src/components/AdminDashboard.tsx) muestra, una vez autenticado
un correo con perfil `admin`:

- **KPIs**: total de establecimientos, cuántos respondieron, pendientes, % de avance,
  total de reconocimientos solicitados y desglose por tipo (medallas, galvanos, etc.)
- **Gráficos** (Recharts): reconocimientos por tipo, solicitudes por comuna,
  distribución por dimensión.
- **Filtros** ([FiltersPanel.tsx](src/components/FiltersPanel.tsx)): por comuna,
  estado de revisión, tipo de reconocimiento, dimensión, subdimensión y búsqueda
  libre por establecimiento/RBD/correo.
- **Tabla de solicitudes** ([RequestsTable.tsx](src/components/RequestsTable.tsx)):
  cada fila se puede expandir para ver el detalle de los reconocimientos solicitados,
  y permite cambiar el estado de revisión (`Recibido`, `En revisión`, `Validado`,
  `Observado`, `Cerrado`) directamente desde un selector con badge de color.
- **Exportación a CSV consolidado** (botón "Exportar CSV consolidado", usa
  [csvExport.ts](src/utils/csvExport.ts)).
- **Tablas consolidadas**: por establecimiento y por tipo de reconocimiento.
- **Botón "Usuarios administradores"**: abre
  [AdminUsersModal.tsx](src/components/AdminUsersModal.tsx) — ver sección 3.3.
- **Botón "Ver formulario de directores"**: abre
  [FormPreviewModal.tsx](src/components/FormPreviewModal.tsx) — ver sección 3.4.

Si el correo autenticado **no** tiene perfil admin, se muestra `NotAuthorizedScreen`
con acceso al portal de directores y opción de cerrar sesión.

### 3.3 Gestión de usuarios administradores

Modal accesible desde el botón **"Usuarios administradores"** del panel admin.
Permite:

- **Listar** los usuarios con acceso al panel (correo, nombre, cargo, estado
  activo/inactivo), obtenidos vía la acción `getAdmins`.
- **Agregar** un nuevo usuario administrador (correo institucional obligatorio,
  nombre, cargo, estado) vía la acción `createAdmin`. Valida formato de correo y
  evita duplicados (esto último lo hace el backend).
- **Eliminar** un usuario administrador vía la acción `deleteAdmin`.

> Nota: el backend también expone `updateAdmin` (editar un registro existente), pero
> todavía no tiene UI — se puede agregar reutilizando el mismo patrón del modal.

### 3.4 Vista previa del formulario (solo lectura)

Modal accesible desde el botón **"Ver formulario de directores"** del panel admin.
Muestra el formulario real (`EstablishmentInfo` + `RecognitionForm`) con datos de
ejemplo (`SAMPLE_ESTABLISHMENT` dentro de `FormPreviewModal.tsx`) para que el equipo
administrativo pueda revisar cómo lo ven las directoras y directores, sin poder
editarlo ni enviarlo.

> Implementación: el formulario se envuelve en un `<div className="pointer-events-none
> select-none" aria-hidden="true">`. **Importante**: se evitó deliberadamente usar
> `<fieldset disabled>` porque varios navegadores no soportan bien `display: contents`
> sobre `fieldset`, lo que rompía el layout del modal (se "expandía" verticalmente).

### 3.5 Selección encadenada Dimensión → Subdimensión (marco PME)

Las opciones de "Dimensión" y "Subdimensión" del formulario **ya no son listas
estáticas**: provienen de la hoja **`PME`** de la planilla (tabla oficial del Plan
de Mejoramiento Educativo), cargada vía la acción `getPmeOptions`. Cada combinación
tiene un **código único** (ej. `PME-GP-01`).

- **Funcionamiento**: el director elige primero una **Dimensión**; el selector de
  **Subdimensión** permanece deshabilitado hasta entonces y, al habilitarse, solo
  muestra las subdimensiones que pertenecen a la dimensión elegida (cada opción se
  presenta como `CÓDIGO · Nombre`, ej. "PME-GP-01 · Gestión curricular"). Al elegir
  cambiar de dimensión, la subdimensión y el código se limpian para forzar una
  selección coherente.
- **Lista cerrada**: se eliminó por completo la opción "Otro" (y el campo
  `subdimension_otro`) para dimensión/subdimensión — ahora es una lista cerrada
  según el marco oficial del PME (decisión explícita del usuario, ver sección 10).
- **Persistencia**: cada reconocimiento guarda también `codigo_pme` (el código de
  la subdimensión elegida, ej. `PME-GP-01`), para trazabilidad y reportes. Se
  muestra en `RequestsTable` (columna "Código PME") y se exporta en el CSV
  consolidado.
- **Implementación**:
  - [RecognitionForm.tsx](src/components/RecognitionForm.tsx) carga las opciones
    PME al montar (`getPmeOptions`, con spinner/alerta de error) y las pasa a cada
    [RecognitionItem.tsx](src/components/RecognitionItem.tsx), que arma las listas
    de dimensiones únicas y de subdimensiones filtradas por la dimensión activa.
  - Como `FormPreviewModal` reutiliza `RecognitionForm`, la vista previa del admin
    también muestra el encadenamiento real con datos en vivo.
  - `AdminDashboard`/`FiltersPanel` derivan sus opciones de filtro de Dimensión y
    Subdimensión (también encadenadas) a partir de los datos reales recibidos
    (`detailsByRequest`, vía `useMemo`), con el mismo patrón que ya usaba `comunas`.

---

## 4. Tipos y datos compartidos

Definidos en [types/index.ts](src/types/index.ts):

- `Establishment`: registro flexible (`{ [key: string]: string | number | boolean | null }`)
  porque los encabezados de la base de establecimientos pueden variar. Se reutiliza
  también para representar registros de la hoja "Admin".
- `RecognitionItem`: forma de cada reconocimiento dentro de una solicitud
  (`tipo_reconocimiento`, `cantidad`, `dimension`, `subdimension`, `codigo_pme`,
  `nombre_accion`, `descripcion`, `fecha_estimada_uso`, `observaciones`, etc.).
  `dimension`/`subdimension` son `string` simples (ya no uniones literales) porque
  ahora provienen de datos reales del backend (`PmeOption`), no de listas estáticas.
- `PmeOption`: combinación oficial `{ codigo, dimension, subdimension }` del marco
  PME, obtenida vía `getPmeOptions` — alimenta la selección encadenada del
  formulario (ver sección 3.5).
- `AdminRequest` / `RequestDetail`: filas que devuelve el backend para el panel admin
  (cabecera de la solicitud y detalle de cada reconocimiento, respectivamente).
  `RequestDetail` conserva `subdimension_otro` (solo para mostrar/exportar datos
  históricos previos a la migración al PME) y agrega `codigo_pme`.
- `DashboardStats`: estructura de los indicadores y totales por tipo/dimensión/comuna/estado.
- `GasResponse<T>`: envoltorio genérico de las respuestas del backend
  (`{ success: boolean; message?: string } & T`).
- `ValidateUserAccessResponse`: respuesta de la validación de acceso, incluye
  `role: 'director' | 'admin'`, y el registro (`establishment` o `admin`) según el caso.
- Listas de opciones controladas: `RECOGNITION_TYPES`, `REVIEW_STATUSES` (deben
  mantenerse coherentes con lo que espera el backend al guardar y filtrar). Las
  antiguas `DIMENSIONS`/`SUBDIMENSIONS` (listas estáticas con opción "Otro") fueron
  **eliminadas** — esos datos ahora viven en la hoja `PME` y se cargan dinámicamente.

---

## 5. Autenticación (Google OAuth — flujo de redirección)

**Decisión de diseño explícita**: NO se usa un botón/popup de Google Identity
Services (`@react-oauth/google` fue removido del proyecto). En su lugar se
implementó a mano un flujo de **redirección de página completa**, igual al patrón
que usa Supabase Auth con sus proveedores OAuth — sin overlays ni ventanas emergentes.

### 5.1 Cómo funciona ([utils/googleAuth.ts](src/utils/googleAuth.ts))

1. `startGoogleSignIn()`: genera un `nonce` aleatorio (anti-replay, vía
   `crypto.getRandomValues`), lo guarda en `sessionStorage`, arma la URL de
   `https://accounts.google.com/o/oauth2/v2/auth` con
   `response_type=id_token&scope=openid email profile&prompt=select_account`, y
   navega la página completa a esa URL (`window.location.assign`).
2. El usuario inicia sesión en Google (fuera de la app).
3. Google redirige de regreso a `redirect_uri` (= `${origin}/`) con el `id_token`
   en el **fragmento** de la URL (`#id_token=...`).
4. `consumeGoogleRedirectCredential()`: al cargar la app, detecta el fragmento, valida
   que el `nonce` del JWT coincida con el guardado, decodifica el token (con
   `jwt-decode`) y limpia la URL con `window.history.replaceState` (para no dejar el
   token visible/cacheable en el historial).
5. `isGoogleSignInConfigured()`: indica si `VITE_GOOGLE_CLIENT_ID` está definido —
   si no lo está, `LoginDirector` muestra una alerta de configuración faltante en vez
   del botón de ingreso.

### 5.2 Estado global ([context/AuthContext.tsx](src/context/AuthContext.tsx))

- `AuthProvider` expone `{ auth, beginGoogleSignIn, signOut }` vía `useAuth()`.
- `auth.status`: `'signedOut' | 'checking' | 'unauthorized' | 'authenticated'`.
- Persistencia de sesión en `sessionStorage` (clave `medallas.sesion`) — sólo se
  guarda cuando `status === 'authenticated'`.
- Un `useEffect` al montar consume el resultado del redirect (`consumeGoogleRedirectCredential`)
  y, si hay credencial válida, llama a `signInWithGoogleCredential`, que:
  1. Decodifica el JWT y extrae `email`, `name`, `picture`.
  2. Llama a la acción `validateUserAccess` del backend con ese correo.
  3. Según la respuesta, deja el estado en `authenticated` (con `role: 'director'`
     y `establishment`, o `role: 'admin'` y `adminProfile`), `unauthorized` (con
     mensaje explicativo) o muestra error de conexión.

### 5.3 Variables de entorno necesarias (Vercel / `.env` local)

| Variable | Para qué sirve |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | ID de cliente OAuth 2.0 de Google Cloud Console (tipo "Aplicación web") |
| `VITE_GAS_WEB_APP_URL` | URL del Web App de Apps Script desplegado (`.../exec`) |

### 5.4 Configuración requerida en Google Cloud Console

⚠️ **Importante — esto cambió respecto al flujo anterior basado en popup**: con el
flujo de redirección, el campo **"Authorized redirect URIs"** (URIs de redirección
autorizados) SÍ es obligatorio (en el flujo de popup no lo era). Debe coincidir
EXACTAMENTE con `${window.location.origin}/` (con barra final). Configurar en
**ambos** campos — "Authorized JavaScript origins" y "Authorized redirect URIs":

- Producción: `https://medallas.vercel.app/`
- Desarrollo local: `http://localhost:5173/`

Si no coincide exactamente (incluida la barra final), Google devuelve
`redirect_uri_mismatch`.

---

## 6. Backend — Google Apps Script ([Code.gs](Code.gs))

Desplegado como **Web App** (acceso "Cualquier usuario"), expone un único endpoint
`doPost` que enruta por el campo `action` del payload JSON. La base de datos es una
planilla de Google Sheets (`SHEET_ID` en la línea 9 de `Code.gs`).

### 6.1 Hojas de la planilla

| Hoja | Contenido | Encabezados clave |
|---|---|---|
| (primera hoja, base de establecimientos) | Datos oficiales de cada establecimiento, incluido su correo de director/a | Variables (se detectan por alias normalizados) |
| `Solicitudes` | Cabecera de cada solicitud enviada | `id_solicitud, fecha_envio, correo_electronico, rbd, nombre_establecimiento, comuna, total_reconocimientos, estado_revision, observaciones_generales` |
| `DetalleSolicitudes` | Un registro por cada reconocimiento dentro de una solicitud | `id_detalle, id_solicitud, ..., tipo_reconocimiento, cantidad, dimension, subdimension, subdimension_otro, nombre_accion, descripcion, fecha_estimada_uso, observaciones, codigo_pme` |
| `Admin` | Usuarios con acceso al panel administrativo | `CORREO ELECTRONICO, NOMBRE, CARGO, ACTIVO` |
| `PME` | Tabla de referencia oficial: dimensiones/subdimensiones válidas y su código único (ej. `PME-GP-01`) — alimenta la selección encadenada del formulario | `CODIGO, DIMENSION, SUB_DIMESION` |

> **`codigo_pme` está al final de `DETALLE_HEADERS`** (no en su posición "lógica"
> junto a `subdimension`) — decisión deliberada de compatibilidad: `appendRow`
> escribe por posición, y `DetalleSolicitudes` ya tenía datos en producción.
> Agregar la columna nueva al final evita desalinear filas existentes. Por la
> misma razón **se conservó la columna `subdimension_otro`** aunque el formulario
> ya no la use (sigue sirviendo para mostrar/exportar reconocimientos históricos
> que se guardaron como "Otro" antes de migrar al marco PME). Ver también sección 10.

### 6.2 Acciones disponibles (`doPost` → `switch(action)`)

| Acción | Función | Descripción |
|---|---|---|
| `inicializarHojas` | `inicializarHojas()` | Crea las hojas `Solicitudes`, `DetalleSolicitudes`, `Admin` y `PME` si no existen (idempotente — no duplica ni modifica las existentes). Además, **siembra automáticamente la hoja `PME`** con las 12 combinaciones oficiales (`PME_SEED_DATA`) la primera vez que se crea o si está vacía (`getLastRow() === 1`, solo encabezados). Se puede ejecutar manualmente desde el editor de Apps Script o vía POST. |
| `validateDirectorEmail` | `validateDirectorEmail(email)` | (Validación legacy contra solo la base de establecimientos — anterior al login con Google + Admin) |
| `validateUserAccess` | `validateUserAccess(email)` | **Cadena de validación actual**: 1) busca el correo en la base de establecimientos (perfil `director`); 2) si no hay coincidencia, busca en la hoja `Admin` (perfil `admin`, valida que esté `ACTIVO`). Devuelve `{ success, role, establishment? , admin? }`. |
| `getAdmins` | `getAdmins()` | Lista todos los registros de la hoja `Admin`. |
| `createAdmin` | `createAdmin(admin)` | Agrega un usuario administrador (valida formato de correo y evita duplicados, usa `LockService` para concurrencia). |
| `updateAdmin` | `updateAdmin(email, changes)` | Actualiza columnas de un registro existente de `Admin` localizado por correo. |
| `deleteAdmin` | `deleteAdmin(email)` | Elimina la fila de un usuario administrador localizado por correo. |
| `createRequest` | `createRequest(data)` | Crea una nueva solicitud: una fila en `Solicitudes` + N filas en `DetalleSolicitudes` (una por reconocimiento). Genera `id_solicitud`/`id_detalle`. |
| `getRequests` | `getRequests()` | Lista todas las solicitudes (para la tabla del panel admin). |
| `getRequestDetails` | `getRequestDetails(requestId)` | Lista el detalle (reconocimientos) de una solicitud específica. |
| `updateRequestStatus` | `updateRequestStatus(requestId, status)` | Cambia `estado_revision` de una solicitud. |
| `getDashboardStats` | `getDashboardStats()` | Calcula los indicadores y totales agregados que alimentan los KPIs y gráficos del panel. |
| `getPmeOptions` | `getPmeOptions()` | Lee la hoja `PME` y devuelve `{ codigo, dimension, subdimension }` por cada combinación oficial — usado por el formulario para la selección encadenada Dimensión → Subdimensión (ver sección 3.5). |

### 6.3 Utilidades internas relevantes

- `getOrCreateSheet` / `getSheetDataAsObjects`: leen filas como objetos clave-valor
  usando los encabezados de la fila 1 (omitiendo filas vacías).
- `normalizeHeader` / `normalizeEmail` / `extractEstablishmentField`: normalizan
  texto (NFD Unicode + remoción de tildes/diacríticos) para hacer matching robusto
  de encabezados y correos sin importar mayúsculas, tildes o variantes de nombre de
  columna.
- `LockService.getScriptLock()`: usado en operaciones de escritura concurrente
  (`createAdmin`, `updateAdmin`, `deleteAdmin`, `createRequest`, etc.) para evitar
  condiciones de carrera al escribir en la planilla.
- `generateRequestId` / `generateDetailId`: generación de identificadores legibles
  para solicitudes y su detalle.

### 6.4 Cómo desplegar/actualizar el backend

1. Abrir el proyecto de Apps Script vinculado a la planilla (`SHEET_ID`).
2. Pegar/actualizar el contenido de `Code.gs`.
3. Si es la primera vez (o se agregaron hojas nuevas): ejecutar `inicializarHojas`
   manualmente desde el editor, o enviar `{ "action": "inicializarHojas" }` por POST.
4. Implementar (Deploy) → "Nueva implementación" → tipo "Aplicación web", acceso
   "Cualquier usuario", y copiar la URL `.../exec` resultante a `VITE_GAS_WEB_APP_URL`.

---

## 7. Cliente HTTP del frontend ([services/gasApi.ts](src/services/gasApi.ts))

`callGasApi<T>(payload)` hace `POST` con `Content-Type: text/plain;charset=utf-8`
(para evitar pre-flight CORS con Apps Script) al `GAS_WEB_APP_URL`, y parsea la
respuesta JSON. Cada función exportada (`validateUserAccess`, `createRequest`,
`getRequests`, `getRequestDetails`, `updateRequestStatus`, `getDashboardStats`,
`getAdmins`, `createAdmin`, `deleteAdmin`, etc.) arma el payload con su `action`
correspondiente y tipa la respuesta esperada.

> Si se agrega una acción nueva en `Code.gs`, el patrón a seguir es: declarar el tipo
> de respuesta en `types/index.ts` (o reutilizar `GasResponse<T>`) y exportar una
> función wrapper en `gasApi.ts`.

---

## 8. Sistema de diseño (`/preview`)

Carpeta con tarjetas HTML de referencia (`*.html` + `_card.css`) que documentan la
identidad visual institucional: paletas de color, tipografía, botones, badges,
alertas, cards, espaciados, radios y sombras. El frontend ya está alineado con estos
tokens — se reflejan directamente en el `@theme` de [index.css](src/index.css):

- **Tipografía**: "Museo Sans" (cargada desde `/fonts/*.woff` vía `@font-face`).
- **Paletas** (con la misma escala 50→900 que en `/preview`):
  - `navy` (`#25306B` en 500): color institucional dominante — textos, headers, botones secundarios.
  - `royal` (`#006BB9` en 500): color interactivo/de acento — enlaces, botones primarios, focus rings.
  - `coral` (`#FF1D3D` en 500): alertas y énfasis — errores, badges de "urgente"/"observado".
  - `neutral` (escala fría de grises): fondos, bordes, textos secundarios.
- **Patrones de componentes reutilizados** en todo el frontend:
  - Cards: `rounded-2xl border border-neutral-200 bg-white p-5/p-6 shadow-sm`
  - Badges de estado: píldoras (`rounded-full`) con fondo claro + texto del mismo tono
    y un punto (`<span className="h-1.5 w-1.5 rounded-full bg-current" />`)
  - Alertas ([AlertMessage.tsx](src/components/AlertMessage.tsx)): franja de color por
    `tone` (`success`/`error`/`info`/`warning`), siguiendo la paleta semántica del DS
  - Botones primarios: fondo `royal-500`/`navy-500` con texto blanco y sombra interior sutil
  - Botones secundarios: fondo blanco, borde `navy-500`, hover `navy-50`

Al construir componentes nuevos, **revisar primero `/preview`** y reutilizar las
clases/tonos ya presentes en componentes existentes (`KpiCard`, `AlertMessage`,
`RequestsTable`, `AdminUsersModal`, etc.) para mantener coherencia visual.

---

## 9. Scripts y comandos útiles

```bash
npm run dev       # servidor de desarrollo (Vite)
npm run build     # tsc -b && vite build — typecheck + build de producción
npm run preview   # sirve el build de producción localmente
npm run lint      # ESLint
```

Para validar cambios antes de avisar que "está listo":
```bash
npx tsc -b        # solo typecheck (rápido)
npx vite build    # build completo
```

---

## 10. Decisiones y contexto importante para iterar

- **No usar popups de autenticación**: requerimiento explícito del usuario — el
  login debe ser un flujo de redirección de página completa (como Supabase Auth),
  nunca un overlay/popup de Google Identity Services. Si en el futuro se evalúa
  cambiar el proveedor de auth, mantener este patrón de UX.
- **`@react-oauth/google` fue desinstalado** — no reintroducirlo; la implementación
  manual en `utils/googleAuth.ts` cubre el caso de uso completo (nonce, redirect,
  limpieza de URL).
- **Evitar `<fieldset disabled>` para deshabilitar formularios visualmente** — rompe
  el layout en algunos navegadores cuando se combina con `display: contents`. Usar
  en su lugar un wrapper `pointer-events-none select-none aria-hidden`.
- **Las tablas anchas necesitan contenedor `overflow-x-auto` con `min-w-[…]` en la
  tabla** — de lo contrario se desbordan del contenedor/modal y se "pierden" columnas
  (pasó con `AdminUsersModal` y ya estaba resuelto en `RequestsTable`).
- **Dimensión/Subdimensión: lista cerrada según el marco oficial del PME, sin
  "Otro"** — requerimiento explícito del usuario: el formulario debe usar
  exactamente las 12 combinaciones oficiales (con su código único) de la hoja
  `PME`, presentadas como selección encadenada (Dimensión → Subdimensión filtrada).
  No reintroducir listas estáticas genéricas ni la opción "Otro" para estos campos.
- **Cambios de esquema en hojas con datos en producción van siempre al final**
  — `appendRow`/`getOrCreateSheet` operan por posición de columna, no por nombre.
  Por eso `codigo_pme` se agregó al final de `DETALLE_HEADERS` (no junto a
  `subdimension`) y se conservó `subdimension_otro` aunque ya no se usa. Aplicar
  el mismo criterio ante cualquier futura columna nueva en hojas ya pobladas.
- **`Establishment` es intencionalmente un tipo flexible** (`Record` dinámico) porque
  los encabezados de la base de datos de establecimientos pueden variar entre
  planillas/años — no tipar sus campos de forma rígida.
- **Todas las respuestas en español, tono institucional** — mantener la voz y el
  formato de mensajes de error/éxito ya presentes (ej. "No fue posible conectar con
  el sistema. Intenta nuevamente.").

---

## 11. Posibles próximos pasos (ideas para iterar)

- UI para `updateAdmin` (editar nombre/cargo/estado de un usuario administrador
  existente) — el backend ya lo soporta.
- Code-splitting del bundle (actualmente ~650 kB minificado; Vite sugiere
  `dynamic import()` o ajustar `chunkSizeWarningLimit`).
- Exportaciones adicionales (PDF, Excel) si el equipo lo requiere más adelante.
- Notificaciones por correo al cambiar el estado de una solicitud (requeriría
  `MailApp`/`GmailApp` desde Apps Script).
