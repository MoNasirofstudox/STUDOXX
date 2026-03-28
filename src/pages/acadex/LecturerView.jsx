import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS, semesterLabel } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, WorkflowBar } from '../../components/Shared.jsx'
import ResultEntryView from './ResultEntryView.jsx'
import S from '../../styles.js'

export default function LecturerView({ school }) {
  const [semester,setSemester]=useState(null); const [offerings,setOfferings]=useState([])
  const [loading,setLoading]=useState(true); const [selOff,setSelOff]=useState(null)

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const { data:sem } = await supabase.rpc('get_current_semester',{ p_school_id:school.id })
    setSemester(sem)
    if (sem) {
      const { data:{ user:authUser } } = await supabase.auth.getUser()
      const { data } = await supabase.rpc('get_my_offerings',{
        p_school_id: school.id,
        p_semester_id: sem.id,
        p_user_id: authUser.id
      })
      setOfferings(data||[])
    }
    setLoading(false)
  }

  if (selOff) return <ResultEntryView school={school} offering={selOff} role="lecturer" onBack={()=>{ setSelOff(null); load() }} />
  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ marginBottom:'20px' }}>
        <h2 style={{ margin:'0 0 4px 0', fontSize:'20px', fontWeight:'bold', color:APPS.acadex.color }}>My Courses</h2>
        <p style={{ margin:0, fontSize:'13px', color:'#7f8c8d' }}>{semester?semesterLabel(semester):'No current semester set'}</p>
      </div>
      <div style={{ backgroundColor:APPS.acadex.light, borderRadius:'8px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:APPS.acadex.color }}>
        <strong>Your workflow:</strong> Enter scores → Save → Submit for Verification. Once submitted you cannot edit until the Exam Officer returns it.
      </div>
      {!semester
        ?<MsgBox msg="No current semester has been set. Contact your school admin." type="warning" />
        :offerings.length===0
          ?<EmptyState text="No courses assigned to you" subtext="Contact your HOD to assign courses for this semester" />
          :offerings.map(o=>(
            <div key={o.id} style={{ ...S.listCard, cursor:'pointer', marginBottom:'12px', border:`1.5px solid ${APPS.acadex.light}`, backgroundColor:'#ffffff' }}
              onClick={()=>setSelOff(o)}>
              <div style={{ flex:1 }}>
                <p style={{ ...S.listCardTitle, marginBottom:'4px' }}>{o.course_code} — {o.course_name}</p>
                <p style={S.listCardSub}>{o.dept_name} · Level {o.level} · {o.credit_units} units · {o.reg_count} student{o.reg_count!==1?'s':''}</p>
                <div style={{ marginTop:'8px' }}>
                  <WorkflowBar status={
                    o.published_count>0?'published':o.approved_count>0?'approved':
                    (o.verified_count||0)>0?'verified':o.submitted_count>0?'submitted':'draft'
                  } />
                </div>
              </div>
              <span style={{ color:'#aab7b8', fontSize:'22px' }}>›</span>
            </div>
          ))
      }
    </div>
  )
}