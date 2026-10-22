import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { buscarUsuario } from '@/constants/datos-demo';
import { PRIORIDADES } from '@/constants/estados';
import type { Tarea } from '@/types/modelos';

type Props = {
  tarea: Tarea;
  completadas: number;
  total: number;
  onPress?: () => void;
};

export function TarjetaTarea({ tarea, completadas, total, onPress }: Props) {
  const prioridad = PRIORIDADES[tarea.prioridad];
  const responsable = buscarUsuario(tarea.asignadoA);
  const avance = total > 0 ? completadas / total : 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tarjeta, pressed && styles.presionada]}>
      <View style={styles.fila}>
        <Badge texto={prioridad.etiqueta} color={prioridad.color} fondo={prioridad.fondo} />
        {responsable && <Avatar nombre={responsable.nombre} tamano={26} />}
      </View>

      <Text style={styles.titulo} numberOfLines={2}>
        {tarea.titulo}
      </Text>

      <View style={styles.fecha}>
        <Icono nombre="calendario" tamano={12} color={Colores.textoSecundario} />
        <Text style={styles.textoTenue}>{tarea.fechaLimite}</Text>
      </View>

      <View style={styles.barra}>
        <View style={[styles.barraRelleno, { width: `${avance * 100}%` }]} />
      </View>
      <Text style={styles.textoTenue}>
        {completadas}/{total} completadas
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: Colores.superficie,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: Espacio.md,
    gap: Espacio.sm,
  },
  presionada: {
    opacity: 0.85,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: Colores.texto,
  },
  fecha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.xs,
  },
  textoTenue: {
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  barra: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colores.fondo,
    overflow: 'hidden',
  },
  barraRelleno: {
    height: '100%',
    backgroundColor: Colores.primario,
  },
});
