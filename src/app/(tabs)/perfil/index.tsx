import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModalContrasena } from '@/components/perfil/ModalContrasena';
import { ModalEditarPerfil } from '@/components/perfil/ModalEditarPerfil';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Boton } from '@/components/ui/Boton';
import { Encabezado } from '@/components/ui/Encabezado';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { ROLES } from '@/constants/estados';
import { useEquipo } from '@/lib/equipo';
import { cambiarNotificaciones, notificacionesActivas } from '@/lib/notificaciones';
import { useSesion } from '@/lib/sesion';
import type { Usuario } from '@/types/modelos';

// Pantalla 6 · Perfil
export default function Perfil() {
  const [notificaciones, setNotificaciones] = useState(notificacionesActivas);
  const [editando, setEditando] = useState(false);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
  const [correoPendiente, setCorreoPendiente] = useState('');
  const [aviso, setAviso] = useState('');
  const { cerrarSesion, modoDemo } = useSesion();
  const { actual: usuario, cargando, error, recargar } = useEquipo();

  // Con sesión real, el Stack.Protected vuelve al login al cerrar sesión
  const salir = async () => {
    await cerrarSesion();
    if (modoDemo) router.replace('/');
  };

  // Guarda la preferencia; al activar pide permiso al sistema
  const alternarNotificaciones = async (activar: boolean) => {
    setNotificaciones(activar);
    const activas = await cambiarNotificaciones(activar);
    setNotificaciones(activas);
    setAviso(
      activar && !activas
        ? 'Permite las notificaciones de KanTask en los ajustes del teléfono para recibir avisos.'
        : '',
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.pantalla}>
      <Encabezado
        titulo="Perfil"
        subtitulo="Cuenta y preferencias"
        accion={
          <Pressable style={styles.botonEditar} onPress={() => setEditando(true)} disabled={!usuario} hitSlop={8}>
            <Icono nombre="editar" tamano={16} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.contenido}>
        {!usuario ? (
          <View style={styles.cargando}>
            {cargando ? (
              <ActivityIndicator color={Colores.primario} />
            ) : (
              <Text style={styles.error}>{error || 'No se encontró tu perfil'}</Text>
            )}
          </View>
        ) : (
          <TarjetaUsuario usuario={usuario} />
        )}

        <View style={styles.grupo}>
          <Dato icono="correo" etiqueta="Correo electrónico" valor={usuario?.correo ?? '—'} />
          <View style={styles.separador} />
          <Dato icono="telefono" etiqueta="Teléfono" valor={usuario?.telefono ?? '—'} />
        </View>

        {aviso ? <Text style={styles.aviso}>{aviso}</Text> : null}

        {correoPendiente ? (
          <Text style={styles.aviso}>
            Te enviamos un enlace a {correoPendiente}. Tu correo cambiará cuando lo confirmes.
          </Text>
        ) : null}

        <Text style={styles.seccion}>AJUSTES PRINCIPALES</Text>
        <View style={styles.grupo}>
          <Ajuste
            icono="actividad"
            titulo="Notificaciones"
            detalle={
              Platform.OS === 'web'
                ? 'Disponibles en la app de iOS y Android'
                : 'Asignaciones, menciones y tareas por vencer'
            }>
            <Switch
              value={notificaciones}
              onValueChange={alternarNotificaciones}
              disabled={Platform.OS === 'web'}
              trackColor={{ true: Colores.primario, false: Colores.borde }}
              thumbColor="#FFFFFF"
            />
          </Ajuste>
          <View style={styles.separador} />
          <Ajuste
            icono="seguridad"
            titulo="Seguridad y acceso"
            detalle="Cambiar contraseña"
            onPress={modoDemo ? undefined : () => setCambiandoContrasena(true)}
          />
          <View style={styles.separador} />
          <Ajuste
            icono="equipo"
            titulo="Configuración de equipo"
            detalle="Integrantes y roles del tablero"
            onPress={() => router.navigate('/equipo')}
          />
          <View style={styles.separador} />
          {/* Por ahora la app solo está en español: fila informativa, sin acción */}
          <Ajuste icono="idioma" titulo="Idioma" detalle="Español (único idioma disponible)" />
        </View>

        <Boton titulo="Cerrar sesión" icono="salir" variante="peligro" onPress={salir} />
      </ScrollView>

      <ModalContrasena
        visible={cambiandoContrasena}
        onCerrar={() => setCambiandoContrasena(false)}
        onCambiada={() => setAviso('Tu contraseña se cambió correctamente.')}
      />

      {usuario && (
        <ModalEditarPerfil
          visible={editando}
          usuario={usuario}
          onCerrar={() => setEditando(false)}
          onGuardado={(_actualizado, pendiente) => {
            recargar();
            if (pendiente) setCorreoPendiente(pendiente);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function TarjetaUsuario({ usuario }: { usuario: Usuario }) {
  const rol = ROLES[usuario.rol];
  return (
    <View style={styles.tarjetaUsuario}>
      <Avatar nombre={usuario.nombre} tamano={60} />
      <View style={styles.usuarioInfo}>
        <Text style={styles.nombre}>{usuario.nombre}</Text>
        {usuario.cargo ? <Text style={styles.cargo}>{usuario.cargo}</Text> : null}
        <View style={styles.badges}>
          <Badge
            texto={usuario.turno ? `${usuario.turno} · KanTask` : 'KanTask'}
            color="#FFFFFF"
            fondo={Colores.marinoClaro}
            punto
          />
          <Badge texto={rol.etiqueta} color={rol.color} fondo={rol.fondo} />
        </View>
      </View>
    </View>
  );
}

function Dato({ icono, etiqueta, valor }: { icono: NombreIcono; etiqueta: string; valor: string }) {
  return (
    <View style={styles.fila}>
      <View style={styles.iconoCaja}>
        <Icono nombre={icono} tamano={16} color={Colores.primario} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.etiqueta}>{etiqueta}</Text>
        <Text style={styles.valor}>{valor}</Text>
      </View>
    </View>
  );
}

function Ajuste({
  icono,
  titulo,
  detalle,
  onPress,
  children,
}: {
  icono: NombreIcono;
  titulo: string;
  detalle: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.fila, pressed && onPress && { opacity: 0.7 }]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.iconoCaja}>
        <Icono nombre={icono} tamano={16} color={Colores.texto} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.valor}>{titulo}</Text>
        <Text style={styles.etiqueta}>{detalle}</Text>
      </View>
      {children ?? (onPress ? <Icono nombre="siguiente" tamano={14} color={Colores.textoTenue} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cargando: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontSize: 13,
    color: Colores.peligro,
  },
  aviso: {
    fontSize: 13,
    color: Colores.textoSecundario,
    paddingHorizontal: Espacio.xs,
  },
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  flex: {
    flex: 1,
  },
  botonEditar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contenido: {
    paddingHorizontal: Espacio.lg,
    paddingBottom: Espacio.xl,
    gap: Espacio.lg,
  },
  tarjetaUsuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.lg,
    padding: Espacio.lg,
    borderRadius: Radio.lg,
    backgroundColor: Colores.marino,
  },
  usuarioInfo: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cargo: {
    fontSize: 13,
    color: '#C9D4DF',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacio.xs,
    marginTop: Espacio.xs,
  },
  grupo: {
    paddingHorizontal: Espacio.md,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.md,
    paddingVertical: Espacio.md,
  },
  iconoCaja: {
    width: 32,
    height: 32,
    borderRadius: Radio.sm,
    backgroundColor: Colores.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etiqueta: {
    fontSize: 12,
    color: Colores.textoSecundario,
  },
  valor: {
    fontSize: 14,
    fontWeight: '600',
    color: Colores.texto,
  },
  separador: {
    height: 1,
    backgroundColor: Colores.borde,
    marginLeft: 44,
  },
  seccion: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colores.textoSecundario,
    marginBottom: -Espacio.sm,
  },
});
