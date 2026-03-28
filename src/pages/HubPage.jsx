import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient.js'
import { APPS } from '../constants.js'
import S from '../styles.js'

export default function HubPage({ user, onLogout }) {
  const [profile,setProfile]=useState(null)
  const navigate = useNavigate()
  useEffect(()=>{
    supabase.from('profiles').select('*').eq('id',user.id).single().then(({data})=>{ if(data) setProfile(data) })
  },[user.id])
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f0f4f8', fontFamily:'Arial, sans-serif' }}>
      <div style={{ backgroundColor:'#ffffff', borderBottom:'1px solid #eaecee', padding:'14px 32px',
        display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <span style={{ fontSize:'22px', fontWeight:'bold', color:'#1B4F72' }}>Studox</span>
          <span style={{ fontSize:'13px', color:'#7f8c8d', marginLeft:'10px' }}>Educational Infrastructure</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <span style={{ fontSize:'14px', color:'#566573' }}>{profile?.first_name} {profile?.last_name}</span>
          <button style={S.logoutBtn} onClick={onLogout}>Log out</button>
        </div>
      </div>
      <div style={{ maxWidth:'780px', margin:'0 auto', padding:'48px 24px' }}>
        <h2 style={{ fontSize:'24px', fontWeight:'bold', color:'#17202A', margin:'0 0 6px 0' }}>Your Applications</h2>
        <p style={{ fontSize:'14px', color:'#7f8c8d', margin:'0 0 36px 0' }}>Select an application to get started</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'20px' }}>
          {Object.values(APPS).map(app=>(
            <div key={app.id} style={{ backgroundColor:'#ffffff', borderRadius:'12px',
              border:`2px solid ${app.status==='soon'?'#eaecee':app.light}`,
              padding:'28px 24px', cursor:app.status==='soon'?'default':'pointer',
              opacity:app.status==='soon'?0.7:1, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}
              onClick={()=>app.status!=='soon'&&navigate(`/${app.id}`)}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>{app.icon}</div>
              <h3 style={{ fontSize:'18px', fontWeight:'bold', color:app.color, margin:'0 0 4px 0' }}>{app.name}</h3>
              <p style={{ fontSize:'13px', color:'#7f8c8d', margin:'0 0 20px 0', lineHeight:'1.5' }}>{app.tagline}</p>
              {app.status==='soon'
                ?<span style={{ fontSize:'12px', fontWeight:'bold', backgroundColor:'#f0f4f8', color:'#95a5a6', padding:'4px 10px', borderRadius:'12px' }}>Coming Soon</span>
                :<span style={{ fontSize:'13px', fontWeight:'bold', color:app.color, borderBottom:`2px solid ${app.color}`, paddingBottom:'1px' }}>Open {app.name} →</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
