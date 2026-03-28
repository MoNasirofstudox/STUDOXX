import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS, semesterLabel } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, SectionHeader, StatusBadge, ListCard } from '../../components/Shared.jsx'
import ResultEntryView from './ResultEntryView.jsx'
import S from '../../styles.js'

export default function HODView({ school, user, userDept }) {
  const [tab,setTab]=useState('assignments')
  return (
    <div>
      <div style={{ marginBottom:'20px' }}>
        <h2 style={{ margin:'0 0 4px 0', fontSize:'20px', fontWeight:'bold', color:APPS.acadex.color }}>HOD Panel</h2>
        <p style={{ margin:0, fontSize:'13px', color:'#7f8c8d' }}>{userDept?`${userDept.name} · `:'Head of Department · '}{school.name}</p>
      </div>
      {!userDept&&<MsgBox msg="Your department is not set on your account. Ask the school admin to update your membership." type="warning" />}
      <div style={{ display:'flex', gap:'4px', borderBottom:'2px solid #eaecee', marginBottom:'24px' }}>
        {[{id:'assignments',label:'Lecturer Assignment'},{id:'results',label:'Results Approval'}].map(t=>(
          <button key={t.id}
            style={tab===t.id?{ ...S.tab, color:APPS.acadex.color, borderBottom:`2px solid ${APPS.acadex.color}`, marginBottom:'-2px' }:S.tab}
            onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab==='assignments' && <HODLecturerAssignment school={school} user={user} userDept={userDept} />}
      {tab==='results'     && <HODResultsApproval    school={school} userDept={userDept} />}
    </div>
  )
}

function HODLecturerAssignment({ school, user, userDept }) {
  const [semester,setSemester]=useState(null); const [offerings,setOfferings]=useState([])
  const [lecturers,setLecturers]=useState([]); const [loading,setLoading]=useState(true)
  const [editOffId,setEditOffId]=useState(null); const [editLecturer,setEditLecturer]=useState('')
  const [editSaving,setEditSaving]=useState(false); const [msg,setMsg]=useState('')

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const { data:sem } = await supabase.rpc('get_current_semester',{ p_school_id:school.id })
    setSemester(sem)
    if (sem) {
      const { data } = await supabase.rpc('get_offerings',{ p_school_id:school.id, p_semester_id:sem.id })
      let all=data||[]
      if (userDept) all=all.filter(o=>o.dept_id===userDept.id)
      setOfferings(all)
    }
    // Fetch all lecturers in school — no department filter since lecturers may not have dept set
    const { data:memberships } = await supabase
      .from('school_memberships')
      .select('user_id')
      .eq('school_id',school.id)
      .eq('role','lecturer')
      .eq('is_active',true)

    if (memberships && memberships.length > 0) {
      const userIds = memberships.map(m => m.user_id)
      const { data:profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds)
      const lecturerList = (memberships||[]).map(m => ({
        user_id: m.user_id,
        profiles: (profiles||[]).find(p => p.id === m.user_id) || null
      }))
      setLecturers(lecturerList)
    } else {
      setLecturers([])
    }
    setLoading(false)
  }

  async function saveAssignment(offId) {
    setEditSaving(true); setMsg('')
    const { data:{ user:authUser } } = await supabase.auth.getUser()
    const existing = offerings.find(o=>o.id===offId)
    if (existing?.lecturer_id) {
      await supabase.from('offering_assignments').update({ unassigned_at:new Date().toISOString(), is_active:false }).eq('offering_id',offId).eq('is_active',true)
    }
    if (editLecturer) {
      await supabase.from('offering_assignments').insert({ school_id:school.id, offering_id:offId, lecturer_id:editLecturer, assigned_by:authUser.id })
    }
    const { error } = await supabase.from('course_offerings').update({ lecturer_id:editLecturer||null }).eq('id',offId)
    setEditSaving(false)
    if (error) setMsg(error.message)
    else { setEditOffId(null); load() }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <SectionHeader title="Lecturer Assignment"
        subtitle={semester?`${semesterLabel(semester)} · ${offerings.length} course(s) in your department`:'No current semester'} />
      {!semester&&<MsgBox msg="No current semester set. Contact your school admin." type="warning" />}
      <MsgBox msg={msg} />
      {semester&&offerings.length===0&&<EmptyState text="No offerings in your department" subtext="Course offerings must be created first by the school admin in Registry" />}
      {offerings.map(o=>(
        <div key={o.id} style={{ ...S.listCard, flexDirection:'column', alignItems:'stretch', marginBottom:'10px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <p style={{ ...S.listCardTitle, marginBottom:'2px' }}>{o.course_code} — {o.course_name}</p>
              <p style={S.listCardSub}>Level {o.level} · {o.credit_units} unit(s) · {o.reg_count} student{o.reg_count!==1?'s':''}</p>
            </div>
            <div style={{ display:'flex', gap:'4px', flexWrap:'wrap', marginLeft:'8px' }}>
              {o.submitted_count>0      &&<StatusBadge status="submitted" />}
              {(o.verified_count||0)>0  &&<StatusBadge status="verified"  />}
              {(o.approved_count||0)>0  &&<StatusBadge status="approved"  />}
              {(o.published_count||0)>0 &&<StatusBadge status="published" />}
            </div>
          </div>
          <div style={{ marginTop:'10px', paddingTop:'10px', borderTop:'1px solid #eaecee', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'13px', color:'#566573' }}>Lecturer:</span>
            {editOffId===o.id?(
              <>
                <select style={{ ...S.input, flex:1, minWidth:'180px', padding:'6px 10px', fontSize:'13px' }}
                  value={editLecturer} onChange={(e)=>setEditLecturer(e.target.value)}>
                  <option value="">Unassigned</option>
                  {lecturers.map(l=><option key={l.user_id} value={l.user_id}>{l.profiles?.first_name} {l.profiles?.last_name}</option>)}
                </select>
                <button style={{ ...S.addBtn, backgroundColor:APPS.acadex.color, padding:'6px 14px', fontSize:'13px' }}
                  onClick={()=>saveAssignment(o.id)} disabled={editSaving}>{editSaving?'Saving...':'Save'}</button>
                <button style={{ ...S.secondaryBtn, padding:'6px 12px', fontSize:'13px', flex:'unset' }}
                  onClick={()=>setEditOffId(null)}>Cancel</button>
              </>
            ):(
              <>
                <span style={{ fontSize:'13px', fontWeight:'bold', color:o.lecturer_name?'#17202A':'#95a5a6' }}>
                  {o.lecturer_name||'Unassigned'}
                </span>
                {!(o.approved_count||0)&&!(o.published_count||0)&&(
                  <button style={{ fontSize:'12px', color:APPS.acadex.color, backgroundColor:'transparent', border:`1px solid ${APPS.acadex.color}`, borderRadius:'6px', padding:'3px 10px', cursor:'pointer' }}
                    onClick={()=>{ setEditOffId(o.id); setEditLecturer(o.lecturer_id||'') }}>
                    {o.lecturer_name?'Reassign':'Assign'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function HODResultsApproval({ school, userDept }) {
  const [semester,setSemester]=useState(null); const [offerings,setOfferings]=useState([])
  const [loading,setLoading]=useState(true); const [selOff,setSelOff]=useState(null)

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const { data:sem } = await supabase.rpc('get_current_semester',{ p_school_id:school.id })
    setSemester(sem)
    if (sem) {
      const { data } = await supabase.rpc('get_offerings',{ p_school_id:school.id, p_semester_id:sem.id })
      let all=(data||[]).filter(o=>(o.verified_count||0)>0||(o.approved_count||0)>0)
      if (userDept) all=all.filter(o=>o.dept_id===userDept.id)
      setOfferings(all)
    }
    setLoading(false)
  }

  if (selOff) return <ResultEntryView school={school} offering={selOff} role="hod" onBack={()=>{ setSelOff(null); load() }} />
  if (loading) return <Spinner />
  if (!semester) return <MsgBox msg="No current semester set." type="warning" />

  return (
    <div>
      <SectionHeader title="Results Approval" subtitle={semesterLabel(semester)} />
      {offerings.length===0
        ?<EmptyState text="Nothing to approve" subtext="Results appear here once the Exam Officer has verified them" />
        :offerings.map(o=>(
          <ListCard key={o.id}
            title={`${o.course_code} — ${o.course_name}`}
            sub={`${o.reg_count} student(s) · ${o.lecturer_name||'Unassigned'}`}
            right={
              <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                {(o.verified_count||0)>0&&<StatusBadge status="verified" />}
                {(o.approved_count||0)>0&&<StatusBadge status="approved" />}
              </div>
            }
            onClick={()=>setSelOff(o)} />
        ))}
    </div>
  )
}