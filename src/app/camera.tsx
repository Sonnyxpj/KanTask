import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icono } from '@/components/ui/Icono';
import { Espacio, Radio } from '@/constants/colores';

// Cámara / galería para evidencia (solo diseño: la vista previa real se conectará con expo-camera)
export default function Camara() {
  return (
    <View style={styles.pantalla}>
      <SafeAreaView style={styles.flex}>
        <View style={styles.barra}>
          <BotonRedondo icono="cerrar" onPress={() => router.back()} />
          <Text style={styles.titulo}>Evidencia de cierre</Text>
          <BotonRedondo icono="flash" />
        </View>

        <View style={styles.visor}>
          <View style={[styles.esquina, styles.supIzq]} />
          <View style={[styles.esquina, styles.supDer]} />
          <View style={[styles.esquina, styles.infIzq]} />
          <View style={[styles.esquina, styles.infDer]} />
          <Icono nombre="camara" tamano={40} color="rgba(255,255,255,0.35)" />
          <Text style={styles.ayuda}>Encuadra la pantalla, pizarra o error a documentar</Text>
        </View>

        <View style={styles.controles}>
          <Pressable style={styles.lateral} onPress={() => router.back()}>
            <Icono nombre="galeria" tamano={22} color="#FFFFFF" />
            <Text style={styles.lateralTexto}>Galería</Text>
          </Pressable>

          <Pressable style={({ pressed }) => [styles.disparador, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
            <View style={styles.disparadorInterno} />
          </Pressable>

          <Pressable style={styles.lateral}>
            <Icono nombre="girarCamara" tamano={22} color="#FFFFFF" />
            <Text style={styles.lateralTexto}>Girar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function BotonRedondo({ icono, onPress }: { icono: 'cerrar' | 'flash'; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.redondo} hitSlop={8}>
      <Icono nombre={icono} tamano={18} color="#FFFFFF" />
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
    backgroundColor: '#161C24',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.md,
    padding: Espacio.xl,
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
