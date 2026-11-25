import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { firmarEvidencias } from '@/services/tareas';
import type { Evidencia } from '@/types/modelos';

type Props = {
  fotos: Evidencia[];
  puedeAgregar?: boolean;
  onAgregar?: () => void;
  // Si se entrega, cada foto muestra un botón para eliminarla
  onEliminar?: (id: string) => void;
};

function confirmarEliminar(alAceptar: () => void) {
  const titulo = '¿Eliminar esta foto?';
  const detalle = 'Se borrará la evidencia para todo el equipo.';
  // Alert con botones no funciona en web
  if (Platform.OS === 'web') {
    if (window.confirm(`${titulo}\n${detalle}`)) alAceptar();
    return;
  }
  Alert.alert(titulo, detalle, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: alAceptar },
  ]);
}

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

export function Evidencias({ fotos, puedeAgregar = true, onAgregar, onEliminar }: Props) {
  const { urls, error: errorFirma } = useUrlsFirmadas(fotos.map((f) => f.urlFoto));
  const [fallidas, setFallidas] = useState(0);
  // URL de la foto abierta en pantalla completa
  const [ampliada, setAmpliada] = useState<string | null>(null);
  const error = errorFirma || (fallidas > 0 ? 'Algunas fotos no se pudieron mostrar' : '');

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
          <View key={foto.id}>
            <Pressable
              onPress={() => urls[foto.urlFoto] && setAmpliada(urls[foto.urlFoto])}
              accessibilityLabel="Ver foto en grande"
              style={({ pressed }) => pressed && { opacity: 0.8 }}>
              <Image
                source={urls[foto.urlFoto]}
                style={styles.foto}
                contentFit="cover"
                transition={200}
                onError={(e) => {
                  console.warn('No se pudo mostrar la foto', foto.urlFoto, e.error);
                  setFallidas((n) => n + 1);
                }}
              />
            </Pressable>
            {onEliminar && (
              <Pressable
                onPress={() => confirmarEliminar(() => onEliminar(foto.id))}
                hitSlop={8}
                accessibilityLabel="Eliminar foto"
                style={({ pressed }) => [styles.eliminar, pressed && { opacity: 0.7 }]}>
                <Icono nombre="basura" tamano={14} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        ))}

        {puedeAgregar && (
          <Pressable onPress={onAgregar} style={({ pressed }) => [styles.agregar, pressed && { opacity: 0.7 }]}>
            <Icono nombre="camara" tamano={22} color={Colores.primario} />
            <Text style={styles.agregarTexto}>Agregar foto /{'\n'}Tomar foto</Text>
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={!!ampliada}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAmpliada(null)}>
        <View style={styles.visor}>
          {/* Tocar fuera de la foto también cierra */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAmpliada(null)} />
          {ampliada && <Image source={ampliada} style={styles.fotoGrande} contentFit="contain" transition={150} />}
          <SafeAreaView style={styles.visorBarra} pointerEvents="box-none">
            <Pressable
              onPress={() => setAmpliada(null)}
              hitSlop={10}
              accessibilityLabel="Cerrar foto"
              style={({ pressed }) => [styles.cerrar, pressed && { opacity: 0.7 }]}>
              <Icono nombre="cerrar" tamano={18} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
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
  visor: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
  },
  fotoGrande: {
    width: '100%',
    height: '80%',
  },
  visorBarra: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: Espacio.lg,
  },
  cerrar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eliminar: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(11, 15, 20, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
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
