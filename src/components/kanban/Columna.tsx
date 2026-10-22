import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colores, Espacio, Radio } from '@/constants/colores';

type Props = {
  nombre: string;
  color: string;
  cantidad: number;
  ancho: number;
  children: ReactNode;
};

export function Columna({ nombre, color, cantidad, ancho, children }: Props) {
  return (
    <View style={[styles.columna, { width: ancho }]}>
      <View style={styles.encabezado}>
        <View style={[styles.punto, { backgroundColor: color }]} />
        <Text style={styles.nombre}>{nombre}</Text>
        <Text style={styles.cantidad}>{cantidad}</Text>
      </View>

      <View style={styles.lista}>
        {children}
        {cantidad === 0 && (
          <View style={styles.vacia}>
            <Text style={styles.vaciaTexto}>Sin tareas</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  columna: {
    gap: Espacio.md,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
  },
  punto: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nombre: {
    fontSize: 14,
    fontWeight: '700',
    color: Colores.texto,
  },
  cantidad: {
    fontSize: 13,
    color: Colores.textoSecundario,
  },
  lista: {
    gap: Espacio.md,
  },
  vacia: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colores.borde,
    borderRadius: Radio.md,
    paddingVertical: Espacio.xl,
    alignItems: 'center',
  },
  vaciaTexto: {
    fontSize: 13,
    color: Colores.textoTenue,
  },
});
