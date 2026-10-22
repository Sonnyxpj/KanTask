import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colores, Espacio } from '@/constants/colores';

type Props = {
  titulo: string;
  subtitulo?: string;
  accion?: ReactNode;
};

// Título grande de cada pestaña
export function Encabezado({ titulo, subtitulo, accion }: Props) {
  return (
    <View style={styles.fila}>
      <View style={styles.textos}>
        <Text style={styles.titulo}>{titulo}</Text>
        {subtitulo && <Text style={styles.subtitulo}>{subtitulo}</Text>}
      </View>
      {accion}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Espacio.lg,
    paddingTop: Espacio.sm,
    paddingBottom: Espacio.md,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
  titulo: {
    fontSize: 26,
    fontWeight: '600',
    color: Colores.texto,
  },
  subtitulo: {
    fontSize: 13,
    color: Colores.textoSecundario,
  },
});
