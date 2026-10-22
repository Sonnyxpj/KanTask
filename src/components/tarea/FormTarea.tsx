import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { USUARIOS } from '@/constants/datos-demo';
import { PRIORIDADES } from '@/constants/estados';
import type { Prioridad } from '@/types/modelos';

export type ValoresTarea = {
  titulo: string;
  descripcion: string;
  prioridad: Prioridad;
  fechaLimite: string;
  asignadoA: string;
};

type Props = {
  onGuardar: (valores: ValoresTarea) => void;
};

type Errores = Partial<Record<'titulo' | 'fechaLimite' | 'asignadoA', string>>;

export function FormTarea({ onGuardar }: Props) {
  const [valores, setValores] = useState<ValoresTarea>({
    titulo: '',
    descripcion: '',
    prioridad: 'media',
    fechaLimite: '',
    asignadoA: '',
  });
  const [errores, setErrores] = useState<Errores>({});

  const cambiar = <K extends keyof ValoresTarea>(campo: K, valor: ValoresTarea[K]) =>
    setValores((v) => ({ ...v, [campo]: valor }));

  const guardar = () => {
    const nuevos: Errores = {};
    if (!valores.titulo.trim()) nuevos.titulo = 'El título es obligatorio';
    if (!valores.fechaLimite.trim()) nuevos.fechaLimite = 'Indica una fecha límite';
    if (!valores.asignadoA) nuevos.asignadoA = 'Selecciona un responsable';
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) onGuardar(valores);
  };

  return (
    <View style={styles.form}>
      <Campo
        etiqueta="Título *"
        placeholder="Ej: Implementar pantalla de login"
        value={valores.titulo}
        onChangeText={(t) => cambiar('titulo', t)}
        error={errores.titulo}
      />

      <Campo
        etiqueta="Descripción"
        placeholder="Detalles de la tarea"
        value={valores.descripcion}
        onChangeText={(t) => cambiar('descripcion', t)}
        multiline
        style={styles.multilinea}
      />

      <View style={styles.grupo}>
        <Text style={styles.etiqueta}>Prioridad</Text>
        <View style={styles.opciones}>
          {(Object.keys(PRIORIDADES) as Prioridad[]).map((p) => {
            const info = PRIORIDADES[p];
            const activa = valores.prioridad === p;
            return (
              <Pressable
                key={p}
                onPress={() => cambiar('prioridad', p)}
                style={[
                  styles.opcion,
                  activa && { backgroundColor: info.fondo, borderColor: info.color },
                ]}>
                <Text style={[styles.opcionTexto, activa && { color: info.color }]}>{info.etiqueta}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Campo
        etiqueta="Fecha límite *"
        placeholder="DD-MM-AAAA HH:MM"
        icono="calendario"
        value={valores.fechaLimite}
        onChangeText={(t) => cambiar('fechaLimite', t)}
        error={errores.fechaLimite}
      />

      <View style={styles.grupo}>
        <Text style={styles.etiqueta}>Responsable *</Text>
        <View style={styles.opciones}>
          {USUARIOS.filter((u) => u.rol === 'editor').map((u) => {
            const activo = valores.asignadoA === u.id;
            return (
              <Pressable
                key={u.id}
                onPress={() => cambiar('asignadoA', u.id)}
                style={[styles.persona, activo && styles.personaActiva]}>
                <Avatar nombre={u.nombre} tamano={24} />
                <Text style={[styles.opcionTexto, activo && { color: Colores.primario }]}>
                  {u.nombre.split(' ')[0]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {errores.asignadoA && <Text style={styles.error}>{errores.asignadoA}</Text>}
      </View>

      <Boton titulo="Crear tarea" icono="mas" onPress={guardar} />
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
});
