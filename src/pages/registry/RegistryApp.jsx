import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS, nigerianStates } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, Field, SectionHeader, Badge, ListCard, FormBox, ButtonRow, CancelBtn, SaveBtn } from '../../components/Shared.jsx'
import OverviewTab      from './OverviewTab.jsx'
import StructureTab     from './StructureTab.jsx'
import MembersTab       from './MembersTab.jsx'
import SessionsTab      from './SessionsTab.jsx'
import RegistryOfferingsTab from './OfferingsTab.jsx'
import S from '../../styles.js'

// ─── HEADER ───────────────────────────────────────────────────
function RegistryHeader({ onBack, backLabel, schoolName }) {
  const app = APPS.registry
  return (
    <div style={{ backgroundColor:app.color, color:'#ffffff', padding:'0 28px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        paddingTop:'14px', paddingBottom:'12px', borderBottom:'1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {onBack&&<button style={S.appBackBtn} onClick={onBack}>← {backLabel||'Back'}</button>}
          <div>
            <span style={{ fontSize:'20px', fontWeight:'bold' }}>{app.icon} {app.name}</span>
            {schoolName
              ?<span style={{ fontSize:'13px', opacity:0.8, marginLeft:'10px' }}>{schoolName}</span>
              :<span style={{ fontSize:'12px', opacity:0.7, marginLeft:'10px' }}>{app.tagline}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SCHOOL SHELL WITH VERTICAL TABS ─────────────────────────
function RegistrySchool({ school, onBack }) {
  const [tab,setTab]=useState('overview')
  const [schoolData,setSchoolData]=useState(school)
  const role    = schoolData.your_role
  const isAdmin = role==='school_admin'
  const tabs = [
    { id:'overview',  label:'Overview',   icon:'🏠' },
    { id:'structure', label:'Structure',  icon:'🏗️' },
    { id:'members',   label:'Members',    icon:'👥' },
    { id:'sessions',  label:'Sessions',   icon:'📅' },
    ...(isAdmin?[{ id:'offerings', label:'Offerings', icon:'📋' }]:[]),
  ]
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f0f4f8', fontFamily:'Arial, sans-serif' }}>
      <RegistryHeader onBack={onBack} backLabel="My Institutions" schoolName={schoolData.name} />
      <div style={{ display:'flex', minHeight:'calc(100vh - 53px)' }}>
        <div style={{ width:'200px', flexShrink:0, backgroundColor:'#ffffff', borderRight:'1px solid #eaecee', paddingTop:'20px' }}>
          <div style={{ padding:'0 16px 16px 16px', borderBottom:'1px solid #eaecee', marginBottom:'8px' }}>
            <p style={{ margin:'0 0 6px 0', fontSize:'13px', fontWeight:'bold', color:'#17202A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{schoolData.name}</p>
            <Badge text={role} role={role} />
          </div>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'11px 16px',
                backgroundColor:tab===t.id?APPS.registry.light:'transparent',
                color:tab===t.id?APPS.registry.color:'#566573',
                fontWeight:tab===t.id?'bold':'normal',
                border:'none', borderLeft:tab===t.id?`3px solid ${APPS.registry.color}`:'3px solid transparent',
                cursor:'pointer', fontSize:'14px', textAlign:'left', boxSizing:'border-box' }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, padding:'28px 32px', overflowY:'auto', maxWidth:'780px' }}>
          {tab==='overview'  && <OverviewTab   school={schoolData} onUpdated={(u)=>setSchoolData(prev=>({...prev,...u}))} isAdmin={isAdmin} />}
          {tab==='structure' && <StructureTab  school={schoolData} isAdmin={isAdmin} />}
          {tab==='members'   && <MembersTab    school={schoolData} isAdmin={isAdmin} />}
          {tab==='sessions'  && <SessionsTab   school={schoolData} isAdmin={isAdmin} />}
          {tab==='offerings' && <RegistryOfferingsTab school={schoolData} />}
        </div>
      </div>
    </div>
  )
}

// ─── CREATE SCHOOL FORM ───────────────────────────────────────
function CreateSchoolForm({ onCreated, onCancel }) {
  const [name,setName]=useState(''); const [slug,setSlug]=useState('')
  const [state,setState]=useState(''); const [email,setEmail]=useState('')
  const [loading,setLoading]=useState(false); const [msg,setMsg]=useState('')
  function handleName(val) {
    setName(val)
    setSlug(val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-'))
  }
  async function go() {
    if (!name||!slug||!state) { setMsg('Please fill in all required fields.'); return }
    setLoading(true); setMsg('')
    const { data,error } = await supabase.rpc('create_school',{ p_name:name, p_slug:slug, p_level:'undergraduate', p_state:state, p_email:email })
    setLoading(false)
    if (error) setMsg(error.message)
    else       onCreated(data)
  }
  return (
    <FormBox>
      <h3 style={{ margin:'0 0 4px 0', fontSize:'17px', fontWeight:'bold', color:'#17202A' }}>Create your institution</h3>
      <p style={{ margin:'0 0 20px 0', fontSize:'13px', color:'#7f8c8d' }}>Set up your university on Studox Registry</p>
      <div style={S.fieldGroup}>
        <label style={S.label}>Institution Name <span style={{ color:'#c0392b' }}>*</span></label>
        <input style={S.input} type="text" placeholder="e.g. University of Lagos" value={name} onChange={(e)=>handleName(e.target.value)} />
      </div>
      <div style={S.fieldGroup}>
        <label style={S.label}>URL Name <span style={{ color:'#c0392b' }}>*</span></label>
        <div style={S.slugWrapper}>
          <span style={S.slugPrefix}>/s/</span>
          <input style={S.slugInput} type="text" placeholder="university-of-lagos" value={slug}
            onChange={(e)=>setSlug(e.target.value.toLowerCase().replace(/\s+/g,'-'))} />
        </div>
      </div>
      <div style={S.fieldGroup}>
        <label style={S.label}>State <span style={{ color:'#c0392b' }}>*</span></label>
        <select style={S.input} value={state} onChange={(e)=>setState(e.target.value)}>
          <option value="">Select a state</option>
          {nigerianStates.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <Field label="Official Email" type="email" placeholder="registrar@university.edu.ng" value={email} onChange={setEmail} />
      <MsgBox msg={msg} />
      <ButtonRow><CancelBtn onClick={onCancel} /><SaveBtn onClick={go} loading={loading} label="Create Institution" /></ButtonRow>
    </FormBox>
  )
}

// ─── DASHBOARD ────────────────────────────────────────────────
function RegistryDashboard({ user, onEnterSchool, onBackToHub }) {
  const [profile,setProfile]=useState(null); const [schools,setSchools]=useState([])
  const [loading,setLoading]=useState(true); const [showForm,setShowForm]=useState(false)

  useEffect(()=>{ loadAll() },[user.id])

  async function loadAll() {
    setLoading(true)
    const [p,s] = await Promise.all([
      supabase.from('profiles').select('*').eq('id',user.id).single(),
      supabase.from('school_memberships').select(`role, schools(id,name,slug,state,level,subscription_tier)`).eq('user_id',user.id).eq('is_active',true),
    ])
    if (p.data) setProfile(p.data)
    if (s.data) setSchools(s.data)
    setLoading(false)
  }

  async function reloadSchools() {
    const { data } = await supabase.from('school_memberships').select(`role, schools(id,name,slug,state,level,subscription_tier)`).eq('user_id',user.id).eq('is_active',true)
    if (data) setSchools(data)
  }

  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f0f4f8', fontFamily:'Arial, sans-serif' }}>
      <RegistryHeader onBack={onBackToHub} backLabel="All Apps" />
      <div style={{ maxWidth:'560px', margin:'0 auto', padding:'36px 24px' }}>
        {loading ? <Spinner /> : (
          <>
            <div style={{ marginBottom:'28px' }}>
              <h2 style={{ margin:'0 0 2px 0', fontSize:'22px', fontWeight:'bold', color:'#17202A' }}>{profile?.first_name} {profile?.last_name}</h2>
              <p style={{ margin:0, fontSize:'13px', color:'#7f8c8d' }}>{profile?.email}</p>
            </div>
            <p style={S.sectionLabel}>Your Institutions</p>
            {showForm
              ?<CreateSchoolForm onCreated={()=>{ setShowForm(false); reloadSchools() }} onCancel={()=>setShowForm(false)} />
              :(
                <>
                  {schools.length===0
                    ?<EmptyState text="No institution yet" subtext="Create your institution or wait for an admin to add you." />
                    :schools.map((m,i)=>(
                      <ListCard key={i} title={m.schools?.name}
                        sub={`${m.schools?.state} · ${m.schools?.level}`}
                        right={<Badge text={m.role} role={m.role} />}
                        onClick={()=>onEnterSchool(m.schools?.slug)} />
                    ))}
                  <button style={{ ...S.dashedBtn, marginTop:'12px', borderColor:APPS.registry.color, color:APPS.registry.color }}
                    onClick={()=>setShowForm(true)}>
                    + {schools.length===0?'Create an Institution':'Add another institution'}
                  </button>
                </>
              )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── ROOT REGISTRY APP ────────────────────────────────────────
export default function RegistryApp({ user, onBackToHub }) {
  const [school,setSchool]=useState(null)

  async function enterSchool(slug) {
    const { data,error } = await supabase.rpc('get_school_details',{ p_slug:slug })
    if (!error&&data) setSchool(data)
  }

  if (school) return <RegistrySchool school={school} onBack={()=>setSchool(null)} />
  return <RegistryDashboard user={user} onEnterSchool={enterSchool} onBackToHub={onBackToHub} />
}
