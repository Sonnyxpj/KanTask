import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Icono } from '@/components/ui/Icono';
import { Colores, Espacio, Radio } from '@/constants/colores';
import { useEquipo } from '@/lib/equipo';
import { formatearHace } from '@/lib/fechas';
import { useSesion } from '@/lib/sesion';
import { supabase } from '@/lib/supabase';
import { aComentario, borrarComentario, crearComentario, listarComentarios } from '@/services/actividad';
import type { Comentario, Usuario } from '@/types/modelos';

type Props = {
  tareaId: string;
  // Abrir con el campo enfocado (al venir de "Responder" en Actividad)
  enfocar?: boolean;
};

const primerNombre = (u: Usuario) => u.nombre.split(' ')[0];

// Comentarios de la tarea. Escribir "@" sugiere integrantes; cada mención
// genera un aviso "te mencionó" en la Actividad del mencionado (trigger en la BD).
export function Comentarios({ tareaId, enfocar }: Props) {
  const { sesion } = useSesion();
  const { usuarios, buscarUsuario } = useEquipo();
  const idActual = sesion?.user.id;

  const [lista, setLista] = useState<Comentario[]>([]);
  const [cargando, setCargando] = useState(!!supabase);
  const [error, setError] = useState('');
  const [texto, setTexto] = useState('');
  const [mencionados, setMencionados] = useState<Usuario[]>([]);
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<ComponentRef<typeof TextInput>>(null);

  // Carga inicial + comentarios nuevos en vivo
  useEffect(() => {
    if (!supabase) return;
    const cliente = supabase;
    let vigente = true;

    listarComentarios(tareaId)
      .then((c) => vigente && (setLista(c), setError('')))
      .catch((e: Error) => vigente && setError(e.message))
      .finally(() => vigente && setCargando(false));

    const canal = cliente
      .channel(`comentarios-${tareaId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comentarios', filter: `tarea_id=eq.${tareaId}` },
        (cambio) => {
          const nuevo = aComentario(cambio.new as Parameters<typeof aComentario>[0]);
          setLista((p) => (p.some((c) => c.id === nuevo.id) ? p : [...p, nuevo]));
        },
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comentarios' }, (cambio) => {
        const id = (cambio.old as { id?: string }).id;
        if (id) setLista((p) => p.filter((c) => c.id !== id));
      })
      .subscribe();

    return () => {
      vigente = false;
      cliente.removeChannel(canal);
    };
  }, [tareaId]);

  useEffect(() => {
    if (!enfocar) return;
    const t = setTimeout(() => campo.current?.focus(), 400);
    return () => clearTimeout(t);
  }, [enfocar]);

  // "@cam" al final del texto → sugerir integrantes que coincidan
  const consulta = texto.match(/@([\p{L}]*)$/u)?.[1]?.toLowerCase();
  const sugerencias =
    consulta === undefined
      ? []
      : usuarios.filter((u) => u.id !== idActual && primerNombre(u).toLowerCase().startsWith(consulta)).slice(0, 5);

  const mencionar = (u: Usuario) => {
    setTexto((t) => t.replace(/@([\p{L}]*)$/u, `@${primerNombre(u)} `));
    setMencionados((p) => (p.some((m) => m.id === u.id) ? p : [...p, u]));
    campo.current?.focus();
  };

  const enviar = async () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    // Solo cuentan las menciones que siguen escritas en el texto
    const menciones = mencionados.filter((u) => limpio.includes(`@${primerNombre(u)}`)).map((u) => u.id);

    setEnviando(true);
    setError('');
    try {
      const nuevo = supabase
        ? await crearComentario(tareaId, limpio, menciones)
        : {
            id: `c${Date.now()}`,
            tareaId,
            usuarioId: idActual ?? '',
            texto: limpio,
            menciones,
            fecha: new Date().toISOString(),
          };
      setLista((p) => (p.some((c) => c.id === nuevo.id) ? p : [...p, nuevo]));
      setTexto('');
      setMencionados([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el comentario');
    } finally {
      setEnviando(false);
    }
  };

  const borrar = async (id: string) => {
    try {
      await borrarComentario(id);
      setLista((p) => p.filter((c) => c.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar el comentario');
    }
  };

  return (
    <View style={styles.contenedor}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Comentarios</Text>
        <Text style={styles.contador}>{lista.length}</Text>
      </View>

      {cargando ? (
        <ActivityIndicator color={Colores.primario} />
      ) : lista.length === 0 ? (
        <Text style={styles.vacio}>Sin comentarios. Usa @ para mencionar a alguien del equipo.</Text>
      ) : (
        lista.map((c) => {
          const autor = buscarUsuario(c.usuarioId);
          return (
            <View key={c.id} style={styles.comentario}>
              <Avatar nombre={autor?.nombre ?? '?'} tamano={28} />
              <View style={styles.cuerpo}>
                <View style={styles.fila}>
                  <Text style={styles.autor}>{autor?.nombre ?? 'Integrante'}</Text>
                  <Text style={styles.hace}>{formatearHace(c.fecha)}</Text>
                  {c.usuarioId === idActual && (
                    <Pressable onPress={() => borrar(c.id)} hitSlop={6}>
                      <Text style={styles.borrar}>Borrar</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.texto}>
                  {c.texto.split(/(@[\p{L}]+)/u).map((parte, i) => (
                    <Text key={i} style={parte.startsWith('@') ? styles.mencion : undefined}>
                      {parte}
                    </Text>
                  ))}
                </Text>
              </View>
            </View>
          );
        })
      )}

      {sugerencias.length > 0 && (
        <View style={styles.sugerencias}>
          {sugerencias.map((u) => (
            <Pressable key={u.id} onPress={() => mencionar(u)} style={styles.sugerencia}>
              <Avatar nombre={u.nombre} tamano={20} />
              <Text style={styles.sugerenciaTexto}>{u.nombre}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.entrada}>
        <TextInput
          ref={campo}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe un comentario… (@ para mencionar)"
          placeholderTextColor={Colores.textoTenue}
          maxLength={500}
          multiline
          style={styles.input}
        />
        <Pressable
          onPress={enviar}
          disabled={!texto.trim() || enviando}
          style={[styles.enviar, (!texto.trim() || enviando) && styles.enviarInactivo]}
          hitSlop={6}>
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Icono nombre="enviar" tamano={16} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

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
  vacio: {
    fontSize: 13,
    color: Colores.textoTenue,
  },
  comentario: {
    flexDirection: 'row',
    gap: Espacio.sm,
  },
  cuerpo: {
    flex: 1,
    gap: 2,
    padding: Espacio.md,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.sm,
  },
  autor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colores.texto,
  },
  hace: {
    flex: 1,
    fontSize: 11,
    color: Colores.textoTenue,
  },
  borrar: {
    fontSize: 11,
    fontWeight: '600',
    color: Colores.peligro,
  },
  texto: {
    fontSize: 14,
    lineHeight: 20,
    color: Colores.texto,
  },
  mencion: {
    fontWeight: '700',
    color: Colores.primario,
  },
  sugerencias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacio.sm,
  },
  sugerencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.xs + 2,
    paddingLeft: Espacio.xs,
    paddingRight: Espacio.md,
    paddingVertical: Espacio.xs,
    borderRadius: Radio.pill,
    borderWidth: 1,
    borderColor: Colores.primario,
    backgroundColor: Colores.primarioSuave,
  },
  sugerenciaTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: Colores.primario,
  },
  entrada: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Espacio.sm,
    padding: Espacio.sm,
    paddingLeft: Espacio.md,
    borderRadius: Radio.md,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.superficie,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 14,
    color: Colores.texto,
    paddingVertical: Espacio.xs + 2,
  },
  enviar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enviarInactivo: {
    backgroundColor: Colores.textoTenue,
  },
  error: {
    fontSize: 12,
    color: Colores.peligro,
  },
});
