import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';

type Variante = 'primario' | 'secundario' | 'peligro' | 'flotante';

type Props = {
  titulo: string;
  onPress?: () => void;
  variante?: Variante;
  icono?: NombreIcono;
  deshabilitado?: boolean;
  estilo?: object;
};

const VARIANTES: Record<Variante, { fondo: string; texto: string; borde: string }> = {
  primario: { fondo: Colores.marino, texto: '#FFFFFF', borde: Colores.marino },
  secundario: { fondo: Colores.superficie, texto: Colores.texto, borde: Colores.borde },
  peligro: { fondo: Colores.peligroSuave, texto: Colores.peligro, borde: '#F8C9C9' },
  flotante: { fondo: Colores.primario, texto: '#FFFFFF', borde: Colores.primario },
};

export function Boton({ titulo, onPress, variante = 'primario', icono, deshabilitado, estilo }: Props) {
  const v = VARIANTES[variante];
  const fondo = deshabilitado ? Colores.borde : v.fondo;
  const texto = deshabilitado ? Colores.textoTenue : v.texto;

  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        styles.base,
        variante === 'flotante' && styles.flotante,
        { backgroundColor: fondo, borderColor: deshabilitado ? Colores.borde : v.borde },
        pressed && styles.presionado,
        estilo,
      ]}>
      <View style={styles.contenido}>
        {icono && <Icono nombre={icono} tamano={16} color={texto} />}
        <Text style={[styles.texto, { color: texto }]}>{titulo}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: Espacio.lg,
    borderRadius: Radio.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flotante: {
    borderRadius: Radio.pill,
    paddingHorizontal: Espacio.xl,
    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)',
  },
  contenido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
  },
  texto: {
    fontSize: 15,
    fontWeight: '600',
  },
  presionado: {
    opacity: 0.8,
  },
});
