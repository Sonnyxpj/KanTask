import type { AuthError, Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';

type Resultado = { error?: string; requiereConfirmacion?: boolean };

type ContextoSesion = {
  sesion: Session | null;
  cargando: boolean;
  modoDemo: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<Resultado>;
  registrarse: (nombre: string, correo: string, contrasena: string) => Promise<Resultado>;
  cerrarSesion: () => Promise<void>;
  enviarCodigoRecuperacion: (correo: string) => Promise<Resultado>;
  restablecerContrasena: (correo: string, codigo: string, nueva: string) => Promise<Resultado>;
};

const Contexto = createContext<ContextoSesion | null>(null);

export function useSesion() {
  const valor = use(Contexto);
  if (!valor) throw new Error('useSesion debe usarse dentro de <ProveedorSesion />');
  return valor;
}

// Mensajes de Supabase Auth traducidos para mostrar en pantalla
function traducirError(error: AuthError): string {
  const mensaje = error.message.toLowerCase();
  if (mensaje.includes('invalid login credentials')) return 'Correo o contraseña incorrectos';
  if (mensaje.includes('email not confirmed')) return 'Debes confirmar tu correo antes de ingresar';
  if (mensaje.includes('already registered')) return 'Ya existe una cuenta con ese correo';
  if (mensaje.includes('password should be')) return 'La contraseña debe tener al menos 6 caracteres';
  if (mensaje.includes('invalid') && mensaje.includes('email')) return 'El correo no es válido';
  if (mensaje.includes('rate limit') || mensaje.includes('security purposes')) return 'Demasiados intentos, espera un momento';
  if (mensaje.includes('token has expired') || mensaje.includes('otp')) return 'El código es incorrecto o ya expiró';
  if (mensaje.includes('error sending')) return 'No se pudo enviar el correo. Intenta de nuevo más tarde';
  if (mensaje.includes('different from the old')) return 'La nueva contraseña debe ser distinta a la anterior';
  return error.message;
}

const SIN_BACKEND = 'No hay conexión con el servidor (faltan las variables de Supabase)';

export function ProveedorSesion({ children }: PropsWithChildren) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(!!supabase);
  // Durante la recuperación no se publica la sesión, para que Stack.Protected
  // no saque al usuario de la pantalla antes de guardar la nueva contraseña
  const recuperando = useRef(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setCargando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      if (!recuperando.current) setSesion(nueva);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const iniciarSesion = async (correo: string, contrasena: string): Promise<Resultado> => {
    if (!supabase) return { error: SIN_BACKEND };
    const { error } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena });
    return error ? { error: traducirError(error) } : {};
  };

  const registrarse = async (nombre: string, correo: string, contrasena: string): Promise<Resultado> => {
    if (!supabase) return { error: SIN_BACKEND };
    // El trigger al_registrar_usuario crea el perfil en public.usuarios con options.data.nombre
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: contrasena,
      options: { data: { nombre: nombre.trim() } },
    });
    if (error) return { error: traducirError(error) };
    // Sin sesión significa que el proyecto exige confirmar el correo
    return { requiereConfirmacion: !data.session };
  };

  const cerrarSesion = async () => {
    await supabase?.auth.signOut();
  };

  const enviarCodigoRecuperacion = async (correo: string): Promise<Resultado> => {
    if (!supabase) return { error: SIN_BACKEND };
    const { error } = await supabase.auth.resetPasswordForEmail(correo.trim());
    return error ? { error: traducirError(error) } : {};
  };

  const restablecerContrasena = async (correo: string, codigo: string, nueva: string): Promise<Resultado> => {
    if (!supabase) return { error: SIN_BACKEND };
    recuperando.current = true;
    try {
      const verificacion = await supabase.auth.verifyOtp({ email: correo.trim(), token: codigo.trim(), type: 'recovery' });
      if (verificacion.error) return { error: traducirError(verificacion.error) };

      const cambio = await supabase.auth.updateUser({ password: nueva });
      if (cambio.error) {
        // No dejar una sesión abierta si la contraseña no se pudo cambiar
        await supabase.auth.signOut();
        return { error: traducirError(cambio.error) };
      }
      setSesion(verificacion.data.session);
      return {};
    } finally {
      recuperando.current = false;
    }
  };

  return (
    <Contexto.Provider
      value={{
        sesion,
        cargando,
        modoDemo: !supabase,
        iniciarSesion,
        registrarse,
        cerrarSesion,
        enviarCodigoRecuperacion,
        restablecerContrasena,
      }}>
      {children}
    </Contexto.Provider>
  );
}
