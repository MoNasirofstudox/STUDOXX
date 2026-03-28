import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS, semesterLabel } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, SectionHeader, StatusBadge, FormBox, ButtonRow, CancelBtn, SaveBtn, AddButton } from '../../components/Shared.jsx'
import S from '../../styles.js'

export default function RegistryOfferingsTab({ school }) {
  const [allSemesters,setAllSemesters]=useState([]); const [semester,setSemester]=useState(null)
  const [offerings,setOfferings]=useState([]); const [courses,setCourses]=useState([])
  const [loading,setLoading]=useState(true); const [showForm,setSF]=useState(false)
  const [selCourse,setSelCourse]=useState(''); const [saving,setSaving]=useState(false); const [msg,setMsg]=useState('')

  useEffect(()=>{ init() },[])

  async function init() {
    setLoading(true)
    const { data:cur } = await supabase.rpc('get_current_semester',{ p_school_id:school.id })
    if (cur) { setSemester(cur); await loadOfferings(cur) }
    else {
      const { data:sessions } = await supabase.from('academic_sessions')
        .select('id, name, semesters(id, type, is_current, start_date, end_date)')
        .eq('school_id',school.id).order('start_date',{ascending:false})
      const flat=[]
      ;(sessions||[]).forEach(sess=>{ (sess.semesters||[]).forEach(sem=>{ flat.push({ ...sem, session_name:sess.name }) }) })
      setAllSemesters(flat)
    }
    const { data:c } = await supabase.from('courses').select('id,name,code,level').eq('school_id',school.id).eq('is_active',true).order('level').order('code')
    setCourses(c||[]); setLoading(false)
  }

  async function loadOfferings(sem) {
    const { data } = await supabase.rpc('get_offerings',{ p_school_id:school.id, p_semester_id:sem.id })
    setOfferings(data||[])
  }

  async function pickSemester(sem) { setSemester(sem); setLoading(true); await loadOfferings(sem); setLoading(false) }

  async function addOffering() {
    if (!selCourse) { setMsg('Please select a course.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.rpc('create_offering',{ p_school_id:school.id, p_semester_id:semester.id, p_course_id:selCourse, p_lecturer_id:null })
    setSaving(false)
    if (error) setMsg(error.message)
    else { setSelCourse(''); setSF(false); loadOfferings(semester) }
  }

  if (loading) return <Spinner />

  if (!semester) return (
    <div>
      <SectionHeader title="Course Offerings" subtitle="Create offering slots for this semester" />
      <div style={{ backgroundColor:'#fef9e7', border:'1.5px solid #f39c12', borderRadius:'10px', padding:'20px', marginBottom:'20px' }}>
        <p style={{ fontWeight:'bold', color:'#d35400', fontSize:'14px', margin:'0 0 6px 0' }}>No active semester</p>
        <p style={{ fontSize:'13px', color:'#566573', margin:'0 0 16px 0' }}>Go to Sessions and set a current semester, or pick one below.</p>
        {allSemesters.length===0
          ?<p style={{ fontSize:'13px', color:'#95a5a6', margin:0 }}>No semesters found. Create one in Sessions first.</p>
          :allSemesters.map(s=>(
            <div key={s.id} style={{ ...S.listCard, backgroundColor:'#fff', marginBottom:'8px', cursor:'pointer', borderColor:'#f39c12' }} onClick={()=>pickSemester(s)}>
              <div>
                <p style={S.listCardTitle}>{semesterLabel(s)}</p>
                <p style={S.listCardSub}>{new Date(s.start_date).toLocaleDateString('en-NG',{month:'short',year:'numeric'})} — {new Date(s.end_date).toLocaleDateString('en-NG',{month:'short',year:'numeric'})}</p>
              </div>
              <span style={{ color:'#aab7b8', fontSize:'18px' }}>›</span>
            </div>
          ))}
      </div>
    </div>
  )

  return (
    <div>
      <SectionHeader title="Course Offerings"
        subtitle={`${semesterLabel(semester)} · ${offerings.length} offering(s) · HODs assign lecturers in Acadex`}
        action={!showForm&&<AddButton label="+ Add Offering" onClick={()=>setSF(true)} color={APPS.registry.color} />} />
      {showForm&&(
        <FormBox>
          <p style={{ margin:'0 0 14px 0', fontSize:'13px', color:'#566573' }}>
            Add a course to <strong>{semesterLabel(semester)}</strong>. HODs assign lecturers from Acadex.
          </p>
          <div style={S.fieldGroup}>
            <label style={S.label}>Course <span style={{ color:'#c0392b' }}>*</span></label>
            <select style={S.input} value={selCourse} onChange={(e)=>setSelCourse(e.target.value)}>
              <option value="">Select a course</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </div>
          <MsgBox msg={msg} />
          <ButtonRow><CancelBtn onClick={()=>{ setSF(false); setMsg('') }} /><SaveBtn onClick={addOffering} loading={saving} label="Add Offering" /></ButtonRow>
        </FormBox>
      )}
      {offerings.length===0
        ?<EmptyState text="No offerings yet" subtext="Add course offerings above. HODs will assign lecturers in Acadex." />
        :offerings.map(o=>(
          <div key={o.id} style={S.listCard}>
            <div style={{ flex:1 }}>
              <p style={S.listCardTitle}>{o.course_code} — {o.course_name}</p>
              <p style={S.listCardSub}>{o.dept_name} · Level {o.level} · {o.credit_units} unit(s)</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px' }}>
              <span style={{ fontSize:'13px', color:o.lecturer_name?'#17202A':'#95a5a6', fontWeight:o.lecturer_name?'bold':'normal' }}>
                {o.lecturer_name||'No lecturer yet'}
              </span>
              <span style={{ fontSize:'12px', color:'#95a5a6' }}>{o.reg_count} student{o.reg_count!==1?'s':''}</span>
            </div>
          </div>
        ))}
    </div>
  )
}
