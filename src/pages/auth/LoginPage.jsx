import { useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { MsgBox, Field } from '../../components/Shared.jsx'
import S from '../../styles.js'

export default function LoginPage({ onGoToSignUp, onLoginSuccess }) {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false); const [msg,setMsg]=useState('')
  async function go() {
    if (!email||!password) { setMsg('Please enter your email and password.'); return }
    setLoading(true); setMsg('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setMsg(error.message)
    else       onLoginSuccess(data.user)
  }
  return (
    <div style={S.authPage}><div style={S.authCard}>
      <div style={{ textAlign:'center', marginBottom:'28px' }}>
        <h1 style={{ fontSize:'28px', fontWeight:'bold', color:'#1B4F72', margin:'0 0 4px 0' }}>Studox</h1>
        <p style={{ color:'#7f8c8d', fontSize:'13px', margin:0 }}>Educational Infrastructure</p>
      </div>
      <h2 style={S.authTitle}>Welcome back</h2>
      <Field label="Email Address" type="email" placeholder="your@email.com" value={email} onChange={setEmail} />
      <Field label="Password" type="password" placeholder="Your password" value={password} onChange={setPassword} />
      <MsgBox msg={msg} />
      <button style={loading?S.btnOff:S.btn} onClick={go} disabled={loading}>{loading?'Logging in...':'Log In'}</button>
      <p style={S.switchText}>No account yet?{' '}<span style={S.switchLink} onClick={onGoToSignUp}>Sign up</span></p>
    </div></div>
  )
}
