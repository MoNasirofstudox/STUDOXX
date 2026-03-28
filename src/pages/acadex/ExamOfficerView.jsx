import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS, semesterLabel } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, StatusBadge } from '../../components/Shared.jsx'
import ResultEntryView from './ResultEntryView.jsx'
import S from '../../styles.js'

export default function ExamOfficerView({ school, userDept }) {
  const [semester,setSemester]=useState(null); const [offerings,setOfferings]=useState([])
  const [loading,setLoading]=useState(true); const [selOff,setSelOff]=useState(null)

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const { data:sem } = await supabase.rpc('get_current_semester',{ p_school_id:school.id })
    setSemester(sem)
    if (sem) {
      const { data } = await supabase.rpc('get_offerings',{ p_school_id:school.id, p_semester_id:sem.id })
      let all=data||[]
      if (userDept) all=all.filter(o=>o.dept_id===userDept.id)
      all=all.filter(o=>!!o.lecturer_name)
      setOfferings(all)
    }
    setLoading(false)
  }

  if (selOff) return <ResultEntryView school={school} offering={selOff} role="exam_officer" onBack={()=>{ setSelOff(null); load() }} />
  if (loading) return <Spinner />

  const pending  = offerings.filter(o=>o.submitted_count>0)
  const verified = offerings.filter(o=>o.submitted_count===0&&(o.verified_count||0)>0)
  const others   = offerings.filter(o=>o.submitted_count===0&&!(o.verified_count||0)&&!(o.approved_count||0)&&!(o.published_count||0))

  return (
    <div>
      <div style={{ marginBottom:'20px' }}>
        <h2 style={{ margin:'0 0 4px 0', fontSize:'20px', fontWeight:'bold', color:APPS.acadex.color }}>Exam Officer Panel</h2>
        <p style={{ margin:0, fontSize:'13px', color:'#7f8c8d' }}>
          {userDept?`${userDept.name} · `:'All departments · '}{semester?semesterLabel(semester):'No current semester set'}
        </p>
      </div>
      <div style={{ backgroundColor:APPS.acadex.light, borderRadius:'8px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:APPS.acadex.color }}>
        <strong>Your role:</strong> Verify submitted results before they reach the HOD.
        {!userDept&&<span style={{ display:'block', marginTop:'4px', color:'#d35400' }}>⚠ No department set on your account. Ask your admin to update your membership.</span>}
      </div>
      {!semester
        ?<MsgBox msg="No current semester set. Contact your school admin." type="warning" />
        :offerings.length===0
          ?<EmptyState text="No courses to review" subtext="Courses appear here once they have a lecturer assigned and are in your department" />
          :(
            <>
              {pending.length>0&&(
                <>
                  <p style={S.sectionLabel}>Awaiting Your Verification ({pending.length})</p>
                  {pending.map(o=>(
                    <div key={o.id} style={{ ...S.listCard, cursor:'pointer', backgroundColor:'#fffbeb', borderColor:'#f39c12' }} onClick={()=>setSelOff(o)}>
                      <div style={{ flex:1 }}>
                        <p style={S.listCardTitle}>{o.course_code} — {o.course_name}</p>
                        <p style={S.listCardSub}>{o.reg_count} student{o.reg_count!==1?'s':''} · Lecturer: {o.lecturer_name}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <StatusBadge status="submitted" /><span style={{ color:'#aab7b8', fontSize:'18px' }}>›</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {verified.length>0&&(
                <>
                  <p style={{ ...S.sectionLabel, marginTop:'16px' }}>Already Verified ({verified.length})</p>
                  {verified.map(o=>(
                    <div key={o.id} style={{ ...S.listCard, cursor:'pointer' }} onClick={()=>setSelOff(o)}>
                      <div style={{ flex:1 }}>
                        <p style={S.listCardTitle}>{o.course_code} — {o.course_name}</p>
                        <p style={S.listCardSub}>{o.reg_count} student{o.reg_count!==1?'s':''} · Lecturer: {o.lecturer_name}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <StatusBadge status="verified" /><span style={{ color:'#aab7b8', fontSize:'18px' }}>›</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {others.length>0&&(
                <>
                  <p style={{ ...S.sectionLabel, marginTop:'16px' }}>Pending Lecturer Submission ({others.length})</p>
                  {others.map(o=>(
                    <div key={o.id} style={S.listCard}>
                      <div style={{ flex:1 }}>
                        <p style={S.listCardTitle}>{o.course_code} — {o.course_name}</p>
                        <p style={S.listCardSub}>{o.reg_count} student{o.reg_count!==1?'s':''} · Lecturer: {o.lecturer_name}</p>
                      </div>
                      <StatusBadge status="draft" />
                    </div>
                  ))}
                </>
              )}
            </>
          )}
    </div>
  )
}
