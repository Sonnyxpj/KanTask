import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { firmarEvidencias } from '@/services/tareas';
import type { Evidencia } from '@/types/modelos';

type Props = {
  fotos: Evidencia[];
  puedeAgregar?: boolean;
  onAgregar?: () => void;
};

// El bucket "evidencias" es privado: las fotos se muestran con URLs firmadas temporales
function useUrlsFirmadas(rutas: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const clave = rutas.join('|');

  useEffect(() => {
    let vigente = true;
    if (!clave) return;
    firmarEvidencias(clave.split('|'))
      .then((r) => vigente && (setUrls(r), setError('')))
      .catch((e: Error) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [clave]);

  return { urls, error };
}

export function Evidencias({ fotos, puedeAgregar = true, onAgregar }: Props) {
  const { urls, error } = useUrlsFirmadas(fotos.map((f) => f.urlFoto));

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Prueba de finalización</Text>
        <Text style={styles.contador}>
          {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'}
        </Text>
      </View>

      <View style={styles.grilla}>
        {fotos.map((foto) => (
          <Image key={foto.id} source={urls[foto.urlFoto]} style={styles.foto} contentFit="cover" transition={200} />
        ))}

        {puedeAgregar && (
          <Pressable onPress={onAgregar} style={({ pressed }) => [styles.agregar, pressed && { opacity: 0.7 }]}>
            <Icono nombre="camara" tamano={22} color={Colores.primario} />
            <Text style={styles.agregarTexto}>Agregar foto /{'\n'}Tomar foto</Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const TAMANO = 100;

const styles = StyleSheet.create({
  contenedor: {
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
    color: Colores.textoSecundario,
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacio.sm,
  },
  foto: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: Radio.md,
    backgroundColor: Colores.borde,
  },
  agregar: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: Radio.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colores.primario,
    backgroundColor: Colores.primarioSuave,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.xs,
  },
  error: {
    fontSize: 12,
    color: Colores.peligro,
  },
  agregarTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: Colores.primario,
    textAlign: 'center',
  },
});
