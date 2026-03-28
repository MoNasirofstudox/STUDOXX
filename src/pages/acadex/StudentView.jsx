import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS, semesterLabel } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, Badge } from '../../components/Shared.jsx'
import S from '../../styles.js'

export default function StudentView({ school, user }) {
  const [tab,setTab]=useState('register')
  const [enrollment,setEnrollment]=useState(null)
  const [semester,setSemester]=useState(null)
  const [offerings,setOfferings]=useState([])
  const [registered,setRegistered]=useState([])
  const [results,setResults]=useState([])
  const [loading,setLoading]=useState(true)
  const [selected,setSelected]=useState([])
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const [enrollRes,semRes,resultsRes] = await Promise.all([
      supabase.from('student_enrollments').select('id,program_id,entry_year,matric_number,status,programs(name,code)').eq('user_id',user.id).eq('school_id',school.id).maybeSingle(),
      supabase.rpc('get_current_semester',{ p_school_id:school.id }),
      supabase.rpc('get_my_results',{ p_school_id:school.id }),
    ])
    setEnrollment(enrollRes.data); setSemester(semRes.data); setResults(resultsRes.data||[])
    if (enrollRes.data&&semRes.data) {
      const [offRes,regRes] = await Promise.all([
        supabase.rpc('get_offerings',{ p_school_id:school.id, p_semester_id:semRes.data.id }),
        supabase.from('course_registrations').select('offering_id').eq('student_id',user.id),
      ])
      setOfferings(offRes.data||[])
      setRegistered((regRes.data||[]).map(r=>r.offering_id))
    }
    setLoading(false)
  }

  function toggle(id) { setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]) }

  async function register() {
    if (!enrollment) { setMsg('You are not enrolled in any program. Contact your school admin.'); return }
    if (selected.length===0) { setMsg('Select at least one course.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.rpc('register_student_courses',{ p_enrollment_id:enrollment.id, p_offering_ids:selected })
    setSaving(false)
    if (error) setMsg(error.message)
    else { setSelected([]); load() }
  }

  const tabs=[{id:'register',label:'Course Registration'},{id:'results',label:'My Results'}]
  const groupedResults=results.reduce((acc,r)=>{ const k=r.session_name||'Unknown Session'; if(!acc[k]) acc[k]=[]; acc[k].push(r); return acc },{})

  return (
    <div>
      <div style={{ marginBottom:'20px' }}>
        <h2 style={{ margin:'0 0 4px 0', fontSize:'20px', fontWeight:'bold', color:APPS.acadex.color }}>Student Portal</h2>
        <p style={{ margin:0, fontSize:'13px', color:'#7f8c8d' }}>
          {enrollment?`${enrollment.programs?.code} · Matric: ${enrollment.matric_number||'—'} · Entry ${enrollment.entry_year}`:'Not yet enrolled in a program'}
        </p>
      </div>
      <div style={{ display:'flex', gap:'4px', borderBottom:'2px solid #eaecee', marginBottom:'24px' }}>
        {tabs.map(t=>(
          <button key={t.id}
            style={tab===t.id?{ ...S.tab, color:APPS.acadex.color, borderBottom:`2px solid ${APPS.acadex.color}`, marginBottom:'-2px' }:S.tab}
            onClick={()=>setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab==='register'&&(
        loading?<Spinner />:
        !enrollment?<MsgBox msg="You have not been enrolled in a program yet. Contact your school admin." type="warning" />:
        !semester?<MsgBox msg="No active semester. Course registration is not open at this time." type="warning" />:(
          <div>
            <div style={{ backgroundColor:APPS.acadex.light, borderRadius:'8px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:APPS.acadex.color }}>
              <strong>Registration period:</strong> {semesterLabel(semester)} · Select courses below and click Register.
            </div>
            <MsgBox msg={msg} />
            {offerings.filter(o=>o.lecturer_name).length===0
              ?<EmptyState text="No courses available" subtext="Course offerings for this semester have not been set up yet" />
              :(
                <>
                  {offerings.filter(o=>o.lecturer_name).map(o=>{
                    const isReg=registered.includes(o.id); const isSel=selected.includes(o.id)
                    return (
                      <div key={o.id} style={{ ...S.listCard, cursor:isReg?'default':'pointer',
                        backgroundColor:isReg?'#f0fdf4':isSel?APPS.acadex.light:'#f8f9fa',
                        borderColor:isReg?APPS.acadex.color:isSel?APPS.acadex.color:'#eaecee' }}
                        onClick={()=>!isReg&&toggle(o.id)}>
                        <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1 }}>
                          {!isReg&&<input type="checkbox" checked={isSel} onChange={()=>toggle(o.id)} onClick={e=>e.stopPropagation()} style={{ width:'16px', height:'16px' }} />}
                          <div>
                            <p style={S.listCardTitle}>{o.course_code} — {o.course_name}</p>
                            <p style={S.listCardSub}>{o.dept_name} · Level {o.level} · {o.credit_units} units · {o.lecturer_name}</p>
                          </div>
                        </div>
                        {isReg
                          ?<Badge text="Registered" role="lecturer" />
                          :<span style={{ fontSize:'12px', fontWeight:'bold', backgroundColor:'#f0f4f8', color:'#566573', padding:'2px 8px', borderRadius:'8px' }}>{o.credit_units}u</span>}
                      </div>
                    )
                  })}
                  {selected.length>0&&(
                    <div style={{ marginTop:'16px' }}>
                      <button style={saving?S.btnOff:S.btn} onClick={register} disabled={saving}>
                        {saving?'Registering...':`Register ${selected.length} Course(s)`}
                      </button>
                    </div>
                  )}
                </>
              )}
          </div>
        )
      )}

      {tab==='results'&&(
        loading?<Spinner />:
        results.length===0
          ?<EmptyState text="No results yet" subtext="Your results will appear here once they are published by your institution" />
          :(
            <div>
              {Object.entries(groupedResults).map(([session,rs])=>(
                <div key={session} style={{ marginBottom:'24px' }}>
                  <p style={S.sectionLabel}>{session}</p>
                  <div style={{ border:'1px solid #eaecee', borderRadius:'8px', overflow:'hidden' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px' }}>
                      <thead><tr style={{ backgroundColor:'#f8f9fa' }}>
                        {['Course','Code','CA','Exam','Total','Grade'].map(h=>(
                          <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:'bold', color:'#566573', borderBottom:'1px solid #eaecee', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {rs.map((r,i)=>(
                          <tr key={i} style={{ borderBottom:'1px solid #f0f4f8' }}>
                            <td style={{ padding:'8px 12px' }}>{r.course_name}</td>
                            <td style={{ padding:'8px 12px', color:'#7f8c8d', fontSize:'13px' }}>{r.course_code}</td>
                            <td style={{ padding:'8px 12px' }}>{r.ca_score??'—'}</td>
                            <td style={{ padding:'8px 12px' }}>{r.exam_score??'—'}</td>
                            <td style={{ padding:'8px 12px', fontWeight:'bold' }}>{r.total_score??'—'}</td>
                            <td style={{ padding:'8px 12px', fontWeight:'bold', fontSize:'16px', color:APPS.acadex.color }}>{r.grade||'—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  )
}
