import { StyleSheet, Text, View } from 'react-native';

import { Colores } from '@/constants/colores';
import { iniciales } from '@/constants/datos-demo';

type Props = {
  nombre: string;
  tamano?: number;
  borde?: string;
};

export function Avatar({ nombre, tamano = 32, borde }: Props) {
  return (
    <View
      style={[
        styles.avatar,
        { width: tamano, height: tamano, borderRadius: tamano / 2 },
        borde && { borderWidth: 2, borderColor: borde },
      ]}>
      <Text style={[styles.texto, { fontSize: tamano * 0.36 }]}>{iniciales(nombre)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: {
    fontWeight: '700',
    color: Colores.marino,
  },
});
