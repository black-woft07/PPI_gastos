import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Ingresos from './ingresos'
import Egresos from './egresos'
import Balance from './balance'
import Usuarios from './usuarios'

function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('balance')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  if (!session) {
    return <Login onLogin={setSession} />
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'ingresos':
        return <Ingresos session={session} />
      case 'egresos':
        return <Egresos session={session} />
      case 'usuarios':
        return <Usuarios session={session} />
      case 'balance':
      default:
        return <Balance session={session} />
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 16px 40px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        <h3 style={{ margin: 0 }}>Bienvenido, {session.user.email}</h3>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>

      <nav
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        {[
          { key: 'balance', label: 'Balance' },
          { key: 'ingresos', label: 'Ingresos' },
          { key: 'egresos', label: 'Egresos' },
          { key: 'usuarios', label: 'Usuarios' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 14px',
              border: '1px solid #ccc',
              borderRadius: 6,
              background: activeTab === tab.key ? '#0d6efd' : '#fff',
              color: activeTab === tab.key ? '#fff' : '#000',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {renderTab()}
    </div>
  )
}

export default App