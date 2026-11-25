// Servicio de tareas con un cliente de Supabase simulado: se verifica qué se envía a la BD
// y que los errores de RLS / triggers llegan traducidos a la interfaz.

import { crearTarea, moverTarea, subirEvidencia } from '@/services/tareas';

type Respuesta = { data?: unknown; error?: { message: string; code?: string } | null };

const llamadas: { tabla: string; operacion: string; valores?: unknown; filtros: unknown[] }[] = [];
let respuestas: Respuesta[] = [];

// Constructor de consultas encadenable: cada consulta consume la siguiente respuesta preparada
function mockConsulta(tabla: string) {
  const registro = { tabla, operacion: 'select', valores: undefined as unknown, filtros: [] as unknown[] };
  llamadas.push(registro);
  const resultado = () => Promise.resolve({ data: null, error: null, ...respuestas.shift() });
  const builder: Record<string, unknown> = {
    then: (ok: (v: unknown) => unknown, mal: (e: unknown) => unknown) => resultado().then(ok, mal),
  };
  for (const op of ['insert', 'update', 'delete', 'select'])
    builder[op] = (valores?: unknown) => {
      if (op !== 'select' || registro.operacion === 'select') registro.operacion = op;
      if (op !== 'select') registro.valores = valores;
      return builder;
    };
  for (const f of ['eq', 'in', 'order', 'limit', 'not'])
    builder[f] = (...args: unknown[]) => {
      registro.filtros.push([f, ...args]);
      return builder;
    };
  builder.single = resultado;
  builder.maybeSingle = resultado;
  return builder;
}

const mockStorage = {
  upload: jest.fn(() => Promise.resolve({ error: null })),
  remove: jest.fn(() => Promise.resolve({ error: null })),
};

// Lectura de la foto local (expo-file-system)
let mockBytes = 8;
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(mockBytes)) })),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: { from: (t: string) => mockConsulta(t), storage: { from: () => mockStorage } },
}));

const valores = {
  titulo: '  Configurar Auth  ',
  descripcion: '',
  prioridad: 'alta' as const,
  fechaLimite: '2026-11-24T14:00:00.000Z',
  asignadoA: 'u1',
  checklist: [{ descripcion: 'Crear proyecto' }, { descripcion: '   ' }, { descripcion: 'Probar login' }],
};

beforeEach(() => {
  llamadas.length = 0;
  respuestas = [];
  jest.clearAllMocks();
});

describe('crearTarea', () => {
  it('inserta la tarea en Pendiente y su checklist sin ítems vacíos', async () => {
    respuestas = [{ data: { id: 't1' } }, {}];
    await expect(crearTarea('col-pendiente', valores)).resolves.toBe('t1');

    expect(llamadas[0]).toMatchObject({
      tabla: 'tareas',
      operacion: 'insert',
      valores: { titulo: 'Configurar Auth', columna_id: 'col-pendiente', estado: 'pendiente', asignado_a: 'u1' },
    });
    expect(llamadas[1]).toMatchObject({
      tabla: 'checklist_items',
      operacion: 'insert',
      valores: [
        { tarea_id: 't1', descripcion: 'Crear proyecto', orden: 0 },
        { tarea_id: 't1', descripcion: 'Probar login', orden: 1 },
      ],
    });
  });

  it('si falla el checklist deshace la tarea creada', async () => {
    respuestas = [{ data: { id: 't1' } }, { error: { message: 'boom' } }, {}];
    await expect(crearTarea('col-pendiente', valores)).rejects.toThrow('No se pudo guardar el checklist');
    expect(llamadas[2]).toMatchObject({ tabla: 'tareas', operacion: 'delete', filtros: [['eq', 'id', 't1']] });
  });

  it('un Visualizador recibe un mensaje de permisos (RLS)', async () => {
    respuestas = [{ error: { message: 'new row violates row-level security policy', code: '42501' } }];
    await expect(crearTarea('col', valores)).rejects.toThrow('No tienes permiso para hacer esto');
  });
});

describe('moverTarea', () => {
  it('actualiza estado y columna', async () => {
    respuestas = [{}];
    await moverTarea('t1', 'en_progreso', 'col-progreso');
    expect(llamadas[0]).toMatchObject({
      tabla: 'tareas',
      operacion: 'update',
      valores: { estado: 'en_progreso', columna_id: 'col-progreso' },
    });
  });

  it('muestra el mensaje del trigger validar_cierre_tarea', async () => {
    respuestas = [{ error: { message: 'La tarea necesita al menos una foto de evidencia para cerrarse' } }];
    await expect(moverTarea('t1', 'terminado', 'col-fin')).rejects.toThrow(
      'La tarea necesita al menos una foto de evidencia para cerrarse',
    );
  });
});

describe('subirEvidencia', () => {
  beforeEach(() => {
    mockBytes = 8;
  });

  it('rechaza una foto vacía sin subirla', async () => {
    mockBytes = 0;
    mockStorage.upload.mockClear();
    await expect(subirEvidencia('t1', 'file:///foto.jpg')).rejects.toThrow('vacía');
    expect(mockStorage.upload).not.toHaveBeenCalled();
  });

  it('sube la foto al bucket y registra la evidencia', async () => {
    respuestas = [{ data: { id: 'e1', tarea_id: 't1', url_foto: 't1/1.jpg', fecha: '2026-11-23T10:00:00Z' } }];
    const evidencia = await subirEvidencia('t1', 'file:///foto.jpg', 'image/jpeg');

    expect(mockStorage.upload).toHaveBeenCalledWith(expect.stringMatching(/^t1\/\d+\.jpg$/), expect.any(ArrayBuffer), {
      contentType: 'image/jpeg',
      upsert: false,
    });
    expect(llamadas[0]).toMatchObject({ tabla: 'evidencias', operacion: 'insert' });
    expect(evidencia).toEqual({ id: 'e1', tareaId: 't1', urlFoto: 't1/1.jpg', fecha: '2026-11-23T10:00:00Z' });
  });

  it('formatos no admitidos por el bucket (p. ej. HEIC) se suben como JPEG', async () => {
    respuestas = [{ data: { id: 'e1', tarea_id: 't1', url_foto: 'x', fecha: 'x' } }];
    await subirEvidencia('t1', 'file:///foto.heic', 'image/heic');
    expect(mockStorage.upload).toHaveBeenCalledWith(expect.stringMatching(/\.jpg$/), expect.anything(), {
      contentType: 'image/jpeg',
      upsert: false,
    });
  });

  it('si falla el registro en la BD borra la foto subida', async () => {
    respuestas = [{ error: { message: 'error' } }];
    await expect(subirEvidencia('t1', 'file:///foto.jpg')).rejects.toThrow('No se pudo guardar la evidencia');
    expect(mockStorage.remove).toHaveBeenCalledWith([expect.stringMatching(/^t1\//)]);
  });
});
