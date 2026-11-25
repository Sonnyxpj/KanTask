# KanTask · Tablero Kanban móvil

Aplicación móvil para que equipos pequeños (2 a 10 personas) coordinen tareas en un tablero Kanban con **tres columnas fijas**, **cierre validado** (checklist completo + foto de evidencia) y **sincronización en tiempo real** entre dispositivos.

Taller de Aplicaciones Móviles · UCM · Benjamín Garrido, Iván Sánchez · Profesor: Román Gajardo Robles

| | |
|---|---|
| Plataformas | Android, iOS y web (un solo código) |
| Tecnologías | React Native 0.88 · Expo SDK 58 · Expo Router · TypeScript · Supabase (Auth, PostgreSQL, Storage, Realtime) |
| Repositorio | https://github.com/Sonnyxpj/KanTask |

---

## Funcionalidades

### Ya presentes en el MVP (EV2)
- Inicio de sesión, registro y recuperación de contraseña con código (Supabase Auth, sesión persistente).
- Roles **Editor / Visualizador** con reglas en la BD (RLS); un editor cambia el rol de los demás.
- Equipo en vivo: integrantes conectados en tiempo real (Realtime Presence), búsqueda y orden.
- Perfil editable (nombre, teléfono, correo con confirmación).
- Diseño de las 6 pantallas + 3 modales, navegación Stack + Tabs y formulario con calendario propio.
- Esquema de base de datos con triggers y RLS (`supabase/schema.sql`).

### Nuevas desde el MVP
| # | Funcionalidad | Dónde |
|---|---|---|
| 1 | **Tareas persistentes**: crear, editar, eliminar y mover entre columnas (mantener presionada una tarjeta) | `services/tareas.ts`, `lib/tablero.tsx` |
| 2 | **Checklist y regla de cierre**: "Completar tarea" exige checklist completo + 1 foto; lo valida la app y el trigger `validar_cierre_tarea` | `lib/reglas.ts`, `schema.sql` |
| 3 | **Evidencia fotográfica real**: cámara (`expo-camera`) o galería (`expo-image-picker`), subida al bucket privado `evidencias` | `app/camera.tsx` |
| 4 | **Sincronización en vivo entre dispositivos** de tareas, checklist, evidencias, roles y actividad | `lib/tablero.tsx`, `lib/actividad.tsx` |
| 5 | **Actividad real** con filtros, insignia de no leídas y texto personalizado | `app/(tabs)/actividad` |
| 6 | **Comentarios con @menciones**: cada mención genera un aviso para la persona mencionada | `components/tarea/Comentarios.tsx` |
| 7 | **Notificaciones locales**: asignaciones, menciones y recordatorio 1 h antes del vencimiento | `lib/notificaciones.ts` |
| 8 | **Modo offline (lectura)**: tablero, equipo y actividad guardados en el teléfono | `lib/almacen.ts` |
| 9 | **Visualizador en solo lectura en todas las vistas** | detalle, cámara, formulario |
| 10 | Cambio de contraseña y tarjeta de resumen del tablero | Perfil, Tablero |

### Pendiente / fuera de alcance
- Cambios **sin conexión**: se ven los datos guardados, pero editar requiere internet (no hay cola de sincronización).
- Notificaciones **push remotas** con la app cerrada (requiere tokens + Edge Function); las actuales son locales.
- Fechas de sprint (la BD no las modela) e idiomas distintos al español.

---

## Puesta en marcha

### 1. Base de datos (Supabase)
1. Crear un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pegar `supabase/schema.sql` → **Run**. Crea las tablas, RLS, triggers, el bucket `evidencias` y la publicación Realtime.
   - El archivo es para una base vacía: crea todo desde cero (roles Editor, Programador y Visualizador incluidos).
3. El primer usuario registrado entra como **Visualizador**. Para tener un primer editor:
   ```sql
   update public.usuarios set rol = 'editor' where correo = 'tu@correo.com';
   ```
   Desde ahí, ese editor cambia los roles de los demás en la pestaña **Equipo**.

### 2. Variables de entorno
```bash
cp .env.example .env.local
```
Completar `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase → Project Settings → API).
Sin estas variables la app abre en **modo demo** con datos de ejemplo en memoria.

### 3. Ejecutar
```bash
npm install
npx expo start
```
La cámara y las notificaciones son módulos nativos: para probarlas se usa un **development build**:
```bash
npx expo run:android      # o run:ios (requiere Android Studio / Xcode)
```

### 4. (Opcional) Compilar en la nube con EAS
No es necesario para la entrega: basta con el development build del paso 3 o, para las pantallas que no usan cámara ni notificaciones, con Expo Go.
Si se quiere un instalable, los perfiles están en `eas.json` (`development`, `preview`, `production`):
```bash
npm install -g eas-cli && eas login
eas build --profile preview --platform android
```

---

## Calidad

```bash
npm run verificar   # typecheck + lint + pruebas
npm run typecheck   # TypeScript estricto
npm run lint        # ESLint (eslint-config-expo)
npm test            # Jest (jest-expo)
```
Las pruebas (`src/__tests__/`) cubren la validación de fechas del formulario, la regla de cierre, el texto del feed y el servicio de tareas contra un Supabase simulado (inserciones, rollback, errores de RLS y del trigger de cierre, subida de evidencias).

---

## Estructura

Ver [ESTRUCTURA.md](ESTRUCTURA.md). Resumen:

```
src/
├── app/          Pantallas (Expo Router: Stack + Tabs)
├── components/   UI reutilizable (kanban, tarea, equipo, perfil, ui)
├── lib/          Estado global (Context API), sesión, Realtime, offline, notificaciones, reglas
├── services/     Acceso a Supabase (tareas, actividad, usuarios)
├── constants/    Colores, estados, datos de demo
└── types/        Modelo de datos
supabase/         schema.sql (esquema completo)
```

## Guía para la demostración
[docs/GUIA_DEMO.md](docs/GUIA_DEMO.md): guion del video y consultas SQL para mostrar la persistencia antes y después de cada acción.
