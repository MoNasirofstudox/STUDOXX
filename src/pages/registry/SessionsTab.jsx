import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, Field, SectionHeader, Badge, ListCard, FormBox, ButtonRow, CancelBtn, SaveBtn, AddButton, Breadcrumb } from '../../components/Shared.jsx'
import S from '../../styles.js'

export default function SessionsTab({ school, isAdmin }) {
  const [sessions,setSessions]=useState([]); const [loading,setLoading]=useState(true)
  const [showForm,setSF]=useState(false); const [selSession,setSelSession]=useState(null)
  const [name,setName]=useState(''); const [start,setStart]=useState(''); const [end,setEnd]=useState('')
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState('')
  const [editId,setEditId]=useState(null); const [editName,setEditName]=useState('')
  const [editStart,setEditStart]=useState(''); const [editEnd,setEditEnd]=useState('')
  const [editSaving,setEditSaving]=useState(false); const [editMsg,setEditMsg]=useState('')

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('academic_sessions').select('*').eq('school_id',school.id).order('start_date',{ascending:false})
    setSessions(data||[]); setLoading(false)
  }

  async function addSession() {
    if(!name||!start||!end) { setMsg('All fields are required.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.from('academic_sessions').insert({ school_id:school.id, name, start_date:start, end_date:end, is_current:sessions.length===0 })
    setSaving(false)
    if(error) setMsg(error.message)
    else { setName(''); setStart(''); setEnd(''); setSF(false); load() }
  }

  async function saveEdit(id) {
    if(!editName||!editStart||!editEnd) { setEditMsg('All fields are required.'); return }
    setEditSaving(true); setEditMsg('')
    const { error } = await supabase.from('academic_sessions').update({ name:editName, start_date:editStart, end_date:editEnd }).eq('id',id)
    setEditSaving(false)
    if(error) setEditMsg(error.message)
    else { setEditId(null); load() }
  }

  async function setCurrent(id) {
    await supabase.from('academic_sessions').update({is_current:false}).eq('school_id',school.id)
    await supabase.from('academic_sessions').update({is_current:true}).eq('id',id)
    load()
  }

  async function finalizeSession(id) {
    const confirmed = window.confirm('This will permanently lock all results for this session. This cannot be undone. Are you sure?')
    if (!confirmed) return
    const { data:{ user } } = await supabase.auth.getUser()
    await supabase.from('academic_sessions').update({is_current:false}).eq('school_id',school.id)
    await supabase.from('academic_sessions').update({is_current:true}).eq('id',id)
    const { error } = await supabase.from('academic_sessions')
      .update({ finalized_at:new Date().toISOString(), finalized_by:user.id }).eq('id',id)
    if (error) alert(error.message)
    else load()
  }

  if(selSession) return <SemestersView school={school} session={selSession} isAdmin={isAdmin} onBack={()=>{ setSelSession(null); load() }} />

  return (
    <div>
      <SectionHeader title="Academic Sessions" subtitle="Click a session to view or manage its semesters"
        action={isAdmin&&!showForm&&<AddButton label="+ Add Session" onClick={()=>setSF(true)} color={APPS.registry.color} />} />
      {showForm&&<FormBox>
        <Field label="Session Name" required placeholder="e.g. 2025/2026" value={name} onChange={setName} />
        <Field label="Start Date" type="date" required value={start} onChange={setStart} />
        <Field label="End Date" type="date" required value={end} onChange={setEnd} />
        <MsgBox msg={msg} />
        <ButtonRow><CancelBtn onClick={()=>{ setSF(false); setMsg('') }} /><SaveBtn onClick={addSession} loading={saving} /></ButtonRow>
      </FormBox>}
      {loading?<Spinner />:sessions.length===0
        ?<EmptyState text="No sessions yet" subtext="Add your first academic session" />
        :sessions.map(s=>(
          <div key={s.id} style={{ marginBottom:'8px' }}>
            {editId===s.id ? (
              <FormBox>
                <Field label="Session Name" required value={editName} onChange={setEditName} />
                <Field label="Start Date" type="date" required value={editStart} onChange={setEditStart} />
                <Field label="End Date" type="date" required value={editEnd} onChange={setEditEnd} />
                <MsgBox msg={editMsg} />
                <ButtonRow>
                  <CancelBtn onClick={()=>{ setEditId(null); setEditMsg('') }} />
                  <SaveBtn onClick={()=>saveEdit(s.id)} loading={editSaving} />
                </ButtonRow>
              </FormBox>
            ) : (
              <div style={{ ...S.listCard, cursor:'pointer',
                backgroundColor:s.is_current&&!s.finalized_at?'#f0f8ff':'#f8f9fa',
                borderColor:s.is_current&&!s.finalized_at?APPS.registry.color:'#eaecee' }}
                onClick={()=>setSelSession(s)}>
                <div style={{ flex:1 }}>
                  <p style={S.listCardTitle}>{s.name}</p>
                  <p style={S.listCardSub}>
                    {new Date(s.start_date).toLocaleDateString('en-NG',{month:'short',year:'numeric'})} — {new Date(s.end_date).toLocaleDateString('en-NG',{month:'short',year:'numeric'})}
                    {s.finalized_at&&<span style={{ marginLeft:'8px', color:'#c0392b', fontWeight:'bold' }}>· Locked</span>}
                  </p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }} onClick={e=>e.stopPropagation()}>
                  {s.finalized_at
                    ?<span style={{ fontSize:'12px', fontWeight:'bold', backgroundColor:'#fadbd8', color:'#c0392b', padding:'3px 10px', borderRadius:'20px' }}>🔒 Finalized</span>
                    :(
                      <>
                        {s.is_current&&<Badge text="Current" role="lecturer" />}
                        {isAdmin&&<button style={{ ...S.ghostBtn, fontSize:'12px', padding:'3px 10px' }}
                          onClick={()=>{ setEditId(s.id); setEditName(s.name); setEditStart(s.start_date); setEditEnd(s.end_date); setEditMsg('') }}>Edit</button>}
                        {isAdmin&&s.is_current&&<button style={{ ...S.ghostBtn, fontSize:'12px', padding:'3px 10px', borderColor:'#c0392b', color:'#c0392b' }}
                          onClick={()=>finalizeSession(s.id)}>Finalize</button>}
                        {isAdmin&&!s.is_current&&<button style={{ ...S.ghostBtn, fontSize:'12px', padding:'3px 10px' }}
                          onClick={()=>setCurrent(s.id)}>Set current</button>}
                      </>
                    )}
                  <span style={{ color:'#aab7b8', fontSize:'18px', pointerEvents:'none' }}>›</span>
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  )
}

function SemestersView({ school, session, isAdmin, onBack }) {
  const [semesters,setSemesters]=useState([]); const [loading,setLoading]=useState(true)
  const [showForm,setSF]=useState(false); const [type,setType]=useState('first')
  const [start,setStart]=useState(''); const [end,setEnd]=useState('')
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState('')
  const [editId,setEditId]=useState(null); const [editStart,setEditStart]=useState(''); const [editEnd,setEditEnd]=useState('')
  const [editSaving,setEditSaving]=useState(false); const [editMsg,setEditMsg]=useState('')

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('semesters')
      .select(`id, type, start_date, end_date, is_current, session_id, academic_sessions(name)`)
      .eq('session_id',session.id).order('start_date',{ascending:true})
    const shaped=(data||[]).map(s=>({ ...s, session_name:s.academic_sessions?.name||session.name }))
    setSemesters(shaped); setLoading(false)
  }

  async function add() {
    if(!start||!end) { setMsg('Start and end dates are required.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.from('semesters').insert({ school_id:school.id, session_id:session.id, type, start_date:start, end_date:end, is_current:false })
    setSaving(false)
    if(error) setMsg(error.message)
    else { setStart(''); setEnd(''); setSF(false); load() }
  }

  async function saveEdit(id) {
    if(!editStart||!editEnd) { setEditMsg('Both dates are required.'); return }
    setEditSaving(true); setEditMsg('')
    const { error } = await supabase.from('semesters').update({ start_date:editStart, end_date:editEnd }).eq('id',id)
    setEditSaving(false)
    if(error) setEditMsg(error.message)
    else { setEditId(null); load() }
  }

  async function setCurrent(id) {
    await supabase.from('semesters').update({is_current:false}).eq('school_id',school.id)
    await supabase.from('semesters').update({is_current:true}).eq('id',id)
    load()
  }

  const semTitle = t=>t==='first'?'First Semester':t==='second'?'Second Semester':'Summer'
  const isFinalized = !!session.finalized_at

  return (
    <div>
      <Breadcrumb label="All Sessions" onClick={onBack} />
      <SectionHeader title={session.name}
        subtitle={isFinalized?'🔒 Finalized — view only':'Manage semesters within this session'}
        action={isAdmin&&!showForm&&!isFinalized&&<AddButton label="+ Add Semester" onClick={()=>setSF(true)} color={APPS.registry.color} />} />
      {isFinalized&&<MsgBox msg="This session is finalized. All records are permanently locked." type="warning" />}
      {!isFinalized&&showForm&&<FormBox>
        <div style={S.fieldGroup}>
          <label style={S.label}>Semester Type</label>
          <select style={S.input} value={type} onChange={(e)=>setType(e.target.value)}>
            <option value="first">First Semester</option>
            <option value="second">Second Semester</option>
            <option value="summer">Summer</option>
          </select>
        </div>
        <Field label="Start Date" type="date" required value={start} onChange={setStart} />
        <Field label="End Date" type="date" required value={end} onChange={setEnd} />
        <MsgBox msg={msg} />
        <ButtonRow><CancelBtn onClick={()=>{ setSF(false); setMsg('') }} /><SaveBtn onClick={add} loading={saving} /></ButtonRow>
      </FormBox>}
      {loading?<Spinner />:semesters.length===0
        ?<EmptyState text="No semesters yet" subtext={isFinalized?'No semesters recorded':'Add first, second, or summer semesters'} />
        :semesters.map(s=>(
          <div key={s.id} style={{ marginBottom:'8px' }}>
            {!isFinalized&&editId===s.id ? (
              <FormBox>
                <p style={{ margin:'0 0 12px 0', fontSize:'14px', fontWeight:'bold', color:'#17202A' }}>{semTitle(s.type)}</p>
                <Field label="Start Date" type="date" required value={editStart} onChange={setEditStart} />
                <Field label="End Date" type="date" required value={editEnd} onChange={setEditEnd} />
                <MsgBox msg={editMsg} />
                <ButtonRow>
                  <CancelBtn onClick={()=>{ setEditId(null); setEditMsg('') }} />
                  <SaveBtn onClick={()=>saveEdit(s.id)} loading={editSaving} />
                </ButtonRow>
              </FormBox>
            ) : (
              <div style={{ ...S.listCard, backgroundColor:s.is_current?'#f0f8ff':'#f8f9fa', borderColor:s.is_current?APPS.registry.color:'#eaecee' }}>
                <div style={{ flex:1 }}>
                  <p style={S.listCardTitle}>{semTitle(s.type)}</p>
                  <p style={S.listCardSub}>
                    {new Date(s.start_date).toLocaleDateString('en-NG',{month:'short',year:'numeric'})} — {new Date(s.end_date).toLocaleDateString('en-NG',{month:'short',year:'numeric'})}
                  </p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  {s.is_current&&<Badge text="Current" role="lecturer" />}
                  {!isFinalized&&isAdmin&&(
                    <>
                      <button style={{ ...S.ghostBtn, fontSize:'12px', padding:'3px 10px' }}
                        onClick={()=>{ setEditId(s.id); setEditStart(s.start_date); setEditEnd(s.end_date); setEditMsg('') }}>Edit</button>
                      {!s.is_current&&<button style={{ ...S.ghostBtn, fontSize:'12px', padding:'3px 10px' }}
                        onClick={()=>setCurrent(s.id)}>Set current</button>}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  )
}
