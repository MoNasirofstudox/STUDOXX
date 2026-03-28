import { useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { ALL_ROLES } from '../../constants.js'
import { Breadcrumb, SectionHeader, ProgressBar, BulkTable, CancelBtn } from '../../components/Shared.jsx'
import S from '../../styles.js'

export default function BulkUploadMembers({ school, onDone, onCancel }) {
  const [rows,setRows]=useState([]); const [errors,setErrors]=useState([])
  const [progress,setProg]=useState(null); const [running,setRunning]=useState(false); const [finished,setFinished]=useState(false)

  function dlTemplate() {
    const csv=['first_name,last_name,email,role','Chidi,Okeke,chidi@uni.edu.ng,student'].join('\n')
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='members_template.csv'; a.click()
  }

  function handleFile(e) {
    const file=e.target.files[0]; if(!file) return
    const reader=new FileReader()
    reader.onload=(evt)=>{
      const lines=evt.target.result.trim().split('\n'); const header=lines[0].split(',').map(h=>h.trim().toLowerCase())
      const missing=['email','role'].filter(r=>!header.includes(r))
      if(missing.length>0) { setErrors([`Missing columns: ${missing.join(', ')}`]); setRows([]); return }
      const parsed=[]; const errs=[]; const validRoles=ALL_ROLES.map(r=>r.value)
      lines.slice(1).forEach((line,i)=>{
        if(!line.trim()) return
        const vals=line.split(',').map(v=>v.trim()); const row={}
        header.forEach((h,idx)=>{ row[h]=vals[idx]||'' })
        if(!row.email||!row.email.includes('@')) { errs.push(`Row ${i+2}: invalid email`); return }
        if(!validRoles.includes(row.role)) { errs.push(`Row ${i+2}: invalid role "${row.role}"`); return }
        parsed.push({ email:row.email.toLowerCase(), first_name:row.first_name||'Unknown', last_name:row.last_name||'Unknown', role:row.role, status:'pending', message:'' })
      })
      setErrors(errs); setRows(parsed)
    }
    reader.readAsText(file)
  }

  async function upload() {
    setRunning(true); setFinished(false); const updated=[...rows]; setProg({ done:0, total:updated.length })
    for(let i=0;i<updated.length;i++) {
      const row=updated[i]
      const { data,error } = await supabase.rpc('invite_member',{ p_email:row.email, p_role:row.role, p_school_id:school.id, p_first_name:row.first_name, p_last_name:row.last_name })
      if(error) updated[i]={ ...row, status:'error', message:error.message }
      else if(data?.status==='not_found') updated[i]={ ...row, status:'notfound', message:'No account yet' }
      else updated[i]={ ...row, status:'success', message:'Added' }
      setRows([...updated]); setProg({ done:i+1, total:updated.length })
      await new Promise(r=>setTimeout(r,150))
    }
    setRunning(false); setFinished(true)
  }

  const sc=rows.filter(r=>r.status==='success').length
  const nf=rows.filter(r=>r.status==='notfound').length
  const ec=rows.filter(r=>r.status==='error').length
  const columns=[{key:'first_name',label:'First Name'},{key:'last_name',label:'Last Name'},{key:'email',label:'Email'},{key:'role',label:'Role'}]

  return (
    <div>
      <Breadcrumb label="Back to Members" onClick={onCancel} />
      <SectionHeader title="Bulk Upload Members" subtitle="Upload a CSV to add multiple members at once" />
      <div style={S.stepBox}>
        <p style={S.stepNum}>Step 1</p><p style={S.stepTitle}>Download the template</p>
        <p style={S.stepSub}>Required: <strong>email</strong>, <strong>role</strong>. Optional: first_name, last_name.</p>
        <button style={S.ghostBtn} onClick={dlTemplate}>↓ Download Template</button>
      </div>
      <div style={S.stepBox}>
        <p style={S.stepNum}>Step 2</p><p style={S.stepTitle}>Upload your CSV</p>
        <input type="file" accept=".csv" onChange={handleFile} style={{ fontSize:'14px', color:'#566573' }} />
      </div>
      {errors.length>0&&<div style={{ ...S.errorBox, marginBottom:'16px' }}><strong>Fix these errors first:</strong><ul style={{ margin:'8px 0 0 0', paddingLeft:'20px' }}>{errors.map((e,i)=><li key={i} style={{ fontSize:'13px' }}>{e}</li>)}</ul></div>}
      {rows.length>0&&errors.length===0&&(
        <div style={S.stepBox}>
          <p style={S.stepNum}>Step 3</p><p style={S.stepTitle}>Preview — {rows.length} row(s)</p>
          {progress&&<ProgressBar done={progress.done} total={progress.total} />}
          {finished&&<div style={{ backgroundColor:'#f8f9fa', borderRadius:'8px', padding:'12px 16px', marginBottom:'16px', fontSize:'14px' }}>
            <span style={{ color:'#1e8449', fontWeight:'bold', marginRight:'16px' }}>✓ {sc} added</span>
            {nf>0&&<span style={{ color:'#d35400', fontWeight:'bold', marginRight:'16px' }}>⚠ {nf} no account</span>}
            {ec>0&&<span style={{ color:'#c0392b', fontWeight:'bold' }}>✗ {ec} failed</span>}
          </div>}
          <BulkTable columns={columns} rows={rows} />
          <div style={{ ...S.buttonRow, marginTop:'16px' }}>
            {!finished
              ?(<><CancelBtn onClick={onCancel} disabled={running} /><button style={running?S.btnOff:S.btnFlex} onClick={upload} disabled={running}>{running?`Processing ${progress?.done||0}/${rows.length}...`:`Upload ${rows.length} Members`}</button></>)
              :<button style={S.btn} onClick={onDone}>Done — Back to Members</button>}
          </div>
        </div>
      )}
    </div>
  )
}
