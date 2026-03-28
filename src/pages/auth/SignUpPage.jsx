import { useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { MsgBox, Field } from '../../components/Shared.jsx'
import S from '../../styles.js'

export default function SignUpPage({ onGoToLogin }) {
  const [firstName,setFN]=useState(''); const [lastName,setLN]=useState('')
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('')
  const [loading,setLoading]=useState(false); const [msg,setMsg]=useState(''); const [msgType,setMsgType]=useState('error')
  async function go() {
    if (!firstName||!lastName||!email||!password) { setMsgType('error'); setMsg('Please fill in all fields.'); return }
    setLoading(true); setMsg('')
    const { error } = await supabase.auth.signUp({ email, password, options:{ data:{ first_name:firstName, last_name:lastName } } })
    setLoading(false)
    if (error) { setMsgType('error'); setMsg(error.message) }
    else       { setMsgType('success'); setMsg('Account created! You can now log in.') }
  }
  return (
    <div style={S.authPage}><div style={S.authCard}>
      <div style={{ textAlign:'center', marginBottom:'28px' }}>
        <h1 style={{ fontSize:'28px', fontWeight:'bold', color:'#1B4F72', margin:'0 0 4px 0' }}>Studox</h1>
        <p style={{ color:'#7f8c8d', fontSize:'13px', margin:0 }}>Educational Infrastructure</p>
      </div>
      <h2 style={S.authTitle}>Create your account</h2>
      <Field label="First Name" placeholder="e.g. Chidi" value={firstName} onChange={setFN} required />
      <Field label="Last Name" placeholder="e.g. Okeke" value={lastName} onChange={setLN} required />
      <Field label="Email Address" type="email" placeholder="chidi@university.edu.ng" value={email} onChange={setEmail} required />
      <Field label="Password" type="password" placeholder="At least 6 characters" value={password} onChange={setPassword} required />
      <MsgBox msg={msg} type={msgType} />
      <button style={loading?S.btnOff:S.btn} onClick={go} disabled={loading}>{loading?'Creating account...':'Sign Up'}</button>
      <p style={S.switchText}>Already have an account?{' '}<span style={S.switchLink} onClick={onGoToLogin}>Log in</span></p>
    </div></div>
  )
}
