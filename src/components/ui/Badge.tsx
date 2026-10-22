import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colores, Espacio, Radio } from '@/constants/colores';

type BadgeProps = {
  texto: string;
  color: string;
  fondo: string;
  punto?: boolean;
};

// Etiqueta pequeña: prioridad, rol, "En vivo", etc.
export function Badge({ texto, color, fondo, punto }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: fondo }]}>
      {punto && <View style={[styles.punto, { backgroundColor: color }]} />}
      <Text style={[styles.badgeTexto, { color }]}>{texto}</Text>
    </View>
  );
}

export function BadgeEnVivo({ texto = 'En vivo' }: { texto?: string }) {
  return <Badge texto={texto} color={Colores.exito} fondo={Colores.exitoSuave} punto />;
}

type ChipProps = {
  texto: string;
  activo?: boolean;
  onPress?: () => void;
};

// Filtro seleccionable
export function Chip({ texto, activo, onPress }: ChipProps) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, activo && styles.chipActivo]}>
      <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espacio.xs,
    paddingHorizontal: Espacio.sm,
    paddingVertical: 3,
    borderRadius: Radio.pill,
  },
  punto: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '600',
  },
  chip: {
    paddingHorizontal: Espacio.md + 2,
    paddingVertical: Espacio.sm,
    borderRadius: Radio.pill,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  chipActivo: {
    backgroundColor: Colores.marino,
    borderColor: Colores.marino,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '500',
    color: Colores.textoSecundario,
  },
  chipTextoActivo: {
    color: '#FFFFFF',
  },
});
