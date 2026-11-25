import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { useEquipo } from '@/lib/equipo';
import { puedeTrabajarTarea } from '@/lib/reglas';
import { useTablero } from '@/lib/tablero';

// Calidad de compresión: el bucket admite fotos de hasta 5 MB
const CALIDAD = 0.6;

// Cámara / galería para la evidencia de cierre de una tarea (recibe ?tareaId=)
export default function Camara() {
  const { tareaId } = useLocalSearchParams<{ tareaId?: string }>();
  const { actual } = useEquipo();
  const { tareas, agregarEvidencia } = useTablero();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camara = useRef<CameraView>(null);

  const [lado, setLado] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [lista, setLista] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  const tarea = tareas.find((t) => t.id === tareaId);
  // Editores en cualquier tarea; Programadores solo en las suyas
  const puedeSubir = !!tarea && puedeTrabajarTarea(actual, tarea);
  const puedeUsar = !!tareaId && puedeSubir;

  // Al abrir la cámara se pide la autorización una vez (el sistema muestra su diálogo de permiso)
  const pedido = useRef(false);
  useEffect(() => {
    if (!puedeUsar || !permiso || permiso.granted || !permiso.canAskAgain || pedido.current) return;
    pedido.current = true;
    pedirPermiso();
  }, [puedeUsar, permiso, pedirPermiso]);

  const cerrar = () => (router.canGoBack() ? router.back() : router.replace('/tablero'));

  const subir = async (uri: string, tipo?: string) => {
    if (!tareaId) return;
    setSubiendo(true);
    setError('');
    try {
      await agregarEvidencia(tareaId, uri, tipo);
      cerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la foto');
      setSubiendo(false);
    }
  };

  const tomarFoto = async () => {
    if (!camara.current || !lista || subiendo) return;
    try {
      const foto = await camara.current.takePictureAsync({ quality: CALIDAD });
      await subir(foto.uri, 'image/jpeg');
    } catch {
      setError('No se pudo tomar la foto');
    }
  };

  const abrirGaleria = async () => {
    if (subiendo) return;
    const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: CALIDAD });
    if (resultado.canceled || !resultado.assets[0]) return;
    const foto = resultado.assets[0];
    await subir(foto.uri, foto.mimeType ?? 'image/jpeg');
  };

  // Sin tarea o sin permiso de edición no hay nada que subir
  const bloqueo = !tareaId
    ? 'No se indicó a qué tarea pertenece la foto.'
    : !puedeSubir
      ? 'Solo los editores o el programador responsable pueden subir evidencia.'
      : '';

  return (
    <View style={styles.pantalla}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.barra}>
          <BotonRedondo icono="cerrar" onPress={cerrar} />
          <Text style={styles.titulo}>Evidencia de cierre</Text>
          <BotonRedondo icono="flash" activo={flash} onPress={() => setFlash((f) => !f)} />
        </View>

        <View style={styles.visor}>
          {bloqueo ? (
            <Text style={styles.ayuda}>{bloqueo}</Text>
          ) : !permiso ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : !permiso.granted ? (
            <View style={styles.permiso}>
              <Icono nombre="camara" tamano={40} color="rgba(255,255,255,0.35)" />
              <Text style={styles.ayuda}>
                {permiso.canAskAgain
                  ? 'Necesitamos acceso a la cámara para fotografiar la evidencia.'
                  : 'El acceso a la cámara está bloqueado. Actívalo en Ajustes o usa la galería.'}
              </Text>
              {permiso.canAskAgain ? (
                <Pressable style={styles.botonPermiso} onPress={pedirPermiso}>
                  <Text style={styles.botonPermisoTexto}>Permitir cámara</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.botonPermiso} onPress={() => Linking.openSettings()}>
                  <Text style={styles.botonPermisoTexto}>Abrir ajustes</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <>
              <CameraView
                ref={camara}
                style={StyleSheet.absoluteFill}
                facing={lado}
                flash={flash ? 'on' : 'off'}
                onCameraReady={() => setLista(true)}
                onMountError={() => setError('No se pudo iniciar la cámara')}
              />
              <View style={[styles.esquina, styles.supIzq]} />
              <View style={[styles.esquina, styles.supDer]} />
              <View style={[styles.esquina, styles.infIzq]} />
              <View style={[styles.esquina, styles.infDer]} />
            </>
          )}

          {subiendo && (
            <View style={styles.cargando}>
              <ActivityIndicator color="#FFFFFF" size="large" />
              <Text style={styles.ayuda}>Subiendo foto…</Text>
            </View>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.controles}>
          <Pressable style={styles.lateral} onPress={abrirGaleria} disabled={!!bloqueo || subiendo}>
            <Icono nombre="galeria" tamano={22} color="#FFFFFF" />
            <Text style={styles.lateralTexto}>Galería</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.disparador, (pressed || !lista || subiendo) && { opacity: 0.5 }]}
            disabled={!lista || subiendo || !!bloqueo}
            onPress={tomarFoto}>
            <View style={styles.disparadorInterno} />
          </Pressable>

          <Pressable style={styles.lateral} onPress={() => setLado((l) => (l === 'back' ? 'front' : 'back'))}>
            <Icono nombre="girarCamara" tamano={22} color="#FFFFFF" />
            <Text style={styles.lateralTexto}>Girar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function BotonRedondo({
  icono,
  activo,
  onPress,
}: {
  icono: 'cerrar' | 'flash';
  activo?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.redondo, activo && styles.redondoActivo]} hitSlop={8}>
      <Icono nombre={icono} tamano={18} color={activo ? Colores.marino : '#FFFFFF'} />
    </Pressable>
  );
}

const ESQUINA = 28;

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: '#0B0F14',
  },
  flex: {
    flex: 1,
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espacio.lg,
    paddingVertical: Espacio.md,
  },
  titulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  redondo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visor: {
    flex: 1,
    margin: Espacio.xl,
    borderRadius: Radio.lg,
    overflow: 'hidden',
    backgroundColor: '#161C24',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.md,
    padding: Espacio.xl,
  },
  redondoActivo: {
    backgroundColor: '#FDE68A',
  },
  permiso: {
    alignItems: 'center',
    gap: Espacio.md,
  },
  botonPermiso: {
    paddingHorizontal: Espacio.xl,
    paddingVertical: Espacio.md,
    borderRadius: Radio.pill,
    backgroundColor: Colores.primario,
  },
  botonPermisoTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cargando: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.md,
    backgroundColor: 'rgba(11, 15, 20, 0.7)',
  },
  error: {
    fontSize: 13,
    color: '#FCA5A5',
    textAlign: 'center',
    marginTop: -Espacio.md,
    marginBottom: Espacio.md,
    paddingHorizontal: Espacio.xl,
  },
  esquina: {
    position: 'absolute',
    width: ESQUINA,
    height: ESQUINA,
    borderColor: '#FFFFFF',
  },
  supIzq: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  supDer: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  infIzq: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  infDer: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  ayuda: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Espacio.xl,
  },
  lateral: {
    alignItems: 'center',
    gap: Espacio.xs,
    width: 64,
  },
  lateralTexto: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  disparador: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disparadorInterno: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
});
