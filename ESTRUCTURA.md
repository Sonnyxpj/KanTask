# KanTask — Estructura de `src/`

Organización de la carpeta `src/` según el informe del proyecto: tablero Kanban con checklist, evidencia fotográfica, sincronización en tiempo real con Supabase y roles Editor / Visualizador.

```
src/
├── app/                              # PANTALLAS (Expo Router: cada archivo = una ruta)
│   ├── _layout.tsx                   # Layout raíz: providers (Auth, Board) + SafeArea
│   ├── index.tsx                     # Pantalla 1 · Login
│   ├── camera.tsx                    # Cámara / galería para evidencia (modal)
│   └── (tabs)/                       # Barra inferior de pestañas
│       ├── _layout.tsx               # Tabs: Tablero, Turnos/Equipo, Actividad, Perfil
│       ├── tablero/
│       │   ├── _layout.tsx           # Stack del tablero
│       │   ├── index.tsx             # Pantalla 2 · Tablero Kanban
│       │   ├── nueva.tsx             # Formulario "Agregar tarea"
│       │   └── [id].tsx              # Pantalla 3 · Detalle de tarea
│       ├── actividad/index.tsx       # Pantalla 4 · Actividad en vivo
│       ├── equipo/index.tsx          # Pantalla 5 · Equipo en vivo
│       └── perfil/index.tsx          # Pantalla 6 · Perfil
│
├── components/                       # COMPONENTES DE UI reutilizables
│   ├── kanban/
│   │   ├── Columna.tsx               # Columna (Pendiente / En progreso / Terminado)
│   │   └── TarjetaTarea.tsx          # Tarjeta con prioridad, fecha y avance
│   ├── tarea/
│   │   ├── FormTarea.tsx             # Formulario con validación de campos obligatorios
│   │   ├── Checklist.tsx             # Lista de verificación de subtareas
│   │   └── Evidencias.tsx            # Galería de fotos de cierre
│   ├── equipo/
│   │   ├── MiembroItem.tsx           # Fila de integrante con rol y estado
│   │   ├── InvitacionItem.tsx        # Fila de invitación pendiente
│   │   └── ModalInvitar.tsx          # Formulario "Agregar integrante"
│   └── ui/                           # Botones, inputs, badges, etc.
│
├── context/                          # ESTADO GLOBAL (Context API)
│   ├── AuthContext.tsx               # Sesión del usuario y rol (editor / visualizador)
│   └── BoardContext.tsx              # Estado del tablero, columnas y tareas
│
├── hooks/
│   ├── useRealtimeTareas.ts          # Suscripción en tiempo real de Supabase
│   └── usePermisos.ts                # ¿Puede editar el usuario actual?
│
├── lib/
│   ├── supabase.ts                   # Cliente de Supabase (sesión en AsyncStorage)
│   └── offline.ts                    # Persistencia local con AsyncStorage (modo offline)
│
├── services/                         # ACCESO A DATOS (una tabla por archivo)
│   ├── auth.ts                       # signIn, signUp, signOut
│   ├── usuarios.ts                   # Usuario
│   ├── invitaciones.ts               # Invitar integrantes al equipo con su rol
│   ├── tableros.ts                   # Tablero
│   ├── columnas.ts                   # Columna
│   ├── tareas.ts                     # Tarea: crear, editar, mover de columna, borrar
│   ├── checklist.ts                  # Checklist_Item
│   └── evidencias.ts                 # Evidencia + subida de fotos a Supabase Storage
│
├── types/
│   └── modelos.ts                    # Tipos TS del modelo de datos
│
└── constants/
    ├── estados.ts                    # Columnas por defecto y prioridades
    └── colores.ts                    # Paleta de la app
```

## Pantallas (`app/`)

| # | Pantalla | Ruta | Contenido |
|---|---|---|---|
| 1 | Login | `/` | Correo, contraseña, iniciar sesión |
| 2 | Tablero Kanban | `/tablero` | Columnas Pendiente, En progreso y Terminado; botón "Agregar tarea" |
| 3 | Detalle de tarea | `/tablero/[id]` | Título, descripción, responsable, checklist, prueba de finalización |
| 4 | Actividad | `/actividad` | Filtros, tareas asignadas, actividad en vivo |
| 5 | Equipo en vivo | `/equipo` | Buscador de miembros, rol asignado, lista de integrantes |
| 6 | Perfil | `/perfil` | Datos del usuario, configuración, cerrar sesión |
| — | Cámara | `/camera` | Tomar foto o elegir de galería y adjuntarla como evidencia |

> La navegación se hace con **Expo Router**: las rutas se definen por archivos dentro de `src/app/`, los `_layout.tsx` definen los navegadores (Tabs y Stack) y se navega con `router`, `Link` y `useLocalSearchParams` importados desde `expo-router`.

## Modelo de datos (`types/` + `services/`)

| Entidad | Campos | Servicio |
|---|---|---|
| Usuario | id, nombre, correo, rol, turno, enVivo | `usuarios.ts` |
| Tablero | id, nombre, equipo, usuario (FK) | `tableros.ts` |
| Columna | id, tableroId (FK), nombre, orden | `columnas.ts` |
| Tarea | id, columnaId (FK), asignadoA (FK), título, descripción, prioridad, fecha_límite, estado | `tareas.ts` |
| Checklist_Item | id, tareaId (FK), descripción, completado | `checklist.ts` |
| Evidencia | id, tareaId (FK), urlFoto, fecha | `evidencias.ts` |

El esquema SQL de estas tablas (con RLS por rol, Storage y Realtime) está en `supabase/schema.sql`, fuera de `src/`.

## Flujo de datos

```
Pantallas (app/) ─► Componentes (components/)
       │
       ▼
Context API (context/) ◄──► AsyncStorage (lib/offline.ts)
       │
       ▼
Servicios (services/) ─► lib/supabase.ts ─► Supabase
                                              ├─ Auth (sesión y roles)
                                              ├─ Base de datos en tiempo real
                                              └─ Storage (fotos de evidencia)
       ▲
       └── hooks/useRealtimeTareas.ts (cambios de otros dispositivos)
```

## Carpetas por área de trabajo

| Área (según el informe) | Carpetas a cargo |
|---|---|
| Frontend & UI/UX | `app/`, `components/`, `constants/colores.ts`, integración de cámara en `app/camera.tsx` |
| Backend, Datos & Sincronización | `services/`, `lib/`, `context/`, `hooks/`, `types/`, `constants/estados.ts` |
| Transversal / Todo el equipo | Revisión de código y pruebas sobre todo `src/` |
