import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Boton } from '@/components/ui/Boton';
import { Campo } from '@/components/ui/Campo';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { useSesion } from '@/lib/sesion';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODIGO_VALIDO = /^\d{6,10}$/;

type Errores = { correo?: string; codigo?: string; contrasena?: string; confirmar?: string; general?: string };

// Recuperar contraseña · paso 1 envía un código al correo, paso 2 lo verifica y guarda la nueva contraseña
export default function Recuperar() {
  const [paso, setPaso] = useState<'correo' | 'codigo'>('correo');
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { enviarCodigoRecuperacion, restablecerContrasena } = useSesion();

  const enviarCodigo = async () => {
    if (!CORREO_VALIDO.test(correo.trim())) {
      setErrores({ correo: 'Ingresa un correo válido' });
      return;
    }
    setErrores({});
    setEnviando(true);
    const resultado = await enviarCodigoRecuperacion(correo);
    setEnviando(false);

    if (resultado.error) setErrores({ general: resultado.error });
    else {
      setAviso('');
      setPaso('codigo');
    }
  };

  const reenviar = async () => {
    setEnviando(true);
    const resultado = await enviarCodigoRecuperacion(correo);
    setEnviando(false);
    if (resultado.error) setErrores({ general: resultado.error });
    else setAviso('Te enviamos un nuevo código');
  };

  const guardar = async () => {
    const e: Errores = {};
    if (!CODIGO_VALIDO.test(codigo.trim())) e.codigo = 'Ingresa el código numérico del correo';
    if (contrasena.length < 6) e.contrasena = 'Mínimo 6 caracteres';
    if (confirmar !== contrasena) e.confirmar = 'Las contraseñas no coinciden';
    setErrores(e);
    if (Object.keys(e).length) return;

    setEnviando(true);
    const resultado = await restablecerContrasena(correo, codigo, contrasena);
    setEnviando(false);
    // Si no hay error, queda la sesión iniciada y Stack.Protected redirige al tablero
    if (resultado.error) setErrores({ general: resultado.error });
  };

  return (
    <SafeAreaView style={styles.pantalla}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <Pressable
            style={styles.volver}
            onPress={() => (paso === 'codigo' ? setPaso('correo') : router.back())}
            hitSlop={8}>
            <Icono nombre="atras" tamano={20} color={Colores.texto} />
            <Text style={styles.volverTexto}>Volver</Text>
          </Pressable>

          <View style={styles.tarjeta}>
            {paso === 'correo' ? (
              <>
                <View style={styles.encabezado}>
                  <Text style={styles.titulo}>Recuperar contraseña</Text>
                  <Text style={styles.subtitulo}>Te enviaremos un código a tu correo para crear una nueva</Text>
                </View>

                <Campo
                  etiqueta="Correo electrónico"
                  icono="correo"
                  placeholder="usuario@kantask.dev"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={correo}
                  onChangeText={setCorreo}
                  error={errores.correo}
                />

                {errores.general ? <Text style={styles.error}>{errores.general}</Text> : null}

                <Boton
                  titulo={enviando ? 'Enviando…' : 'Enviar código'}
                  onPress={enviarCodigo}
                  deshabilitado={enviando}
                />
              </>
            ) : (
              <>
                <View style={styles.encabezado}>
                  <Text style={styles.titulo}>Nueva contraseña</Text>
                  <Text style={styles.subtitulo}>
                    Ingresa el código que enviamos a {correo.trim()} y elige tu nueva contraseña
                  </Text>
                </View>

                <Campo
                  etiqueta="Código"
                  icono="seguridad"
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  maxLength={10}
                  value={codigo}
                  onChangeText={setCodigo}
                  error={errores.codigo}
                />
                <Campo
                  etiqueta="Nueva contraseña"
                  icono="candado"
                  placeholder="Mínimo 6 caracteres"
                  contrasena
                  autoComplete="new-password"
                  value={contrasena}
                  onChangeText={setContrasena}
                  error={errores.contrasena}
                />
                <Campo
                  etiqueta="Confirmar contraseña"
                  icono="candado"
                  placeholder="Repite la contraseña"
                  contrasena
                  autoComplete="new-password"
                  value={confirmar}
                  onChangeText={setConfirmar}
                  error={errores.confirmar}
                />

                {errores.general ? <Text style={styles.error}>{errores.general}</Text> : null}
                {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

                <Boton
                  titulo={enviando ? 'Guardando…' : 'Guardar contraseña'}
                  onPress={guardar}
                  deshabilitado={enviando}
                />

                <Pressable style={styles.reenviar} onPress={reenviar} disabled={enviando}>
                  <Text style={styles.enlace}>¿No te llegó? Reenviar código</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  flex: {
    flex: 1,
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Espacio.xl,
    gap: Espacio.xl,
  },
  volver: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Espacio.xs,
  },
  volverTexto: {
    fontSize: 15,
    color: Colores.texto,
  },
  tarjeta: {
    backgroundColor: Colores.superficie,
    borderRadius: Radio.xl,
    padding: Espacio.xl,
    gap: Espacio.lg,
    boxShadow: '0 8px 24px rgba(17, 24, 39, 0.06)',
  },
  encabezado: {
    gap: 2,
  },
  titulo: {
    fontSize: 20,
    fontWeight: '700',
    color: Colores.texto,
  },
  subtitulo: {
    fontSize: 13,
    color: Colores.textoSecundario,
  },
  error: {
    fontSize: 13,
    color: Colores.peligro,
  },
  aviso: {
    fontSize: 13,
    color: Colores.exito,
  },
  reenviar: {
    alignSelf: 'center',
  },
  enlace: {
    fontSize: 13,
    color: Colores.primario,
  },
});
