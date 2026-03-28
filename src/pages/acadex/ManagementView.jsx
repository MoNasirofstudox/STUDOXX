import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS, semesterLabel } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, SectionHeader, Field, Badge, ListCard, FormBox, ButtonRow, CancelBtn, SaveBtn, AddButton, StatusBadge } from '../../components/Shared.jsx'
import ResultEntryView from './ResultEntryView.jsx'
import S from '../../styles.js'

export default function ManagementView({ school, role }) {
  const isAdmin = role==='school_admin'
  const [sub,setSub]=useState('results')
  const subTabs = [
    ...(isAdmin?[{ id:'enrollments', label:'Enrollments' }]:[]),
    { id:'results', label:'Results' },
    ...(isAdmin?[{ id:'scales', label:'Grade Scales' }]:[]),
  ]
  return (
    <div>
      <div style={{ marginBottom:'20px' }}>
        <h2 style={{ margin:'0 0 4px 0', fontSize:'20px', fontWeight:'bold', color:APPS.acadex.color }}>
          {isAdmin?'Admin Panel':'Dean Panel'}
        </h2>
        <p style={{ margin:0, fontSize:'13px', color:'#7f8c8d' }}>{role.replace(/_/g,' ')} · {school.name}</p>
      </div>
      <div style={{ display:'flex', gap:'4px', borderBottom:'2px solid #eaecee', marginBottom:'24px', flexWrap:'wrap' }}>
        {subTabs.map(t=>(
          <button key={t.id}
            style={sub===t.id?{ ...S.tab, color:APPS.acadex.color, borderBottom:`2px solid ${APPS.acadex.color}`, marginBottom:'-2px' }:S.tab}
            onClick={()=>setSub(t.id)}>{t.label}</button>
        ))}
      </div>
      {sub==='enrollments' && <EnrollmentsView      school={school} />}
      {sub==='results'     && <AdminResultsOverview school={school} role={role} />}
      {sub==='scales'      && <GradeScalesView      school={school} />}
    </div>
  )
}

function GradeScalesView({ school }) {
  const [scales,setScales]=useState([]); const [loading,setLoading]=useState(true)
  const [selected,setSelected]=useState('5.0 Scale'); const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState(''); const [msgType,setMsgType]=useState('error')

  useEffect(()=>{ load() },[])
  async function load() {
    setLoading(true)
    const { data } = await supabase.rpc('get_grade_scales',{ p_school_id:school.id })
    setScales(data||[]); setLoading(false)
  }
  async function setup() {
    setSaving(true); setMsg('')
    const { error } = await supabase.rpc('setup_grade_scales',{ p_school_id:school.id, p_template_name:selected })
    setSaving(false)
    if(error) { setMsgType('error'); setMsg(error.message) }
    else      { setMsgType('success'); setMsg(`${selected} applied successfully.`); load() }
  }

  return (
    <div>
      <SectionHeader title="Grade Scales" subtitle="Configure how scores map to grades for this institution" />
      <FormBox>
        <div style={S.fieldGroup}>
          <label style={S.label}>Select a Grading Template</label>
          <select style={S.input} value={selected} onChange={(e)=>setSelected(e.target.value)}>
            <option value="5.0 Scale">5.0 Scale (Nigerian Standard)</option>
            <option value="4.0 Scale">4.0 Scale (International)</option>
          </select>
        </div>
        <MsgBox msg={msg} type={msgType} />
        <SaveBtn onClick={setup} loading={saving} label={scales.length>0?'Update Grade Scale':'Apply Grade Scale'} />
      </FormBox>
      {loading?<Spinner />:scales.length===0
        ?<MsgBox msg="No grade scale set up yet. Apply one above before entering results." type="warning" />
        :(
          <div>
            <p style={S.sectionLabel}>Current Scale</p>
            <div style={{ border:'1px solid #eaecee', borderRadius:'8px', overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
                <thead><tr style={{ backgroundColor:'#f8f9fa' }}>
                  {['Score Range','Grade','Grade Point'].map(h=>(
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontWeight:'bold', color:'#566573', borderBottom:'1px solid #eaecee' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {scales.map((s,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid #f0f4f8' }}>
                      <td style={{ padding:'10px 16px' }}>{s.min_score} – {s.max_score}</td>
                      <td style={{ padding:'10px 16px', fontWeight:'bold' }}>{s.grade}</td>
                      <td style={{ padding:'10px 16px' }}>{s.grade_point}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  )
}

function EnrollmentsView({ school }) {
  const [enrollments,setEnrollments]=useState([]); const [loading,setLoading]=useState(true)
  const [showForm,setSF]=useState(false)
  const [programs,setPrograms]=useState([]); const [students,setStudents]=useState([])
  const [selStudent,setSelStudent]=useState(''); const [selProgram,setSelProgram]=useState('')
  const [entryYear,setEntryYear]=useState(new Date().getFullYear().toString())
  const [jambNo,setJamb]=useState(''); const [matricNo,setMatric]=useState('')
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState(''); const [search,setSearch]=useState('')

  useEffect(()=>{ init() },[])

  async function init() {
    setLoading(true)
    const [e,p,m] = await Promise.all([
      supabase.rpc('get_enrollments',{ p_school_id:school.id }),
      supabase.from('programs').select('id,name,code').eq('school_id',school.id).eq('is_active',true).order('name'),
      supabase.from('school_memberships').select('user_id, profiles(first_name,last_name,email)').eq('school_id',school.id).eq('role','student').eq('is_active',true),
    ])
    setEnrollments(e.data||[]); setPrograms(p.data||[]); setStudents(m.data||[]); setLoading(false)
  }

  async function enroll() {
    if(!selStudent||!selProgram||!entryYear) { setMsg('Student, program, and entry year are required.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.rpc('enroll_student',{ p_school_id:school.id, p_user_id:selStudent, p_program_id:selProgram, p_entry_year:parseInt(entryYear), p_jamb_number:jambNo||null, p_matric_number:matricNo||null })
    setSaving(false)
    if(error) setMsg(error.message)
    else { setSelStudent(''); setSelProgram(''); setJamb(''); setMatric(''); setSF(false); init() }
  }

  const filtered=enrollments.filter(e=>!search||(e.student_name.toLowerCase().includes(search.toLowerCase())||(e.matric_number||'').toLowerCase().includes(search.toLowerCase())))

  return (
    <div>
      <SectionHeader title="Student Enrollments"
        subtitle={`${enrollments.length} enrolled · Students register for courses themselves via the Student Portal`}
        action={!showForm&&<AddButton label="+ Enroll Student" onClick={()=>setSF(true)} color={APPS.acadex.color} />} />
      {showForm&&(
        <FormBox>
          <div style={S.fieldGroup}>
            <label style={S.label}>Student <span style={{ color:'#c0392b' }}>*</span></label>
            <select style={S.input} value={selStudent} onChange={(e)=>setSelStudent(e.target.value)}>
              <option value="">Select a student member</option>
              {students.map(s=><option key={s.user_id} value={s.user_id}>{s.profiles?.first_name} {s.profiles?.last_name} — {s.profiles?.email}</option>)}
            </select>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Program <span style={{ color:'#c0392b' }}>*</span></label>
            <select style={S.input} value={selProgram} onChange={(e)=>setSelProgram(e.target.value)}>
              <option value="">Select a program</option>
              {programs.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
            </select>
          </div>
          <Field label="Entry Year" type="number" required placeholder="e.g. 2024" value={entryYear} onChange={setEntryYear} />
          <div style={{ display:'flex', gap:'12px' }}>
            <div style={{ flex:1 }}><Field label="JAMB Number" placeholder="e.g. 12345678AB" value={jambNo} onChange={setJamb} /></div>
            <div style={{ flex:1 }}><Field label="Matric Number" placeholder="e.g. CSC/2024/001" value={matricNo} onChange={setMatric} /></div>
          </div>
          <MsgBox msg={msg} />
          <ButtonRow><CancelBtn onClick={()=>{ setSF(false); setMsg('') }} /><SaveBtn onClick={enroll} loading={saving} label="Enroll Student" /></ButtonRow>
        </FormBox>
      )}
      {enrollments.length>5&&<div style={{ marginBottom:'16px' }}><input style={S.input} type="text" placeholder="Search by name or matric number..." value={search} onChange={(e)=>setSearch(e.target.value)} /></div>}
      {loading?<Spinner />:enrollments.length===0
        ?<EmptyState text="No students enrolled yet" subtext="Enroll students to their programs. They will register for courses themselves." />
        :filtered.map(e=>(
          <div key={e.id} style={S.listCard}>
            <div style={{ flex:1 }}>
              <p style={S.listCardTitle}>{e.student_name}</p>
              <p style={S.listCardSub}>{e.program_code} — {e.program_name} · Entry: {e.entry_year} · Matric: {e.matric_number||'—'}</p>
            </div>
            <Badge text={e.status} role="student" />
          </div>
        ))}
    </div>
  )
}

function AdminResultsOverview({ school, role }) {
  const [semester,setSemester]=useState(null); const [offerings,setOfferings]=useState([])
  const [loading,setLoading]=useState(true); const [selOff,setSelOff]=useState(null)

  useEffect(()=>{ load() },[])
  async function load() {
    setLoading(true)
    const { data:sem } = await supabase.rpc('get_current_semester',{ p_school_id:school.id })
    setSemester(sem)
    if(sem) {
      const { data } = await supabase.rpc('get_offerings',{ p_school_id:school.id, p_semester_id:sem.id })
      setOfferings(data||[])
    }
    setLoading(false)
  }

  if(selOff) return <ResultEntryView school={school} offering={selOff} role={role} onBack={()=>{ setSelOff(null); load() }} />
  if(loading) return <Spinner />
  if(!semester) return <MsgBox msg="No current semester set. Configure one in Registry → Sessions." type="warning" />

  return (
    <div>
      <SectionHeader title="Results Overview" subtitle={semesterLabel(semester)} />
      {offerings.length===0
        ?<EmptyState text="No offerings this semester" subtext="Results will appear here once course offerings are created" />
        :offerings.map(o=>(
          <ListCard key={o.id}
            title={`${o.course_code} — ${o.course_name}`}
            sub={`${o.dept_name} · ${o.reg_count} student(s) · ${o.lecturer_name||'Unassigned'}`}
            right={
              <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
                {o.submitted_count>0         &&<StatusBadge status="submitted" />}
                {(o.verified_count||0)>0     &&<StatusBadge status="verified"  />}
                {(o.approved_count||0)>0     &&<StatusBadge status="approved"  />}
                {(o.published_count||0)>0    &&<StatusBadge status="published" />}
              </div>
            }
            onClick={()=>setSelOff(o)} />
        ))}
    </div>
  )
}
