import { useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { Breadcrumb, SectionHeader, ProgressBar, BulkTable, CancelBtn } from '../../components/Shared.jsx'
import S from '../../styles.js'

export default function BulkUploadCourses({ school, dept, onDone, onCancel }) {
  const [rows,setRows]=useState([]); const [errors,setErrors]=useState([])
  const [progress,setProg]=useState(null); const [running,setRunning]=useState(false); const [finished,setFinished]=useState(false)

  function dlTemplate() {
    const csv=['title,code,credit_units,level,semester,is_elective','Introduction to Programming,CSC101,3,100,first,false'].join('\n')
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='courses_template.csv'; a.click()
  }

  function handleFile(e) {
    const file=e.target.files[0]; if(!file) return
    const reader=new FileReader()
    reader.onload=(evt)=>{
      const lines=evt.target.result.trim().split('\n'); const header=lines[0].split(',').map(h=>h.trim().toLowerCase())
      const missing=['title','code'].filter(r=>!header.includes(r))
      if(missing.length>0) { setErrors([`Missing columns: ${missing.join(', ')}`]); setRows([]); return }
      const parsed=[]; const errs=[]; const vSems=['first','second','summer']; const vLevels=['100','200','300','400','500','600']
      lines.slice(1).forEach((line,i)=>{
        if(!line.trim()) return
        const vals=line.split(',').map(v=>v.trim()); const row={}
        header.forEach((h,idx)=>{ row[h]=vals[idx]||'' })
        if(!row.title) { errs.push(`Row ${i+2}: title required`); return }
        if(!row.code)  { errs.push(`Row ${i+2}: code required`); return }
        const sem=row.semester||'first'; const level=row.level||'100'; const units=parseInt(row.credit_units)||3
        if(!vSems.includes(sem))             { errs.push(`Row ${i+2}: invalid semester`); return }
        if(!vLevels.includes(String(level))) { errs.push(`Row ${i+2}: invalid level`); return }
        parsed.push({ title:row.title, code:row.code.toUpperCase(), units, level:parseInt(level), semester:sem, elective:row.is_elective==='true', status:'pending', message:'' })
      })
      setErrors(errs); setRows(parsed)
    }
    reader.readAsText(file)
  }

  async function upload() {
    setRunning(true); setFinished(false); const updated=[...rows]; setProg({ done:0, total:updated.length })
    for(let i=0;i<updated.length;i++) {
      const row=updated[i]
      const { error } = await supabase.from('courses').insert({ school_id:school.id, department_id:dept.id, name:row.title, code:row.code, credit_units:row.units, level:row.level, semester_type:row.semester, is_elective:row.elective })
      if(error) updated[i]={ ...row, status:'error', message:error.code==='23505'?'Duplicate code':error.message }
      else      updated[i]={ ...row, status:'success', message:'Added' }
      setRows([...updated]); setProg({ done:i+1, total:updated.length })
      await new Promise(r=>setTimeout(r,100))
    }
    setRunning(false); setFinished(true)
  }

  const sc=rows.filter(r=>r.status==='success').length
  const ec=rows.filter(r=>r.status==='error').length
  const columns=[{key:'title',label:'Title'},{key:'code',label:'Code'},{key:'units',label:'Units'},{key:'level',label:'Level'},{key:'semester',label:'Semester'}]

  return (
    <div>
      <Breadcrumb label="Back to Courses" onClick={onCancel} />
      <SectionHeader title="Bulk Upload Courses" subtitle={`Adding courses to ${dept.name}`} />
      <div style={S.stepBox}>
        <p style={S.stepNum}>Step 1</p><p style={S.stepTitle}>Download the template</p>
        <p style={S.stepSub}>Required: title, code. Optional: credit_units, level, semester, is_elective.</p>
        <button style={S.ghostBtn} onClick={dlTemplate}>↓ Download Template</button>
      </div>
      <div style={S.stepBox}>
        <p style={S.stepNum}>Step 2</p><p style={S.stepTitle}>Upload your CSV</p>
        <input type="file" accept=".csv" onChange={handleFile} style={{ fontSize:'14px', color:'#566573' }} />
      </div>
      {errors.length>0&&<div style={{ ...S.errorBox, marginBottom:'16px' }}><strong>Fix these errors:</strong><ul style={{ margin:'8px 0 0 0', paddingLeft:'20px' }}>{errors.map((e,i)=><li key={i} style={{ fontSize:'13px' }}>{e}</li>)}</ul></div>}
      {rows.length>0&&errors.length===0&&(
        <div style={S.stepBox}>
          <p style={S.stepNum}>Step 3</p><p style={S.stepTitle}>Preview — {rows.length} course(s)</p>
          {progress&&<ProgressBar done={progress.done} total={progress.total} />}
          {finished&&<div style={{ backgroundColor:'#f8f9fa', borderRadius:'8px', padding:'12px 16px', marginBottom:'16px', fontSize:'14px' }}>
            <span style={{ color:'#1e8449', fontWeight:'bold', marginRight:'16px' }}>✓ {sc} added</span>
            {ec>0&&<span style={{ color:'#c0392b', fontWeight:'bold' }}>✗ {ec} failed</span>}
          </div>}
          <BulkTable columns={columns} rows={rows} />
          <div style={{ ...S.buttonRow, marginTop:'16px' }}>
            {!finished
              ?(<><CancelBtn onClick={onCancel} disabled={running} /><button style={running?S.btnOff:S.btnFlex} onClick={upload} disabled={running}>{running?`Processing ${progress?.done||0}/${rows.length}...`:`Upload ${rows.length} Courses`}</button></>)
              :<button style={S.btn} onClick={onDone}>Done — Back to Courses</button>}
          </div>
        </div>
      )}
    </div>
  )
}
