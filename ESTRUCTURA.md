# KanTask — Estructura del proyecto

```
src/
├── app/                              # PANTALLAS (Expo Router: cada archivo = una ruta)
│   ├── _layout.tsx                   # Raíz: proveedores (Sesión → Equipo → Tablero → Actividad) + Stack protegido
│   ├── index.tsx                     # Redirige a /tablero o /login según la sesión
│   ├── login.tsx                     # Pantalla 1 · Login
│   ├── registro.tsx                  # Crear cuenta (entra como Visualizador)
│   ├── recuperar.tsx                 # Recuperar contraseña con código
│   ├── camera.tsx                    # Cámara / galería para evidencia (modal, recibe ?tareaId=)
│   └── (tabs)/                       # Barra inferior de pestañas
│       ├── _layout.tsx               # Tabs + insignia de no leídas + notificaciones
│       ├── tablero/
│       │   ├── _layout.tsx           # Stack del tablero
│       │   ├── index.tsx             # Pantalla 2 · Tablero Kanban
│       │   ├── nueva.tsx             # Crear tarea (y editar con ?id=)
│       │   └── [id].tsx              # Pantalla 3 · Detalle de tarea
│       ├── actividad/index.tsx       # Pantalla 4 · Actividad en vivo
│       ├── equipo/index.tsx          # Pantalla 5 · Equipo en vivo
│       └── perfil/index.tsx          # Pantalla 6 · Perfil
│
├── components/
│   ├── kanban/                       # Columna, TarjetaTarea, ResumenTablero
│   ├── tarea/                        # FormTarea, Checklist, Evidencias, Comentarios
│   ├── equipo/                       # MiembroItem, ModalRol
│   ├── perfil/                       # ModalEditarPerfil, ModalContrasena
│   └── ui/                           # Boton, Campo, Badge, Avatar, Encabezado, Icono, Calendario, HojaAcciones
│
├── lib/                              # ESTADO GLOBAL Y LÓGICA
│   ├── supabase.ts                   # Cliente de Supabase (sesión persistente)
│   ├── sesion.tsx                    # ProveedorSesion: login, registro, recuperar/cambiar contraseña
│   ├── equipo.tsx                    # ProveedorEquipo: integrantes, rol actual, presencia en vivo
│   ├── tablero.tsx                   # ProveedorTablero: tareas, checklist, evidencias, Realtime y offline
│   ├── actividad.tsx                 # ProveedorActividad: feed en vivo, no leídas, avisos
│   ├── notificaciones.ts             # Notificaciones locales y recordatorios de vencimiento
│   ├── almacen.ts                    # Caché local (modo offline) y preferencias
│   ├── fechas.ts                     # Formato y validación de fechas
│   └── reglas.ts                     # Reglas de negocio puras (regla de cierre, texto de actividad)
│
├── services/                         # ACCESO A DATOS (Supabase)
│   ├── tareas.ts                     # Tablero, tareas, checklist, evidencias (Storage)
│   ├── actividad.ts                  # Actividad y comentarios
│   └── usuarios.ts                   # Perfiles y roles
│
├── __tests__/                        # Pruebas (Jest)
├── types/modelos.ts                  # Tipos del modelo de datos
└── constants/                        # colores.ts, estados.ts, datos-demo.ts

supabase/
└── schema.sql                        # Esquema completo: tablas, roles, RLS, triggers, Storage y Realtime
```

## Modelo de datos

| Tabla | Campos principales | Notas |
|---|---|---|
| `usuarios` | id, nombre, correo, rol, cargo, teléfono | Se crea con un trigger al registrarse |
| `tableros` | id, nombre, equipo, usuario_id | El primer editor que entra crea el tablero |
| `columnas` | id, tablero_id, nombre, orden | Pendiente (0), En progreso (1), Terminado (2), creadas por trigger |
| `tareas` | id, columna_id, asignado_a, título, descripción, prioridad, fecha_límite, estado | `validar_cierre_tarea` exige checklist + foto para "terminado" |
| `checklist_items` | id, tarea_id, descripción, completado, orden | |
| `evidencias` | id, tarea_id, url_foto (ruta en Storage), fecha | Bucket privado `evidencias`, URLs firmadas |
| `actividad` | id, tipo, texto, tarea_id, usuario_id, destinatario_id | La llenan los triggers |
| `comentarios` | id, tarea_id, usuario_id, texto, menciones[] | Cada mención genera actividad "mencion" |

**Permisos (RLS):** todos los usuarios autenticados leen. Solo los editores crean, editan, mueven y borran tareas, checklist y evidencias. Cualquiera comenta y solo borra sus propios comentarios.

## Flujo de datos

```
Pantallas (app/) ─► Componentes (components/)
       │
       ▼
Proveedores (lib/*.tsx, Context API) ◄──► Caché local (lib/almacen.ts)
       │                    ▲
       ▼                    │ postgres_changes / presence (Realtime)
Servicios (services/) ─► lib/supabase.ts ─► Supabase
                                              ├─ Auth (sesión)
                                              ├─ PostgreSQL + RLS + triggers
                                              └─ Storage (fotos de evidencia)
```

## Áreas de trabajo

| Área | Carpetas |
|---|---|
| Frontend & UI/UX (Iván Sánchez) | `app/`, `components/`, `constants/colores.ts`, cámara |
| Backend, Datos & Sincronización (Benjamín Garrido) | `services/`, `lib/`, `types/`, `supabase/` |
| Transversal | Revisión de código y pruebas (`__tests__/`) |
