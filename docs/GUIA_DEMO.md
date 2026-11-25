# Guía para el video de la Evaluación 3

Rúbrica: Parte 1 (contexto, **≤ 5 min**) + Parte 2 (app funcionando, **≤ 10 min**). Hay que mostrar **al menos 3 funcionalidades nuevas** y la **base de datos antes y después** de cada acción que guarda datos. **Participan todos los integrantes.**

---

## Preparación (antes de grabar)

- [ ] Aplicar `supabase/schema.sql`.
- [ ] Dos cuentas: **Editor** (teléfono A) y **Visualizador** (teléfono B o emulador). Para el editor:
      `update public.usuarios set rol = 'editor' where correo = '...';`
- [ ] App corriendo en el teléfono con un development build (`npx expo run:android`). No hace falta APK; la cámara y las notificaciones no funcionan en la web.
- [ ] Supabase abierto en **SQL Editor** (pantalla compartida junto al teléfono) y en **Storage → evidencias**.
- [ ] Notificaciones permitidas en el teléfono del Visualizador.
- [ ] Tablero con 2 o 3 tareas de ejemplo para que no parta vacío.
- [ ] `npm run verificar` en verde.

---

## Parte 1 · Contexto (≤ 5 min)

Diapositivas: https://claude.ai/artifact/GYYpra3PR4MdWaC8JoKJRu (cada una trae el guion y el tiempo en las notas).

| Tiempo | Diapositivas | Quién |
|---|---|---|
| 0:00–1:30 | 1–3 · Portada, resumen del MVP (problema, público, propuesta) y lo que ya existía | Integrante 1 |
| 1:30–2:45 | 4–5 · MVP → ahora y las 6 funcionalidades nuevas | Integrante 2 |
| 2:45–3:45 | 6–7 · Etapas de avance, completado y pendiente | Integrante 1 |
| 3:45–4:15 | 8 · Distribución del trabajo (cada uno presenta su parte) | Ambos |
| 4:15–5:00 | 9–11 · Calidad y arquitectura, qué se verá en la demo, cierre | Integrante 2 |

---

## Parte 2 · Demostración (≤ 10 min)

Patrón para cada funcionalidad: **consulta SQL (antes) → acción en la app → misma consulta (después)**.

### 1. Crear tarea con checklist (≈ 1:30)
```sql
select t.titulo, t.estado, t.prioridad, t.fecha_limite, u.nombre as responsable,
       (select count(*) from checklist_items c where c.tarea_id = t.id) as items
from tareas t left join usuarios u on u.id = t.asignado_a
order by t.created_at desc limit 5;
```
App (Editor): **+ Agregar tarea** → título, fecha con el calendario, responsable y 2 ítems de checklist → Crear.
Mostrar también que el formulario rechaza una fecha inválida (`31-02-2026`) o pasada.
Después: la nueva fila aparece con `estado = pendiente` y `items = 2`.

### 2. Mover entre columnas + sincronización en vivo (≈ 1:30)
```sql
select t.titulo, t.estado, c.nombre as columna
from tareas t join columnas c on c.id = t.columna_id
order by t.updated_at desc limit 5;
```
App A: mantener presionada la tarjeta → **Mover a En progreso**. En el teléfono B (Visualizador) la tarjeta cambia de columna sola.
Después: `estado = en_progreso`, `columna = En progreso`.

### 3. Checklist + foto de evidencia + regla de cierre (≈ 2:30)
```sql
select c.descripcion, c.completado
from checklist_items c join tareas t on t.id = c.tarea_id
where t.titulo = 'TÍTULO DE LA TAREA' order by c.orden;

select e.url_foto, e.fecha
from evidencias e join tareas t on t.id = e.tarea_id
where t.titulo = 'TÍTULO DE LA TAREA';
```
1. Intentar **Completar tarea**: está bloqueado y la app explica qué falta.
2. Marcar los ítems → la consulta muestra `completado = true`.
3. **Agregar foto** → cámara (o galería) → la foto aparece. Mostrar la fila en `evidencias` y el archivo en **Storage → evidencias**.
4. **Completar tarea** → pasa a Terminado.

Para mostrar que la regla también la valida la BD (no solo la app), en otra tarea sin foto:
```sql
update tareas set estado = 'terminado' where titulo = 'OTRA TAREA SIN FOTO';
-- ERROR: La tarea necesita al menos una foto de evidencia para cerrarse
```

### 4. Comentarios con @mención + actividad + notificación (≈ 1:30)
```sql
select tipo, texto, created_at from actividad order by created_at desc limit 6;
select texto, menciones from comentarios order by created_at desc limit 3;
```
App A: en el detalle, escribir un comentario con `@Nombre` del Visualizador → enviar.
Teléfono B: llega la notificación "Te mencionaron" y la pestaña Actividad muestra la insignia. Al tocar **Responder** se abre la tarea.
Después: fila nueva en `comentarios` y en `actividad` con `tipo = mencion`.

### 5. Roles: el Visualizador no puede editar (≈ 1:00)
```sql
select nombre, rol from usuarios order by nombre;
```
Teléfono B: el detalle muestra "Modo Visualizador", sin menú ⋯, sin checklist editable ni botón de foto.
App A (Editor) → Equipo → tocar al integrante → cambiar el rol. En B los botones aparecen **sin reiniciar**. Mostrar el cambio en la consulta.

### 6. Eliminar tarea (≈ 0:45)
```sql
select (select count(*) from tareas) as tareas,
       (select count(*) from checklist_items) as items,
       (select count(*) from evidencias) as evidencias;
```
App A: ⋯ → **Eliminar tarea** → confirmar. Después: los tres conteos bajan (borrado en cascada), y la foto desaparece de Storage.

### 7. Modo offline (opcional, ≈ 0:45)
Activar el modo avión → el tablero sigue visible con el aviso "Sin conexión". Intentar mover una tarea muestra que el cambio requiere internet. Desactivar el modo avión → se sincroniza solo.

---

## Antes de entregar
- [ ] Parte 1 ≤ 5:00 y Parte 2 ≤ 10:00; texto del teléfono legible (zoom si hace falta) y audio claro.
- [ ] Todos los integrantes hablan.
- [ ] Link del repositorio: https://github.com/Sonnyxpj/KanTask (público o con acceso para el profesor). Si la URL cambió, **avisar por correo**.
- [ ] Hacer push de los últimos cambios antes de enviar el link.
