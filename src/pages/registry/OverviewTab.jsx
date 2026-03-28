import { useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { nigerianStates } from '../../constants.js'
import { SectionHeader, InfoBox, FormBox, Field, MsgBox, ButtonRow, CancelBtn, SaveBtn } from '../../components/Shared.jsx'
import S from '../../styles.js'

export default function OverviewTab({ school, onUpdated, isAdmin }) {
  const [editing,setEditing]=useState(false)
  const [name,setName]=useState(school.name)
  const [state,setState]=useState(school.state||'')
  const [email,setEmail]=useState(school.email||'')
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')

  async function save() {
    if (!name) { setMsg('Name is required.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.from('schools').update({ name, state, email }).eq('id',school.id)
    setSaving(false)
    if (error) setMsg(error.message)
    else { onUpdated({ name, state, email }); setEditing(false) }
  }

  return (
    <div>
      <SectionHeader title="Institution Overview"
        action={isAdmin&&!editing&&<button style={{ ...S.ghostBtn, fontSize:'12px', padding:'4px 12px' }} onClick={()=>setEditing(true)}>✏️ Edit</button>} />
      {editing ? (
        <FormBox>
          <Field label="Institution Name" required value={name} onChange={setName} />
          <div style={S.fieldGroup}>
            <label style={S.label}>State</label>
            <select style={S.input} value={state} onChange={(e)=>setState(e.target.value)}>
              <option value="">Select a state</option>
              {nigerianStates.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Field label="Official Email" type="email" value={email||''} onChange={setEmail} />
          <MsgBox msg={msg} />
          <ButtonRow><CancelBtn onClick={()=>{ setEditing(false); setMsg('') }} /><SaveBtn onClick={save} loading={saving} /></ButtonRow>
        </FormBox>
      ) : (
        <InfoBox rows={[
          ['School name', school.name], ['State', school.state], ['Level', school.level],
          ['Email', school.email||'—'], ['Plan', school.subscription_tier],
          ['Your role', school.your_role?.replace(/_/g,' ')], ['Status', school.is_active?'Active':'Inactive'],
        ]} />
      )}
    </div>
  )
}
