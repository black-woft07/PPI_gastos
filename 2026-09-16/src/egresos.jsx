import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Egresos({ session }) {
  const [egresos, setEgresos] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [editingId, setEditingId] = useState(null)

  const cargarEgresos = async () => {
    if (!session?.user?.id) return

    setLoading(true)

    const { data, error } = await supabase
      .from('egresos')
      .select('*')
      .eq('id_usuario', session.user.id)
      .order('fecha', { ascending: false })
      .order('id_egreso', { ascending: false })

    if (error) {
      setErrorMsg(error.message)
      setEgresos([])
    } else {
      setEgresos(data)
      setErrorMsg('')
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarEgresos()
  }, [session])

  const limpiarFormulario = () => {
    setMonto('')
    setFecha(new Date().toISOString().split('T')[0])
    setCategoria('')
    setDescripcion('')
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!monto || Number(monto) <= 0) {
      setErrorMsg('El monto debe ser mayor a 0.')
      return
    }

    const payload = {
      id_usuario: session.user.id,
      monto: Number(monto),
      fecha,
      categoria: categoria || null,
      descripcion: descripcion || null,
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('egresos')
          .update(payload)
          .eq('id_egreso', editingId)
          .eq('id_usuario', session.user.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('egresos').insert(payload)

        if (error) throw error
      }

      limpiarFormulario()
      await cargarEgresos()
    } catch (error) {
      setErrorMsg(error.message)
    }
  }

  const handleEditar = (egreso) => {
    setEditingId(egreso.id_egreso)
    setMonto(String(egreso.monto))
    setFecha(egreso.fecha)
    setCategoria(egreso.categoria || '')
    setDescripcion(egreso.descripcion || '')
  }

  const handleEliminar = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este egreso?')
    if (!confirmar) return

    const { error } = await supabase
      .from('egresos')
      .delete()
      .eq('id_egreso', id)
      .eq('id_usuario', session.user.id)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    cargarEgresos()
  }

  return (
    <div style={{ maxWidth: 700, margin: '20px auto' }}>
      <h2>Mis egresos</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div>
          <label>Monto</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Categoría</label>
          <input
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Ej: alimentación, transporte"
          />
        </div>

        <div>
          <label>Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalle del gasto"
          />
        </div>

        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

        <button type="submit">
          {editingId ? 'Guardar cambios' : 'Registrar egreso'}
        </button>
        {editingId && (
          <button type="button" onClick={limpiarFormulario}>
            Cancelar edición
          </button>
        )}
      </form>

      {loading ? (
        <p>Cargando egresos...</p>
      ) : egresos.length === 0 ? (
        <p>Aún no tienes egresos registrados.</p>
      ) : (
        <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th align="left">Monto</th>
              <th align="left">Fecha</th>
              <th align="left">Categoría</th>
              <th align="left">Descripción</th>
              <th align="left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {egresos.map((egreso) => (
              <tr key={egreso.id_egreso} style={{ borderBottom: '1px solid #eee' }}>
                <td>${Number(egreso.monto).toFixed(2)}</td>
                <td>{egreso.fecha}</td>
                <td>{egreso.categoria || '-'}</td>
                <td>{egreso.descripcion || '-'}</td>
                <td>
                  <button onClick={() => handleEditar(egreso)}>Editar</button>{' '}
                  <button onClick={() => handleEliminar(egreso.id_egreso)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}