import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Ingresos({ session }) {
  const [ingresos, setIngresos] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [descripcion, setDescripcion] = useState('')
  const [editingId, setEditingId] = useState(null)

  const cargarIngresos = async () => {
    if (!session?.user?.id) return

    setLoading(true)

    const { data, error } = await supabase
      .from('ingresos')
      .select('*')
      .eq('id_usuario', session.user.id)
      .order('fecha', { ascending: false })
      .order('id_ingreso', { ascending: false })

    if (error) {
      setErrorMsg(error.message)
      setIngresos([])
    } else {
      setIngresos(data)
      setErrorMsg('')
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarIngresos()
  }, [session])

  const limpiarFormulario = () => {
    setMonto('')
    setFecha(new Date().toISOString().split('T')[0])
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
      descripcion: descripcion || null,
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('ingresos')
          .update(payload)
          .eq('id_ingreso', editingId)
          .eq('id_usuario', session.user.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('ingresos').insert(payload)

        if (error) throw error
      }

      limpiarFormulario()
      await cargarIngresos()
    } catch (error) {
      setErrorMsg(error.message)
    }
  }

  const handleEditar = (ingreso) => {
    setEditingId(ingreso.id_ingreso)
    setMonto(String(ingreso.monto))
    setFecha(ingreso.fecha)
    setDescripcion(ingreso.descripcion || '')
  }

  const handleEliminar = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este ingreso?')
    if (!confirmar) return

    const { error } = await supabase
      .from('ingresos')
      .delete()
      .eq('id_ingreso', id)
      .eq('id_usuario', session.user.id)

    if (error) {
      setErrorMsg(error.message)
      return
    }

    cargarIngresos()
  }

  return (
    <div style={{ maxWidth: 700, margin: '20px auto' }}>
      <h2>Mis ingresos</h2>

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
          <label>Descripción</label>
          <input
            type="text"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalle del ingreso"
          />
        </div>

        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

        <button type="submit">
          {editingId ? 'Guardar cambios' : 'Registrar ingreso'}
        </button>
        {editingId && (
          <button type="button" onClick={limpiarFormulario}>
            Cancelar edición
          </button>
        )}
      </form>

      {loading ? (
        <p>Cargando ingresos...</p>
      ) : ingresos.length === 0 ? (
        <p>Aún no tienes ingresos registrados.</p>
      ) : (
        <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th align="left">Monto</th>
              <th align="left">Fecha</th>
              <th align="left">Descripción</th>
              <th align="left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ingresos.map((ingreso) => (
              <tr key={ingreso.id_ingreso} style={{ borderBottom: '1px solid #eee' }}>
                <td>${Number(ingreso.monto).toFixed(2)}</td>
                <td>{ingreso.fecha}</td>
                <td>{ingreso.descripcion || '-'}</td>
                <td>
                  <button onClick={() => handleEditar(ingreso)}>Editar</button>{' '}
                  <button onClick={() => handleEliminar(ingreso.id_ingreso)}>
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