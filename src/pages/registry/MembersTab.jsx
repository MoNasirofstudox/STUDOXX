import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { ALL_ROLES, APPS } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, Field, SectionHeader, Badge, FormBox, ButtonRow, CancelBtn, SaveBtn, AddButton, BulkButton } from '../../components/Shared.jsx'
import BulkUploadMembers from './BulkUploadMembers.jsx'
import S from '../../styles.js'

export default function MembersTab({ school, isAdmin }) {
  const [members,setMembers]=useState([]); const [loading,setLoading]=useState(true)
  const [showForm,setSF]=useState(false); const [bulkView,setBulk]=useState(false)
  const [email,setEmail]=useState(''); const [firstName,setFN]=useState(''); const [lastName,setLN]=useState('')
  const [role,setRole]=useState('student'); const [deptId,setDeptId]=useState('')
  const [departments,setDepartments]=useState([])
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState(null); const [search,setSearch]=useState('')
  const needsDept = ['hod','exam_officer'].includes(role)

  useEffect(()=>{ load() },[])

  async function load() {
    setLoading(true)
    const [m,d] = await Promise.all([
      supabase.from('school_memberships')
      .select(`role, joined_at, department_id, profiles!school_memberships_user_id_fkey(first_name,last_name,email), departments(name)`)
        .eq('school_id',school.id).eq('is_active',true).order('joined_at',{ascending:false}),
      supabase.from('departments').select('id,name,code').eq('school_id',school.id).eq('is_active',true).order('name'),
    ])
    setMembers(m.data||[]); setDepartments(d.data||[]); setLoading(false)
  }

  async function add() {
    if(!email) { setMsg({type:'error',text:'Email is required.'}); return }
    if(needsDept&&!deptId) { setMsg({type:'error',text:'Department is required for this role.'}); return }
    setSaving(true); setMsg(null)
    const { data,error } = await supabase.rpc('invite_member',{
      p_email:email.trim().toLowerCase(), p_role:role,
      p_school_id:school.id, p_first_name:firstName||'Unknown', p_last_name:lastName||'Unknown'
    })
    if(error) {
      const errText = error.message?.toLowerCase().includes('email')&&error.message?.toLowerCase().includes('confirm')
        ? 'This user\'s email is not confirmed. Ask them to check their inbox, or disable email confirmation in Supabase settings.'
        : error.message
      setMsg({type:'error',text:errText}); setSaving(false); return
    }
    if(data?.status==='not_found') { setMsg({type:'notfound',email:email.trim().toLowerCase()}); setSaving(false); return }
    if(needsDept&&deptId) {
      const { data:mem } = await supabase.from('school_memberships')
        .select('id').eq('school_id',school.id).eq('role',role).eq('is_active',true)
        .order('created_at',{ascending:false}).limit(1).maybeSingle()
      if(mem) await supabase.from('school_memberships').update({ department_id:deptId }).eq('id',mem.id)
    }
    setSaving(false)
    setEmail(''); setFN(''); setLN(''); setRole('student'); setDeptId(''); setSF(false); load()
  }

  const filtered=members.filter(m=>!search||
    `${m.profiles?.first_name||''} ${m.profiles?.last_name||''}`.toLowerCase().includes(search.toLowerCase())||
    (m.profiles?.email||'').toLowerCase().includes(search.toLowerCase()))

  const grouped=ALL_ROLES.reduce((acc,r)=>{
    const list=filtered.filter(m=>m.role===r.value)
    if(list.length>0) acc[r.value]={label:r.label,list}
    return acc
  },{})

  if(bulkView) return <BulkUploadMembers school={school} onDone={()=>{ setBulk(false); load() }} onCancel={()=>setBulk(false)} />

  return (
    <div>
      <SectionHeader title="Members" subtitle={`${members.length} people in this institution`}
        action={isAdmin&&!showForm&&(
          <div style={{ display:'flex', gap:'8px' }}>
            <BulkButton onClick={()=>setBulk(true)} />
            <AddButton label="+ Add Member" onClick={()=>{ setSF(true); setMsg(null) }} color={APPS.registry.color} />
          </div>
        )} />
      {showForm&&(
        <FormBox>
          {msg?.type==='notfound'&&(
            <div style={{ backgroundColor:'#fef9e7', border:'1.5px solid #f39c12', borderRadius:'8px', padding:'14px 16px', marginBottom:'16px' }}>
              <p style={{ margin:'0 0 6px 0', fontWeight:'bold', fontSize:'14px', color:'#d35400' }}>No account found for {msg.email}</p>
              <p style={{ margin:'0 0 10px 0', fontSize:'13px', color:'#566573', lineHeight:'1.6' }}>This person doesn't have a Studox account yet. Send them this link:</p>
              <div style={{ backgroundColor:'#fff', border:'1px solid #d5d8dc', borderRadius:'6px', padding:'8px 12px', fontSize:'13px', color:'#2E86C1', wordBreak:'break-all' }}>{window.location.origin}</div>
            </div>
          )}
          {msg?.type==='error'&&<MsgBox msg={msg.text} type="error" />}
          <Field label="Email Address" type="email" required placeholder="member@email.com"
            value={email} onChange={(v)=>{ setEmail(v); if(msg?.type==='notfound') setMsg(null) }} />
          <div style={{ display:'flex', gap:'12px' }}>
            <div style={{ flex:1 }}><Field label="First Name" placeholder="e.g. Chidi" value={firstName} onChange={setFN} /></div>
            <div style={{ flex:1 }}><Field label="Last Name" placeholder="e.g. Okeke" value={lastName} onChange={setLN} /></div>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Role</label>
            <select style={S.input} value={role} onChange={(e)=>{ setRole(e.target.value); setDeptId('') }}>
              {ALL_ROLES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {needsDept&&(
            <div style={S.fieldGroup}>
              <label style={S.label}>Department <span style={{ color:'#c0392b' }}>*</span></label>
              {departments.length===0
                ?<p style={{ fontSize:'13px', color:'#c0392b', margin:'4px 0 0 0' }}>No departments found. Add departments in Structure first.</p>
                :<select style={S.input} value={deptId} onChange={(e)=>setDeptId(e.target.value)}>
                  <option value="">Select a department</option>
                  {departments.map(d=><option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                </select>}
              <p style={{ fontSize:'12px', color:'#7f8c8d', margin:'6px 0 0 0' }}>
                Scopes this {role==='hod'?'HOD':'Exam Officer'} to only see their department's courses and results.
              </p>
            </div>
          )}
          <ButtonRow>
            <CancelBtn onClick={()=>{ setSF(false); setMsg(null); setDeptId('') }} />
            <SaveBtn onClick={add} loading={saving} label="Add Member" />
          </ButtonRow>
        </FormBox>
      )}
      {members.length>5&&(
        <div style={{ marginBottom:'16px' }}>
          <input style={S.input} type="text" placeholder="Search by name or email..."
            value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>
      )}
      {loading?<Spinner />:members.length===0
        ?<EmptyState text="No members yet" subtext="Add members to your institution" />
        :Object.entries(grouped).map(([rk,{label,list}])=>(
          <div key={rk} style={{ marginBottom:'16px' }}>
            <p style={S.sectionLabel}>{label}s ({list.length})</p>
            {list.map((m,i)=>(
              <div key={i} style={S.listCard}>
                <div style={{ flex:1 }}>
                  <p style={S.listCardTitle}>{m.profiles?.first_name||'Unknown'} {m.profiles?.last_name||''}</p>
                  <p style={S.listCardSub}>
                    {m.profiles?.email||'—'}
                    {m.departments?.name&&<span style={{ marginLeft:'8px', color:'#0e6655', fontWeight:'bold' }}>· {m.departments.name}</span>}
                  </p>
                </div>
                <Badge text={m.role} role={m.role} />
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
