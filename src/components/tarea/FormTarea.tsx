import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Boton } from '@/components/ui/Boton';
import { Calendario } from '@/components/ui/Calendario';
import { Campo } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { PRIORIDADES } from '@/constants/estados';
import { useEquipo } from '@/lib/equipo';
import { aTextoFecha, leerTextoFecha } from '@/lib/fechas';
import { puedeSerResponsable } from '@/lib/reglas';
import type { Prioridad, ValoresTarea } from '@/types/modelos';

type Props = {
  // Al editar: valores actuales de la tarea
  inicial?: ValoresTarea;
  textoBoton?: string;
  onGuardar: (valores: ValoresTarea) => Promise<void>;
};

type Errores = Partial<Record<'titulo' | 'fechaLimite' | 'asignadoA' | 'general', string>>;

type ItemForm = { clave: string; id?: string; descripcion: string };

let contador = 0;
const nuevaClave = () => `item-${Date.now()}-${contador++}`;

export function FormTarea({ inicial, textoBoton = 'Crear tarea', onGuardar }: Props) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [prioridad, setPrioridad] = useState<Prioridad>(inicial?.prioridad ?? 'media');
  const { usuarios } = useEquipo();
  // Solo Editores y Programadores pueden ser responsables. Si el actual ya no lo es, hay que elegir otro.
  const responsables = usuarios.filter(puedeSerResponsable);
  const [asignadoA, setAsignadoA] = useState(() =>
    inicial?.asignadoA && (usuarios.length === 0 || responsables.some((u) => u.id === inicial.asignadoA))
      ? inicial.asignadoA
      : '',
  );
  // La fecha se escribe como texto "DD-MM-AAAA HH:MM" y se convierte a ISO al guardar
  const [fechaTexto, setFechaTexto] = useState(inicial ? aTextoFecha(new Date(inicial.fechaLimite)) : '');
  const [items, setItems] = useState<ItemForm[]>(
    () => inicial?.checklist.map((i) => ({ ...i, clave: i.id ?? nuevaClave() })) ?? [],
  );
  const [nuevoItem, setNuevoItem] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [calendarioAbierto, setCalendarioAbierto] = useState(false);

  // Reemplaza la parte DD-MM-AAAA y conserva la hora si ya se escribió
  const elegirFecha = (fecha: Date) => {
    const dd = String(fecha.getDate()).padStart(2, '0');
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const hora = fechaTexto.match(/\d{1,2}:\d{2}/)?.[0];
    setFechaTexto(`${dd}-${mm}-${fecha.getFullYear()}${hora ? ` ${hora}` : ''}`);
    setCalendarioAbierto(false);
  };

  const agregarItem = () => {
    const texto = nuevoItem.trim();
    if (!texto) return;
    setItems((p) => [...p, { clave: nuevaClave(), descripcion: texto }]);
    setNuevoItem('');
  };

  const cambiarItem = (clave: string, descripcion: string) =>
    setItems((p) => p.map((i) => (i.clave === clave ? { ...i, descripcion } : i)));

  const quitarItem = (clave: string) => setItems((p) => p.filter((i) => i.clave !== clave));

  const guardar = async () => {
    const nuevos: Errores = {};
    if (!titulo.trim()) nuevos.titulo = 'El título es obligatorio';
    else if (titulo.trim().length > 120) nuevos.titulo = 'Máximo 120 caracteres';

    const fecha = leerTextoFecha(fechaTexto);
    const fechaCambio = !inicial || aTextoFecha(new Date(inicial.fechaLimite)) !== fechaTexto.trim();
    if (!fechaTexto.trim()) nuevos.fechaLimite = 'Indica una fecha límite';
    else if (!fecha) nuevos.fechaLimite = 'Fecha no válida. Usa DD-MM-AAAA HH:MM';
    else if (fechaCambio && fecha.getTime() < Date.now())
      nuevos.fechaLimite = 'La fecha límite no puede estar en el pasado';

    if (!asignadoA) nuevos.asignadoA = 'Selecciona un responsable';
    else if (!responsables.some((u) => u.id === asignadoA))
      nuevos.asignadoA = 'Solo se pueden asignar tareas a editores o programadores';
    if (items.some((i) => i.descripcion.trim().length > 200))
      nuevos.general = 'Cada ítem del checklist admite hasta 200 caracteres';

    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0 || !fecha) return;

    // Un ítem escrito pero sin presionar "+" también se guarda
    const pendiente = nuevoItem.trim();
    const checklist = [...items, ...(pendiente ? [{ clave: '', descripcion: pendiente }] : [])]
      .filter((i) => i.descripcion.trim())
      .map(({ id, descripcion }) => ({ id, descripcion }));

    setEnviando(true);
    try {
      await onGuardar({ titulo, descripcion, prioridad, fechaLimite: fecha.toISOString(), asignadoA, checklist });
    } catch (e) {
      setErrores({ general: e instanceof Error ? e.message : 'No se pudo guardar la tarea' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.form}>
      <Campo
        etiqueta="Título *"
        placeholder="Ej: Implementar pantalla de login"
        value={titulo}
        onChangeText={setTitulo}
        maxLength={120}
        error={errores.titulo}
      />

      <Campo
        etiqueta="Descripción"
        placeholder="Detalles de la tarea"
        value={descripcion}
        onChangeText={setDescripcion}
        multiline
        style={styles.multilinea}
      />

      <View style={styles.grupo}>
        <Text style={styles.etiqueta}>Prioridad</Text>
        <View style={styles.opciones}>
          {(Object.keys(PRIORIDADES) as Prioridad[]).map((p) => {
            const info = PRIORIDADES[p];
            const activa = prioridad === p;
            return (
              <Pressable
                key={p}
                onPress={() => setPrioridad(p)}
                style={[styles.opcion, activa && { backgroundColor: info.fondo, borderColor: info.color }]}>
                <Text style={[styles.opcionTexto, activa && { color: info.color }]}>{info.etiqueta}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.grupo}>
        <Campo
          etiqueta="Fecha límite *"
          placeholder="DD-MM-AAAA HH:MM"
          icono="calendario"
          onPressIcono={() => setCalendarioAbierto((a) => !a)}
          value={fechaTexto}
          onChangeText={setFechaTexto}
          error={errores.fechaLimite}
        />
        {calendarioAbierto && <Calendario seleccionada={leerTextoFecha(fechaTexto)} onSeleccionar={elegirFecha} />}
      </View>

      <View style={styles.grupo}>
        <Text style={styles.etiqueta}>Responsable *</Text>
        <View style={styles.opciones}>
          {responsables.map((u) => {
            const activo = asignadoA === u.id;
            return (
              <Pressable
                key={u.id}
                onPress={() => setAsignadoA(u.id)}
                style={[styles.persona, activo && styles.personaActiva]}>
                <Avatar nombre={u.nombre} tamano={24} />
                <Text style={[styles.opcionTexto, activo && { color: Colores.primario }]}>
                  {u.nombre.split(' ')[0]}
                </Text>
              </Pressable>
            );
          })}
          {responsables.length === 0 && <Text style={styles.ayuda}>No hay editores ni programadores en el equipo</Text>}
        </View>
        {errores.asignadoA && <Text style={styles.error}>{errores.asignadoA}</Text>}
      </View>

      <View style={styles.grupo}>
        <Text style={styles.etiqueta}>Checklist</Text>
        <Text style={styles.ayuda}>Para completar la tarea, todos los ítems deben estar marcados.</Text>
        {items.map((item) => (
          <View key={item.clave} style={styles.item}>
            <View style={styles.casilla} />
            <TextInput
              value={item.descripcion}
              onChangeText={(t) => cambiarItem(item.clave, t)}
              maxLength={200}
              style={styles.itemInput}
              placeholderTextColor={Colores.textoTenue}
            />
            <Pressable onPress={() => quitarItem(item.clave)} hitSlop={8}>
              <Icono nombre="cerrar" tamano={16} color={Colores.textoSecundario} />
            </Pressable>
          </View>
        ))}
        <View style={styles.item}>
          <TextInput
            value={nuevoItem}
            onChangeText={setNuevoItem}
            onSubmitEditing={agregarItem}
            submitBehavior="submit"
            returnKeyType="done"
            maxLength={200}
            placeholder="Agregar ítem al checklist"
            placeholderTextColor={Colores.textoTenue}
            style={styles.itemInput}
          />
          <Pressable onPress={agregarItem} hitSlop={8} style={styles.botonAgregar}>
            <Icono nombre="mas" tamano={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {errores.general && <Text style={styles.error}>{errores.general}</Text>}

      <Boton
        titulo={enviando ? 'Guardando…' : textoBoton}
        icono={inicial ? 'check' : 'mas'}
        deshabilitado={enviando}
        onPress={guardar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Espacio.lg,
  },
  multilinea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  grupo: {
    gap: Espacio.sm,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.texto,
  },
  opciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacio.sm,
  },
  opcion: {
    paddingHorizontal: Espacio.lg,
    paddingVertical: Espacio.sm,
    borderRadius: Radio.pill,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  opcionTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.textoSecundario,
  },
  persona: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.xs + 2,
    paddingLeft: Espacio.xs,
    paddingRight: Espacio.md,
    paddingVertical: Espacio.xs,
    borderRadius: Radio.pill,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  personaActiva: {
    borderColor: Colores.primario,
    backgroundColor: Colores.primarioSuave,
  },
  error: {
    fontSize: 12,
    color: Colores.peligro,
  },
  ayuda: {
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
    minHeight: 44,
    paddingHorizontal: Espacio.md,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  casilla: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colores.borde,
  },
  itemInput: {
    flex: 1,
    fontSize: 14,
    color: Colores.texto,
    paddingVertical: Espacio.sm,
  },
  botonAgregar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
