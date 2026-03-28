import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS, ACADEX_LAST_SCHOOL_KEY } from '../../constants.js'
import { Spinner } from '../../components/Shared.jsx'
import StudentView      from './StudentView.jsx'
import LecturerView     from './LecturerView.jsx'
import ExamOfficerView  from './ExamOfficerView.jsx'
import HODView          from './HODView.jsx'
import ManagementView   from './ManagementView.jsx'
import S from '../../styles.js'

// ─── HEADER ───────────────────────────────────────────────────
function AcadexHeader({ onBack, backLabel, school, schools, onSwitchSchool, isAdmin }) {
  const app = APPS.acadex
  const [showPicker,setShowPicker]=useState(false)
  const showSwitcher = !isAdmin && schools && schools.length>1 && onSwitchSchool
  return (
    <div style={{ backgroundColor:app.color, color:'#ffffff', padding:'0 28px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'14px', paddingBottom:'12px', borderBottom:'1px solid rgba(255,255,255,0.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button style={S.appBackBtn} onClick={onBack}>← {backLabel||'Back'}</button>
          <div>
            <span style={{ fontSize:'20px', fontWeight:'bold' }}>{app.icon} {app.name}</span>
            <span style={{ fontSize:'12px', opacity:0.7, marginLeft:'10px' }}>{app.tagline}</span>
          </div>
        </div>
        {school&&(
          <div style={{ position:'relative' }}>
            <button style={{ backgroundColor:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#ffffff', borderRadius:'6px', padding:'6px 12px', fontSize:'13px', cursor:showSwitcher?'pointer':'default', display:'flex', alignItems:'center', gap:'6px' }}
              onClick={()=>showSwitcher&&setShowPicker(p=>!p)}>
              <span>{school.name}</span>
              {showSwitcher&&<span style={{ opacity:0.7 }}>▾</span>}
            </button>
            {showPicker&&showSwitcher&&(
              <div style={{ position:'absolute', right:0, top:'110%', backgroundColor:'#ffffff', borderRadius:'8px', boxShadow:'0 4px 20px rgba(0,0,0,0.15)', minWidth:'220px', zIndex:100 }}>
                <p style={{ fontSize:'11px', fontWeight:'bold', color:'#7f8c8d', textTransform:'uppercase', padding:'10px 14px 6px 14px', margin:0 }}>Switch Institution</p>
                {schools.map((m,i)=>(
                  <div key={i} style={{ padding:'10px 14px', cursor:'pointer', fontSize:'14px', color:m.schools.slug===school.slug?app.color:'#17202A', fontWeight:m.schools.slug===school.slug?'bold':'normal', backgroundColor:m.schools.slug===school.slug?app.light:'transparent', borderTop:i>0?'1px solid #f0f4f8':'none' }}
                    onClick={()=>{ onSwitchSchool(m.schools.slug); setShowPicker(false) }}>
                    {m.schools.name}
                    <span style={{ fontSize:'11px', color:'#7f8c8d', marginLeft:'8px' }}>{m.role.replace(/_/g,' ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── HOME — ROLE ROUTER ───────────────────────────────────────
function AcadexHome({ school, user, schools, userDept, onSwitchSchool, onBackToHub }) {
  const role          = school.your_role
  const isAdmin       = role==='school_admin'
  const isLecturer    = role==='lecturer'
  const isExamOfficer = role==='exam_officer'
  const isHOD         = role==='hod'
  const isManagement  = ['school_admin','dean'].includes(role)
  return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f0f4f8', fontFamily:'Arial, sans-serif' }}>
      <AcadexHeader onBack={onBackToHub} backLabel="All Apps" school={school} schools={schools} onSwitchSchool={onSwitchSchool} isAdmin={isAdmin} />
      <div style={{ maxWidth:'760px', margin:'0 auto', padding:'28px 24px' }}>
        {role==='student'  && <StudentView          school={school} user={user} />}
        {isLecturer        && <LecturerView         school={school} />}
        {isExamOfficer     && <ExamOfficerView      school={school} userDept={userDept} />}
        {isHOD             && <HODView              school={school} user={user} userDept={userDept} />}
        {isManagement      && <ManagementView       school={school} role={role} />}
        {!['student','lecturer','exam_officer','hod','school_admin','dean'].includes(role)&&(
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <p style={{ fontSize:'15px', color:'#566573', fontFamily:'Arial, sans-serif' }}>
              Your role (<strong>{role}</strong>) does not have access to Acadex.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ROOT ACADEX APP ──────────────────────────────────────────
export default function AcadexApp({ user, onBackToHub }) {
  const [school,setSchool]=useState(null); const [loading,setLoading]=useState(true)
  const [schools,setSchools]=useState([]); const [noSchool,setNoSchool]=useState(false)
  const [userDept,setUserDept]=useState(null)

  useEffect(()=>{ init() },[])

  async function init() {
    setLoading(true)
    const { data } = await supabase.from('school_memberships')
      .select(`role, schools!school_memberships_school_id_fkey(id,name,slug,state,level)`)
      .eq('user_id',user.id).eq('is_active',true)
    const list=(data||[]).filter(m=>m.schools)
    setSchools(list)
    if (list.length===0) { setNoSchool(true); setLoading(false); return }
    const adminMembership = list.find(m=>m.role==='school_admin')
    const lastSlug = localStorage.getItem(ACADEX_LAST_SCHOOL_KEY)
    const bySlug   = lastSlug && list.find(m=>m.schools.slug===lastSlug)
    const target   = adminMembership || bySlug || list[0]
    await loadSchool(target.schools.slug)
    setLoading(false)
  }

  async function loadSchool(slug) {
    const { data,error } = await supabase.rpc('get_school_details',{ p_slug:slug })
    if (!error&&data) {
      setSchool(data)
      localStorage.setItem(ACADEX_LAST_SCHOOL_KEY,slug)
      const { data:mem } = await supabase.from('school_memberships')
        .select('department_id, departments!school_memberships_department_id_fkey(id,name,code)')
        .eq('user_id',user.id).eq('school_id',data.id).eq('is_active',true).maybeSingle()
      setUserDept(mem?.departments||null)
    }
  }

  async function switchSchool(slug) { setSchool(null); setUserDept(null); await loadSchool(slug) }

  const bg = { minHeight:'100vh', backgroundColor:'#f0f4f8', fontFamily:'Arial, sans-serif', display:'flex', alignItems:'center', justifyContent:'center' }

  if (loading) return <div style={bg}><Spinner /></div>

  if (noSchool) return (
    <div style={{ minHeight:'100vh', backgroundColor:'#f0f4f8', fontFamily:'Arial, sans-serif' }}>
      <AcadexHeader onBack={onBackToHub} backLabel="All Apps" school={null} schools={[]} isAdmin={false} onSwitchSchool={null} />
      <div style={{ maxWidth:'480px', margin:'80px auto', padding:'0 24px', textAlign:'center' }}>
        <div style={{ fontSize:'48px', marginBottom:'16px' }}>📊</div>
        <h2 style={{ color:APPS.acadex.color, margin:'0 0 10px 0' }}>No institution found</h2>
        <p style={{ color:'#566573', fontSize:'14px', lineHeight:'1.7' }}>You are not a member of any institution. Ask your school admin to add you via Registry.</p>
      </div>
    </div>
  )

  if (!school) return <div style={bg}><Spinner /></div>

  return <AcadexHome school={school} user={user} schools={schools} userDept={userDept} onSwitchSchool={switchSchool} onBackToHub={onBackToHub} />
}