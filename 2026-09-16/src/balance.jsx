import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function Balance({ session }) {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const cargarBalance = async () => {
    if (!session?.user?.id) return

    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase
      .from('balance')
      .select('*')
      .eq('id_usuario', session.user.id)
      .maybeSingle()

    if (error) {
      setErrorMsg(error.message)
      setBalance(null)
      setLoading(false)
      return
    }

    if (!data) {
      const { data: inserted, error: insertError } = await supabase
        .from('balance')
        .insert({ id_usuario: session.user.id, total_ingresos: 0, total_egresos: 0 })
        .select()
        .single()

      if (insertError) {
        setErrorMsg(insertError.message)
        setBalance(null)
      } else {
        setBalance(inserted)
      }
    } else {
      setBalance(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    cargarBalance()
  }, [session])

  const saldo = Number(balance?.saldo ?? balance?.total_ingresos - balance?.total_egresos ?? 0)

  return (
    <div style={{ maxWidth: 600, margin: '20px auto' }}>
      <h2>Balance general</h2>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      {loading ? (
        <p>Cargando balance...</p>
      ) : !balance ? (
        <p>No se pudo cargar el balance.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            <strong>Total ingresos:</strong>{' '}
            ${Number(balance.total_ingresos || 0).toFixed(2)}
          </div>

          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            <strong>Total egresos:</strong>{' '}
            ${Number(balance.total_egresos || 0).toFixed(2)}
          </div>

          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 16,
              background: saldo >= 0 ? '#e8f5e9' : '#ffebee',
            }}
          >
            <strong>Saldo:</strong>{' '}
            <span style={{ color: saldo >= 0 ? '#1b5e20' : '#b71c1c' }}>
              ${Number(saldo).toFixed(2)}
            </span>
          </div>

          <button type="button" onClick={cargarBalance}>
            Actualizar balance
          </button>
        </div>
      )}
    </div>
  )
}