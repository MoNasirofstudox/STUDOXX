import { ROLE_COLORS, STATUS_COLORS, APPS } from '../constants.js'
import S from '../styles.js'

export function Badge({ text, role }) {
  const c = ROLE_COLORS[role] || { bg:'#d6eaf8', color:'#1B4F72' }
  return (
    <span style={{ fontSize:'12px', fontWeight:'bold', backgroundColor:c.bg, color:c.color,
      padding:'3px 10px', borderRadius:'20px', textTransform:'capitalize', whiteSpace:'nowrap' }}>
      {text?.replace(/_/g,' ')}
    </span>
  )
}

export function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.none
  return (
    <span style={{ fontSize:'11px', fontWeight:'bold', backgroundColor:c.bg, color:c.color,
      padding:'2px 8px', borderRadius:'12px', textTransform:'capitalize' }}>
      {status||'none'}
    </span>
  )
}

export function Spinner() {
  return <p style={{ color:'#7f8c8d', fontSize:'14px', padding:'20px 0', textAlign:'center' }}>Loading...</p>
}

export function EmptyState({ text, subtext }) {
  return (
    <div style={{ border:'2px dashed #d5d8dc', borderRadius:'8px', padding:'28px', textAlign:'center' }}>
      <p style={{ fontSize:'14px', fontWeight:'bold', color:'#566573', margin:'0 0 6px 0' }}>{text}</p>
      <p style={{ fontSize:'13px', color:'#95a5a6', margin:0 }}>{subtext}</p>
    </div>
  )
}

export function MsgBox({ msg, type='error' }) {
  if (!msg) return null
  const map = {
    error:   { backgroundColor:'#fadbd8', color:'#c0392b' },
    success: { backgroundColor:'#d5f5e3', color:'#1e8449' },
    warning: { backgroundColor:'#fef9e7', color:'#d35400' },
    info:    { backgroundColor:'#d6eaf8', color:'#1B4F72' },
  }
  return (
    <div style={{ ...(map[type]||map.error), padding:'12px', borderRadius:'8px',
      fontSize:'14px', marginBottom:'16px', lineHeight:'1.5' }}>
      {msg}
    </div>
  )
}

export function Field({ label, type='text', placeholder, value, onChange, required }) {
  return (
    <div style={S.fieldGroup}>
      <label style={S.label}>{label}{required&&<span style={{ color:'#c0392b' }}> *</span>}</label>
      <input style={S.input} type={type} placeholder={placeholder}
        value={value} onChange={(e)=>onChange(e.target.value)} />
    </div>
  )
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
      <div>
        <h3 style={{ margin:'0 0 2px 0', fontSize:'16px', fontWeight:'bold', color:'#17202A' }}>{title}</h3>
        {subtitle&&<p style={{ margin:0, fontSize:'13px', color:'#7f8c8d' }}>{subtitle}</p>}
      </div>
      {action&&<div>{action}</div>}
    </div>
  )
}

export function ListCard({ title, sub, right, onClick, highlight, accentColor }) {
  return (
    <div style={{ ...S.listCard, cursor:onClick?'pointer':'default',
      backgroundColor:highlight?'#f0f8ff':'#f8f9fa',
      borderColor:highlight?(accentColor||APPS.registry.color):'#eaecee' }}
      onClick={onClick}>
      <div style={{ flex:1 }}>
        <p style={S.listCardTitle}>{title}</p>
        {sub&&<p style={S.listCardSub}>{sub}</p>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        {right}
        {onClick&&<span style={{ color:'#aab7b8', fontSize:'18px' }}>›</span>}
      </div>
    </div>
  )
}

export function FormBox({ children })   { return <div style={S.formBox}>{children}</div> }
export function ButtonRow({ children }) { return <div style={S.buttonRow}>{children}</div> }

export function CancelBtn({ onClick, disabled }) {
  return <button style={S.secondaryBtn} onClick={onClick} disabled={disabled}>Cancel</button>
}

export function SaveBtn({ onClick, loading, label='Save', disabled }) {
  return (
    <button style={(loading||disabled)?S.btnOff:S.btnFlex} onClick={onClick} disabled={loading||disabled}>
      {loading?'Saving...':label}
    </button>
  )
}

export function AddButton({ label, onClick, color }) {
  return <button style={{ ...S.addBtn, backgroundColor:color||'#1B4F72' }} onClick={onClick}>{label}</button>
}

export function BulkButton({ onClick }) {
  return <button style={S.ghostBtn} onClick={onClick}>↑ Bulk Upload</button>
}

export function Breadcrumb({ label, onClick, color }) {
  return <button style={{ ...S.breadcrumb, color:color||APPS.registry.color }} onClick={onClick}>← {label}</button>
}

export function ProgressBar({ done, total, color }) {
  const pct = total>0 ? Math.round((done/total)*100) : 0
  return (
    <div style={{ marginBottom:'16px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', color:'#566573', marginBottom:'6px' }}>
        <span>Processing...</span><span>{done}/{total} ({pct}%)</span>
      </div>
      <div style={{ height:'8px', backgroundColor:'#eaecee', borderRadius:'4px', overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${pct}%`, backgroundColor:color||'#1B4F72',
          borderRadius:'4px', transition:'width 0.2s ease' }} />
      </div>
    </div>
  )
}

export function InfoBox({ rows }) {
  return (
    <div style={S.infoBox}>
      {rows.map(([label,value],i)=>(
        <div key={label} style={{ ...S.infoRow, borderBottom:i<rows.length-1?'1px solid #eaecee':'none' }}>
          <span style={S.infoLabel}>{label}</span>
          <span style={S.infoValue}>{value}</span>
        </div>
      ))}
    </div>
  )
}

export function BulkTable({ columns, rows }) {
  const sc = { success:{color:'#1e8449',fontWeight:'bold'}, notfound:{color:'#d35400',fontWeight:'bold'},
    error:{color:'#c0392b',fontWeight:'bold'}, pending:{color:'#7f8c8d'} }
  return (
    <div style={{ maxHeight:'280px', overflowY:'auto', border:'1px solid #eaecee', borderRadius:'8px' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
        <thead>
          <tr style={{ backgroundColor:'#f8f9fa' }}>
            {[...columns.map(c=>c.label),'Status'].map(h=>(
              <th key={h} style={{ padding:'8px 12px', textAlign:'left', fontWeight:'bold',
                color:'#566573', borderBottom:'1px solid #eaecee', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i} style={{ borderBottom:'1px solid #f0f4f8',
              backgroundColor:row.status==='success'?'#f0fdf4':row.status==='error'?'#fff5f5':row.status==='notfound'?'#fffbeb':'#fff' }}>
              {columns.map(c=><td key={c.key} style={{ padding:'8px 12px' }}>{row[c.key]}</td>)}
              <td style={{ padding:'8px 12px', ...(sc[row.status]||sc.pending) }}>
                {row.status==='pending'&&'—'}{row.status==='success'&&'✓ Done'}
                {row.status==='notfound'&&'⚠ No account'}{row.status==='error'&&`✗ ${row.message||'Failed'}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function WorkflowBar({ status }) {
  const steps = ['draft','submitted','verified','approved','published']
  const idx = steps.indexOf(status||'draft')
  const labels = { draft:'Draft', submitted:'Submitted', verified:'Verified', approved:'Approved', published:'Published' }
  return (
    <div style={{ display:'flex', alignItems:'center', marginBottom:'16px', flexWrap:'wrap' }}>
      {steps.map((s,i)=>{
        const done=i<idx; const active=i===idx; const c=STATUS_COLORS[s]
        return (
          <div key={s} style={{ display:'flex', alignItems:'center' }}>
            <div style={{ padding:'4px 12px', borderRadius:'12px', fontSize:'12px',
              fontWeight:active?'bold':'normal',
              backgroundColor:active?c.bg:done?'#eafaf1':'#f8f9fa',
              color:active?c.color:done?'#7f8c8d':'#aab7b8',
              border:`1px solid ${active?c.color:done?'#d5d8dc':'#eaecee'}` }}>
              {done&&'✓ '}{labels[s]}
            </div>
            {i<steps.length-1&&<span style={{ color:'#d5d8dc', fontSize:'12px', margin:'0 2px' }}>›</span>}
          </div>
        )
      })}
    </div>
  )
}
