import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModalEditarPerfil } from '@/components/perfil/ModalEditarPerfil';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Boton } from '@/components/ui/Boton';
import { Encabezado } from '@/components/ui/Encabezado';
import { Icono, type NombreIcono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { ROLES } from '@/constants/estados';
import { useEquipo } from '@/lib/equipo';
import { useSesion } from '@/lib/sesion';
import type { Usuario } from '@/types/modelos';

// Pantalla 6 · Perfil
export default function Perfil() {
  const [notificaciones, setNotificaciones] = useState(true);
  const [editando, setEditando] = useState(false);
  const [correoPendiente, setCorreoPendiente] = useState('');
  const { cerrarSesion, modoDemo } = useSesion();
  const { actual: usuario, cargando, error, recargar } = useEquipo();

  // Con sesión real, el Stack.Protected vuelve al login al cerrar sesión
  const salir = async () => {
    await cerrarSesion();
    if (modoDemo) router.replace('/');
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

        {correoPendiente ? (
          <Text style={styles.aviso}>
            Te enviamos un enlace a {correoPendiente}. Tu correo cambiará cuando lo confirmes.
          </Text>
        ) : null}

        <Text style={styles.seccion}>AJUSTES PRINCIPALES</Text>
        <View style={styles.grupo}>
          <Ajuste icono="actividad" titulo="Notificaciones" detalle="Tareas asignadas y cambios de estado">
            <Switch
              value={notificaciones}
              onValueChange={setNotificaciones}
              trackColor={{ true: Colores.primario, false: Colores.borde }}
              thumbColor="#FFFFFF"
            />
          </Ajuste>
          <View style={styles.separador} />
          <Ajuste icono="seguridad" titulo="Seguridad y acceso" detalle="Contraseña y verificación" />
          <View style={styles.separador} />
          <Ajuste icono="equipo" titulo="Configuración de equipo" detalle="Integrantes y roles del tablero" />
          <View style={styles.separador} />
          <Ajuste icono="idioma" titulo="Idioma" detalle="Español" />
        </View>

        <Boton titulo="Cerrar sesión" icono="salir" variante="peligro" onPress={salir} />
      </ScrollView>

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
  children,
}: {
  icono: NombreIcono;
  titulo: string;
  detalle: string;
  children?: React.ReactNode;
}) {
  return (
    <Pressable style={styles.fila}>
      <View style={styles.iconoCaja}>
        <Icono nombre={icono} tamano={16} color={Colores.texto} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.valor}>{titulo}</Text>
        <Text style={styles.etiqueta}>{detalle}</Text>
      </View>
      {children ?? <Icono nombre="siguiente" tamano={14} color={Colores.textoTenue} />}
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
