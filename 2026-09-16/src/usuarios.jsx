import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Usuarios({ session }) {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')

  const cargarUsuario = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (error) {
      setErrorMsg(error.message)
      setUsuario(null)
      setLoading(false)
      return
    }

    if (!data) {
      const { data: nuevoUsuario, error: insertError } = await supabase
        .from('usuarios')
        .insert({
          id: session.user.id,
          nombre: session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || 'Usuario',
          correo: session.user.email,
        })
        .select()
        .single()

      if (insertError) {
        setErrorMsg(insertError.message)
        setUsuario(null)
      } else {
        setUsuario(nuevoUsuario)
        setNombre(nuevoUsuario.nombre)
        setCorreo(nuevoUsuario.correo)
      }
    } else {
      setUsuario(data)
      setNombre(data.nombre)
      setCorreo(data.correo)
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarUsuario()
  }, [session])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!session?.user?.id) {
      setErrorMsg('No hay sesión activa.')
      return
    }

    const { error } = await supabase
      .from('usuarios')
      .upsert(
        {
          id: session.user.id,
          nombre: nombre.trim(),
          correo: correo.trim(),
        },
        { onConflict: 'id' }
      )

    if (error) {
      setErrorMsg(error.message)
      return
    }

    await cargarUsuario()
  }

  return (
    <div style={{ maxWidth: 600, margin: '20px auto' }}>
      <h2>Mi perfil</h2>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      {loading ? (
        <p>Cargando usuario...</p>
      ) : !usuario ? (
        <p>No se pudo cargar el perfil.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              maxLength={50}
            />
          </div>

          <div>
            <label>Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              maxLength={100}
            />
          </div>

          <button type="submit">Guardar perfil</button>
        </form>
      )}
    </div>
  )
}