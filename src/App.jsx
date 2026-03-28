import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient.js'
import SignUpPage   from './pages/auth/SignUpPage.jsx'
import LoginPage    from './pages/auth/LoginPage.jsx'
import HubPage      from './pages/HubPage.jsx'
import RegistryApp  from './pages/registry/RegistryApp.jsx'
import AcadexApp    from './pages/acadex/AcadexApp.jsx'

// ─── ERROR BOUNDARY ───────────────────────────────────────────
import { Component } from 'react'
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError:false, error:null } }
  static getDerivedStateFromError(error) { return { hasError:true, error } }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f0f4f8', fontFamily:'Arial, sans-serif' }}>
        <div style={{ backgroundColor:'#fff', padding:'40px', borderRadius:'12px', maxWidth:'480px', textAlign:'center', boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>⚠️</div>
          <h2 style={{ color:'#c0392b', marginBottom:'12px' }}>Something went wrong</h2>
          <p style={{ color:'#566573', fontSize:'14px', marginBottom:'24px' }}>{this.state.error?.message||'An unexpected error occurred.'}</p>
          <button onClick={()=>window.location.href='/'} style={{ padding:'10px 24px', backgroundColor:'#1B4F72', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'bold' }}>
            Return to Home
          </button>
        </div>
      </div>
    )
    return this.props.children
  }
}

// ─── AUTH GUARD ───────────────────────────────────────────────
function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

// ─── ROOT APP ─────────────────────────────────────────────────
export default function App() {
  const [user,setUser]       = useState(null)
  const [loading,setLoading] = useState(true)
  const navigate             = useNavigate()

  useEffect(()=>{
    // Get initial session
    supabase.auth.getSession().then(({ data:{ session } })=>{
      setUser(session?.user ?? null)
      setLoading(false)
    })
    // Listen for auth changes
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((_event, session)=>{
      setUser(session?.user ?? null)
    })
    return ()=>subscription.unsubscribe()
  },[])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', backgroundColor:'#f0f4f8' }}>
      <p style={{ color:'#7f8c8d', fontSize:'16px', fontFamily:'Arial, sans-serif' }}>Loading Studox...</p>
    </div>
  )

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login"    element={user ? <Navigate to="/"      replace /> : <LoginPage  onLoginSuccess={(u)=>{ setUser(u); navigate('/') }} onGoToSignUp={()=>navigate('/signup')} />} />
        <Route path="/signup"   element={user ? <Navigate to="/"      replace /> : <SignUpPage onGoToLogin={()=>navigate('/login')} />} />
        <Route path="/"         element={<RequireAuth user={user}><HubPage      user={user} onLogout={handleLogout} /></RequireAuth>} />
        <Route path="/registry" element={<RequireAuth user={user}><RegistryApp  user={user} onBackToHub={()=>navigate('/')} /></RequireAuth>} />
        <Route path="/acadex"   element={<RequireAuth user={user}><AcadexApp    user={user} onBackToHub={()=>navigate('/')} /></RequireAuth>} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
