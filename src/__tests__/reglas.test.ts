import { motivoNoCierre, textoActividad } from '@/lib/reglas';
import type { Actividad, ChecklistItem, Evidencia, Usuario } from '@/types/modelos';

const item = (completado: boolean): ChecklistItem => ({
  id: Math.random().toString(),
  tareaId: 't1',
  descripcion: 'Ítem',
  completado,
});
const foto: Evidencia = { id: 'e1', tareaId: 't1', urlFoto: 't1/1.jpg', fecha: '2026-11-23T10:00:00Z' };

describe('motivoNoCierre (regla de cierre: checklist completo + al menos 1 foto)', () => {
  it('permite cerrar con el checklist completo y una foto', () => {
    expect(motivoNoCierre([item(true), item(true)], [foto])).toBeNull();
  });

  it('bloquea si falta algún ítem del checklist', () => {
    expect(motivoNoCierre([item(true), item(false)], [foto])).toBe('Completa todos los ítems del checklist');
  });

  it('bloquea si no hay fotos de evidencia', () => {
    expect(motivoNoCierre([item(true)], [])).toBe('Agrega al menos una foto de evidencia');
  });

  it('el checklist se revisa antes que las fotos', () => {
    expect(motivoNoCierre([item(false)], [])).toBe('Completa todos los ítems del checklist');
  });

  it('una tarea sin checklist solo necesita la foto', () => {
    expect(motivoNoCierre([], [foto])).toBeNull();
    expect(motivoNoCierre([], [])).not.toBeNull();
  });
});

describe('textoActividad (texto personalizado del feed)', () => {
  const camila: Usuario = {
    id: 'u2',
    nombre: 'Camila Rojas',
    correo: 'c@kantask.dev',
    rol: 'editor',
    turno: '',
    enVivo: false,
  };
  const buscar = (id: string) => (id === camila.id ? camila : undefined);
  const asignacion: Actividad = {
    id: 'a1',
    tipo: 'asignacion',
    texto: "Se asignó 'Diseñar perfil'",
    usuarioId: 'u1',
    destinatarioId: 'u2',
    fecha: '2026-11-23T10:00:00Z',
  };

  it('si la tarea se asignó a mí dice "Se te asignó"', () => {
    expect(textoActividad(asignacion, 'u2', buscar)).toBe("Se te asignó 'Diseñar perfil'");
  });

  it('si se asignó a otra persona agrega su primer nombre', () => {
    expect(textoActividad(asignacion, 'u9', buscar)).toBe("Se asignó 'Diseñar perfil' a Camila");
  });

  it('si no se conoce al destinatario deja el texto original', () => {
    expect(textoActividad({ ...asignacion, destinatarioId: 'u7' }, 'u9', buscar)).toBe(asignacion.texto);
  });

  it('otros tipos de actividad no se modifican', () => {
    const cambio: Actividad = { ...asignacion, tipo: 'cambio', texto: "'X' pasó a En progreso" };
    expect(textoActividad(cambio, 'u2', buscar)).toBe(cambio.texto);
  });
});
