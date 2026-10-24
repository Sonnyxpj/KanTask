import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';

type Props = TextInputProps & {
  etiqueta?: string;
  icono?: NombreIcono;
  error?: string;
  contrasena?: boolean;
  onPressIcono?: () => void;
};

export function Campo({ etiqueta, icono, error, contrasena, onPressIcono, style, ...props }: Props) {
  const [oculto, setOculto] = useState(true);

  return (
    <View style={styles.contenedor}>
      {etiqueta && <Text style={styles.etiqueta}>{etiqueta}</Text>}
      <View style={[styles.caja, error && styles.cajaError]}>
        {icono &&
          (onPressIcono ? (
            <Pressable onPress={onPressIcono} hitSlop={8}>
              <Icono nombre={icono} tamano={18} color={Colores.primario} />
            </Pressable>
          ) : (
            <Icono nombre={icono} tamano={18} color={Colores.textoSecundario} />
          ))}
        <TextInput
          placeholderTextColor={Colores.textoTenue}
          secureTextEntry={contrasena && oculto}
          style={[styles.input, style]}
          {...props}
        />
        {contrasena && (
          <Pressable onPress={() => setOculto(!oculto)} hitSlop={8}>
            <Icono nombre={oculto ? 'ojo' : 'ojoCerrado'} tamano={18} color={Colores.textoSecundario} />
          </Pressable>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: Espacio.xs + 2,
  },
  etiqueta: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.texto,
  },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
    minHeight: 46,
    paddingHorizontal: Espacio.md,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  cajaError: {
    borderColor: Colores.peligro,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colores.texto,
    paddingVertical: Espacio.sm + 2,
  },
  error: {
    fontSize: 12,
    color: Colores.peligro,
  },
});
