import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS, ROLE_COLORS } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, SectionHeader, StatusBadge, Breadcrumb, WorkflowBar } from '../../components/Shared.jsx'
import S from '../../styles.js'

export default function ResultEntryView({ school, offering, role, onBack }) {
  const [students,setStudents]=useState([]); const [loading,setLoading]=useState(true)
  const [scores,setScores]=useState({}); const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState(''); const [msgType,setMsgType]=useState('error')

  const canEdit    = role==='lecturer'
  const canVerify  = role==='exam_officer'
  const canApprove = ['hod','school_admin'].includes(role)
  const canPublish = role==='school_admin'

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const { data } = await supabase.rpc('get_offering_students',{ p_offering_id:offering.id })
    const list=data||[]; setStudents(list)
    const init={}; list.forEach(s=>{ init[s.registration_id]={ ca:s.ca_score??'', exam:s.exam_score??'' } })
    setScores(init); setLoading(false)
  }

  async function saveAll() {
    setSaving(true); setMsg(''); let errors=0
    for(const s of students) {
      const sc=scores[s.registration_id]
      if(sc?.ca===''&&sc?.exam==='') continue
      const ca=parseFloat(sc?.ca); const ex=parseFloat(sc?.exam)
      if(isNaN(ca)||isNaN(ex)) continue
      const { error } = await supabase.rpc('upsert_result',{ p_registration_id:s.registration_id, p_ca_score:ca, p_exam_score:ex })
      if(error) errors++
    }
    setSaving(false)
    if(errors>0) { setMsgType('error'); setMsg(`${errors} result(s) failed to save.`) }
    else         { setMsgType('success'); setMsg('All scores saved successfully.') }
    load()
  }

  async function submit() {
    setSaving(true)
    const { error } = await supabase.rpc('submit_offering_results',{ p_offering_id:offering.id })
    setSaving(false)
    if(error) { setMsgType('error'); setMsg(error.message) }
    else      { setMsgType('success'); setMsg('Results submitted to Exam Officer for verification.'); load() }
  }

  async function verify() {
    setSaving(true)
    const regIds=students.filter(s=>s.result_status==='submitted').map(s=>s.registration_id)
    const { error } = await supabase.from('results').update({ status:'verified' }).in('registration_id',regIds)
    setSaving(false)
    if(error) { setMsgType('error'); setMsg(error.message) }
    else      { setMsgType('success'); setMsg('Results verified and sent to HOD for approval.'); load() }
  }

  async function approve() {
    setSaving(true)
    const { error } = await supabase.rpc('approve_offering_results',{ p_offering_id:offering.id })
    setSaving(false)
    if(error) { setMsgType('error'); setMsg(error.message) }
    else      { setMsgType('success'); setMsg('Results approved.'); load() }
  }

  async function publish() {
    setSaving(true)
    const { error } = await supabase.rpc('publish_offering_results',{ p_offering_id:offering.id })
    setSaving(false)
    if(error) { setMsgType('error'); setMsg(error.message) }
    else      { setMsgType('success'); setMsg('Results published to students.'); load() }
  }

  const allDraft     = students.length>0&&students.every(s=>['draft','none',null].includes(s.result_status))
  const allSubmitted = students.length>0&&students.every(s=>s.result_status==='submitted')
  const allVerified  = students.length>0&&students.every(s=>s.result_status==='verified')
  const allApproved  = students.length>0&&students.every(s=>s.result_status==='approved')
  const allPublished = students.length>0&&students.every(s=>s.result_status==='published')
  const currentStatus = allPublished?'published':allApproved?'approved':allVerified?'verified':allSubmitted?'submitted':'draft'

  return (
    <div>
      <Breadcrumb label="Back" onClick={onBack} color={APPS.acadex.color} />
      <SectionHeader
        title={`${offering.course_code} — ${offering.course_name}`}
        subtitle={`${offering.dept_name} · Level ${offering.level} · ${students.length} student(s) · Lecturer: ${offering.lecturer_name||'Unassigned'}`} />
      <WorkflowBar status={currentStatus} />
      <MsgBox msg={msg} type={msgType} />

      {/* LECTURER */}
      {canEdit&&allDraft&&students.length>0&&(
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
          <button style={{ ...S.addBtn, backgroundColor:APPS.acadex.color, opacity:saving?0.6:1 }} onClick={saveAll} disabled={saving}>
            {saving?'Saving...':'Save All Scores'}
          </button>
          <button style={{ ...S.ghostBtn, borderColor:APPS.acadex.color, color:APPS.acadex.color }} onClick={submit} disabled={saving}>
            Submit to Exam Officer
          </button>
        </div>
      )}
      {canEdit&&allSubmitted&&<MsgBox msg="Results submitted. Waiting for Exam Officer verification." type="info" />}
      {canEdit&&allVerified  &&<MsgBox msg="Results verified by Exam Officer and with the HOD." type="info" />}

      {/* EXAM OFFICER */}
      {canVerify&&allSubmitted&&(
        <div style={{ marginBottom:'16px' }}>
          <div style={{ backgroundColor:'#fffbeb', border:'1.5px solid #f39c12', borderRadius:'8px', padding:'14px 16px', marginBottom:'12px' }}>
            <p style={{ margin:'0 0 4px 0', fontWeight:'bold', fontSize:'14px', color:'#d35400' }}>Ready for verification</p>
            <p style={{ margin:0, fontSize:'13px', color:'#566573' }}>Check all scores are entered and correct. Once verified this goes to the HOD.</p>
          </div>
          <button style={{ ...S.addBtn, backgroundColor:ROLE_COLORS.exam_officer.color, opacity:saving?0.6:1 }} onClick={verify} disabled={saving}>
            {saving?'Verifying...':'Verify Results'}
          </button>
        </div>
      )}
      {canVerify&&!allSubmitted&&!allVerified&&<MsgBox msg="Nothing to verify yet. Waiting for lecturer to submit results." type="info" />}
      {canVerify&&allVerified&&<MsgBox msg="You have already verified these results. Waiting for HOD approval." type="success" />}

      {/* HOD / ADMIN APPROVE */}
      {canApprove&&allVerified&&(
        <div style={{ marginBottom:'16px' }}>
          <div style={{ backgroundColor:'#d1f2eb', border:'1.5px solid #0e6655', borderRadius:'8px', padding:'14px 16px', marginBottom:'12px' }}>
            <p style={{ margin:'0 0 4px 0', fontWeight:'bold', fontSize:'14px', color:'#0e6655' }}>Verified by Exam Officer</p>
            <p style={{ margin:0, fontSize:'13px', color:'#566573' }}>These results have been checked. Approve to send for publication.</p>
          </div>
          <button style={{ ...S.addBtn, backgroundColor:APPS.acadex.color, opacity:saving?0.6:1 }} onClick={approve} disabled={saving}>
            {saving?'Approving...':'Approve Results'}
          </button>
        </div>
      )}

      {/* ADMIN PUBLISH */}
      {canPublish&&allApproved&&(
        <div style={{ marginBottom:'16px' }}>
          <div style={{ backgroundColor:'#fdebd0', border:'1.5px solid #d35400', borderRadius:'8px', padding:'14px 16px', marginBottom:'12px' }}>
            <p style={{ margin:'0 0 4px 0', fontWeight:'bold', fontSize:'14px', color:'#d35400' }}>HOD Approved</p>
            <p style={{ margin:0, fontSize:'13px', color:'#566573' }}>Publish to make results visible to students.</p>
          </div>
          <button style={{ ...S.addBtn, backgroundColor:'#1e8449', opacity:saving?0.6:1 }} onClick={publish} disabled={saving}>
            {saving?'Publishing...':'Publish Results to Students'}
          </button>
        </div>
      )}

      {allPublished&&<MsgBox msg="✓ Results are published and visible to students." type="success" />}

      {loading?<Spinner />:students.length===0
        ?<EmptyState text="No students registered for this course" subtext="Students register for courses themselves via the Student Portal" />
        :(
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'14px', border:'1px solid #eaecee', borderRadius:'8px', overflow:'hidden' }}>
              <thead>
                <tr style={{ backgroundColor:'#f8f9fa' }}>
                  {['Student','Matric No.','CA (0–40)','Exam (0–60)','Total','Grade','Status'].map(h=>(
                    <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontWeight:'bold', color:'#566573', borderBottom:'1px solid #eaecee', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s=>{
                  const sc=scores[s.registration_id]||{ ca:'', exam:'' }
                  const canEditRow=canEdit&&['none','draft',null].includes(s.result_status)
                  return (
                    <tr key={s.registration_id} style={{ borderBottom:'1px solid #f0f4f8' }}>
                      <td style={{ padding:'8px 12px', fontWeight:'500' }}>{s.student_name}</td>
                      <td style={{ padding:'8px 12px', color:'#7f8c8d', fontSize:'13px' }}>{s.matric_number||'—'}</td>
                      <td style={{ padding:'8px 12px' }}>
                        {canEditRow
                          ?<input type="number" min="0" max="40" style={{ ...S.input, width:'70px', padding:'6px 8px', fontSize:'13px' }}
                              value={sc.ca} onChange={(e)=>setScores(prev=>({ ...prev, [s.registration_id]:{ ...prev[s.registration_id], ca:e.target.value } }))} />
                          :<span>{s.ca_score??'—'}</span>}
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        {canEditRow
                          ?<input type="number" min="0" max="60" style={{ ...S.input, width:'70px', padding:'6px 8px', fontSize:'13px' }}
                              value={sc.exam} onChange={(e)=>setScores(prev=>({ ...prev, [s.registration_id]:{ ...prev[s.registration_id], exam:e.target.value } }))} />
                          :<span>{s.exam_score??'—'}</span>}
                      </td>
                      <td style={{ padding:'8px 12px', fontWeight:'bold' }}>{s.total_score??'—'}</td>
                      <td style={{ padding:'8px 12px', fontWeight:'bold', fontSize:'16px', color:APPS.acadex.color }}>{s.grade||'—'}</td>
                      <td style={{ padding:'8px 12px' }}><StatusBadge status={s.result_status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
