import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import type { ChecklistItem } from '@/types/modelos';

type Props = {
  items: ChecklistItem[];
  onToggle?: (id: string) => void;
};

export function Checklist({ items, onToggle }: Props) {
  const completados = items.filter((i) => i.completado).length;

  return (
    <View style={styles.caja}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Lista de verificación</Text>
        <Text style={styles.contador}>
          {completados} de {items.length}
        </Text>
      </View>

      {items.map((item) => (
        <Pressable key={item.id} onPress={() => onToggle?.(item.id)} style={styles.item}>
          <View style={[styles.casilla, item.completado && styles.casillaMarcada]}>
            {item.completado && <Icono nombre="check" tamano={12} color="#FFFFFF" />}
          </View>
          <Text style={[styles.texto, item.completado && styles.textoTachado]}>{item.descripcion}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    backgroundColor: Colores.superficie,
    borderRadius: Radio.lg,
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: Espacio.lg,
    gap: Espacio.md,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 15,
    fontWeight: '700',
    color: Colores.texto,
  },
  contador: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.primario,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
  },
  casilla: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colores.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  casillaMarcada: {
    backgroundColor: Colores.exito,
    borderColor: Colores.exito,
  },
  texto: {
    flex: 1,
    fontSize: 14,
    color: Colores.texto,
  },
  textoTachado: {
    color: Colores.textoTenue,
    textDecorationLine: 'line-through',
  },
});
