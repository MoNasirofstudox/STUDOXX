import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient.js'
import { APPS } from '../../constants.js'
import { Spinner, EmptyState, MsgBox, Field, SectionHeader, ListCard, FormBox, ButtonRow, CancelBtn, SaveBtn, AddButton, BulkButton, Breadcrumb } from '../../components/Shared.jsx'
import BulkUploadCourses from './BulkUploadCourses.jsx'
import S from '../../styles.js'

export default function StructureTab({ school, isAdmin }) {
  const [structure,setStructure]=useState([]); const [loading,setLoading]=useState(true)
  const [view,setView]=useState('faculties'); const [selFaculty,setSelFaculty]=useState(null)
  const [selDept,setSelDept]=useState(null); const [selProgram,setSelProgram]=useState(null)

  useEffect(()=>{ loadStructure() },[])

  async function loadStructure() {
    setLoading(true)
    const { data } = await supabase.rpc('get_faculty_structure',{ p_school_id:school.id })
    setStructure(data||[]); setLoading(false)
  }

  if (loading) return <Spinner />

  if (view==='courses'&&selProgram&&selDept) return (
    <CoursesView school={school} program={selProgram} dept={selDept} isAdmin={isAdmin}
      onBack={()=>{ setSelProgram(null); setView('programs'); loadStructure() }} />
  )
  if (view==='programs'&&selDept&&selFaculty) {
    const fac  = structure.find(f=>f.id===selFaculty.id)
    const dept = (fac?.departments||[]).find(d=>d.id===selDept.id)||selDept
    return (
      <ProgramsView school={school} dept={dept} programs={dept?.programs||[]} isAdmin={isAdmin}
        onBack={()=>{ setSelDept(null); setView('departments'); loadStructure() }}
        onEnterProgram={(p)=>{ setSelProgram(p); setView('courses') }} onSaved={loadStructure} />
    )
  }
  if (view==='departments'&&selFaculty) {
    const fac = structure.find(f=>f.id===selFaculty.id)
    return (
      <DepartmentsView school={school} faculty={fac||selFaculty} departments={fac?.departments||[]} isAdmin={isAdmin}
        onBack={()=>{ setSelFaculty(null); setView('faculties'); loadStructure() }}
        onEnterDept={(d)=>{ setSelDept(d); setView('programs') }} onSaved={loadStructure} />
    )
  }
  return (
    <FacultiesView school={school} faculties={structure} isAdmin={isAdmin}
      onEnterFaculty={(f)=>{ setSelFaculty(f); setView('departments') }} onSaved={loadStructure} />
  )
}

function FacultiesView({ school, faculties, isAdmin, onEnterFaculty, onSaved }) {
  const [showForm,setSF]=useState(false); const [name,setName]=useState(''); const [code,setCode]=useState('')
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState('')
  async function add() {
    if (!name||!code) { setMsg('Name and code are required.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.from('faculties').insert({ school_id:school.id, name, code:code.toUpperCase() })
    setSaving(false)
    if (error) setMsg(error.message)
    else { setName(''); setCode(''); setSF(false); onSaved() }
  }
  return (
    <div>
      <SectionHeader title="Faculties" subtitle="Click a faculty to manage its departments"
        action={isAdmin&&!showForm&&<AddButton label="+ Add Faculty" onClick={()=>setSF(true)} color={APPS.registry.color} />} />
      {showForm&&<FormBox>
        <Field label="Faculty Name" required placeholder="e.g. Faculty of Engineering" value={name} onChange={setName} />
        <Field label="Short Code" required placeholder="e.g. ENG" value={code} onChange={setCode} />
        <MsgBox msg={msg} />
        <ButtonRow><CancelBtn onClick={()=>{ setSF(false); setMsg('') }} /><SaveBtn onClick={add} loading={saving} /></ButtonRow>
      </FormBox>}
      {faculties.length===0?<EmptyState text="No faculties yet" subtext="Add your first faculty above" />:
        faculties.map(f=><ListCard key={f.id} title={f.name} sub={`Code: ${f.code} · ${(f.departments||[]).length} dept(s)`} onClick={()=>onEnterFaculty(f)} />)}
    </div>
  )
}

function DepartmentsView({ school, faculty, departments, isAdmin, onBack, onEnterDept, onSaved }) {
  const [showForm,setSF]=useState(false); const [name,setName]=useState(''); const [code,setCode]=useState('')
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState('')
  async function add() {
    if (!name||!code) { setMsg('Name and code are required.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.from('departments').insert({ school_id:school.id, faculty_id:faculty.id, name, code:code.toUpperCase() })
    setSaving(false)
    if (error) setMsg(error.message)
    else { setName(''); setCode(''); setSF(false); onSaved() }
  }
  return (
    <div>
      <Breadcrumb label="All Faculties" onClick={onBack} />
      <SectionHeader title={faculty.name} subtitle="Click a department to manage its programs"
        action={isAdmin&&!showForm&&<AddButton label="+ Add Department" onClick={()=>setSF(true)} color={APPS.registry.color} />} />
      {showForm&&<FormBox>
        <Field label="Department Name" required placeholder="e.g. Dept. of Computer Science" value={name} onChange={setName} />
        <Field label="Short Code" required placeholder="e.g. CSC" value={code} onChange={setCode} />
        <MsgBox msg={msg} />
        <ButtonRow><CancelBtn onClick={()=>{ setSF(false); setMsg('') }} /><SaveBtn onClick={add} loading={saving} /></ButtonRow>
      </FormBox>}
      {departments.length===0?<EmptyState text="No departments yet" subtext="Add your first department above" />:
        departments.map(d=><ListCard key={d.id} title={d.name} sub={`Code: ${d.code} · ${(d.programs||[]).length} program(s)`} onClick={()=>onEnterDept(d)} />)}
    </div>
  )
}

function ProgramsView({ school, dept, programs, isAdmin, onBack, onEnterProgram, onSaved }) {
  const [showForm,setSF]=useState(false); const [name,setName]=useState(''); const [code,setCode]=useState('')
  const [years,setYears]=useState('4'); const [saving,setSaving]=useState(false); const [msg,setMsg]=useState('')
  async function add() {
    if (!name||!code) { setMsg('Name and code are required.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.from('programs').insert({ school_id:school.id, department_id:dept.id, name, code:code.toUpperCase(), duration_years:parseInt(years), level:'undergraduate' })
    setSaving(false)
    if (error) setMsg(error.message)
    else { setName(''); setCode(''); setYears('4'); setSF(false); onSaved() }
  }
  return (
    <div>
      <Breadcrumb label="Departments" onClick={onBack} />
      <SectionHeader title={dept.name} subtitle="Click a program to manage its courses"
        action={isAdmin&&!showForm&&<AddButton label="+ Add Program" onClick={()=>setSF(true)} color={APPS.registry.color} />} />
      {showForm&&<FormBox>
        <Field label="Program Name" required placeholder="e.g. B.Sc Computer Science" value={name} onChange={setName} />
        <Field label="Program Code" required placeholder="e.g. BSC-CS" value={code} onChange={setCode} />
        <div style={S.fieldGroup}>
          <label style={S.label}>Duration</label>
          <select style={S.input} value={years} onChange={(e)=>setYears(e.target.value)}>
            {['3','4','5','6'].map(y=><option key={y} value={y}>{y} years</option>)}
          </select>
        </div>
        <MsgBox msg={msg} />
        <ButtonRow><CancelBtn onClick={()=>{ setSF(false); setMsg('') }} /><SaveBtn onClick={add} loading={saving} /></ButtonRow>
      </FormBox>}
      {programs.length===0?<EmptyState text="No programs yet" subtext="Add your first program above" />:
        programs.map(p=><ListCard key={p.id} title={p.name} sub={`Code: ${p.code} · ${p.duration_years} years`} onClick={()=>onEnterProgram(p)} />)}
    </div>
  )
}

function CoursesView({ school, program, dept, isAdmin, onBack }) {
  const [courses,setCourses]=useState([]); const [loading,setLoading]=useState(true)
  const [showForm,setSF]=useState(false); const [bulkView,setBulk]=useState(false)
  const [name,setName]=useState(''); const [code,setCode]=useState(''); const [units,setUnits]=useState('3')
  const [level,setLevel]=useState('100'); const [sem,setSem]=useState('first'); const [elective,setElective]=useState(false)
  const [saving,setSaving]=useState(false); const [msg,setMsg]=useState('')

  useEffect(()=>{ load() },[])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('courses').select('*').eq('department_id',dept.id).eq('is_active',true).order('level').order('code')
    setCourses(data||[]); setLoading(false)
  }
  async function add() {
    if (!name||!code) { setMsg('Name and code are required.'); return }
    setSaving(true); setMsg('')
    const { error } = await supabase.from('courses').insert({ school_id:school.id, department_id:dept.id, name, code:code.toUpperCase(), credit_units:parseInt(units), level:parseInt(level), semester_type:sem, is_elective:elective })
    setSaving(false)
    if (error) setMsg(error.message)
    else { setName(''); setCode(''); setUnits('3'); setLevel('100'); setSem('first'); setElective(false); setSF(false); load() }
  }

  if (bulkView) return <BulkUploadCourses school={school} dept={dept} onDone={()=>{ setBulk(false); load() }} onCancel={()=>setBulk(false)} />

  const grouped = courses.reduce((acc,c)=>{ const k=c.level?`${c.level} Level`:'General'; if(!acc[k]) acc[k]=[]; acc[k].push(c); return acc },{})

  return (
    <div>
      <Breadcrumb label="Programs" onClick={onBack} />
      <SectionHeader title={program.name} subtitle={`${program.code} · ${program.duration_years} years`}
        action={isAdmin&&!showForm&&(
          <div style={{ display:'flex', gap:'8px' }}>
            <BulkButton onClick={()=>setBulk(true)} />
            <AddButton label="+ Add Course" onClick={()=>setSF(true)} color={APPS.registry.color} />
          </div>
        )} />
      {showForm&&<FormBox>
        <Field label="Course Title" required placeholder="e.g. Data Structures" value={name} onChange={setName} />
        <Field label="Course Code" required placeholder="e.g. CSC301" value={code} onChange={setCode} />
        <div style={{ display:'flex', gap:'12px' }}>
          <div style={{ ...S.fieldGroup, flex:1 }}>
            <label style={S.label}>Credit Units</label>
            <select style={S.input} value={units} onChange={(e)=>setUnits(e.target.value)}>
              {['1','2','3','4','5','6'].map(u=><option key={u} value={u}>{u} units</option>)}
            </select>
          </div>
          <div style={{ ...S.fieldGroup, flex:1 }}>
            <label style={S.label}>Level</label>
            <select style={S.input} value={level} onChange={(e)=>setLevel(e.target.value)}>
              {['100','200','300','400','500','600'].map(l=><option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={S.fieldGroup}>
          <label style={S.label}>Semester</label>
          <select style={S.input} value={sem} onChange={(e)=>setSem(e.target.value)}>
            <option value="first">First Semester</option>
            <option value="second">Second Semester</option>
            <option value="summer">Summer</option>
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
          <input type="checkbox" id="elective" checked={elective} onChange={(e)=>setElective(e.target.checked)} />
          <label htmlFor="elective" style={{ fontSize:'14px', color:'#34495e', cursor:'pointer' }}>Elective course</label>
        </div>
        <MsgBox msg={msg} />
        <ButtonRow><CancelBtn onClick={()=>{ setSF(false); setMsg('') }} /><SaveBtn onClick={add} loading={saving} /></ButtonRow>
      </FormBox>}
      {loading?<Spinner />:courses.length===0?<EmptyState text="No courses yet" subtext="Add your first course above" />:
        Object.entries(grouped).map(([lbl,cs])=>(
          <div key={lbl} style={{ marginBottom:'16px' }}>
            <p style={S.sectionLabel}>{lbl}</p>
            {cs.map(c=>(
              <div key={c.id} style={S.listCard}>
                <div style={{ flex:1 }}>
                  <p style={S.listCardTitle}>{c.name}</p>
                  <p style={S.listCardSub}>{c.code} · {c.credit_units} units · {c.semester_type}{c.is_elective?' · Elective':''}</p>
                </div>
                <span style={{ fontSize:'13px', fontWeight:'bold', backgroundColor:'#f0f4f8', color:'#566573', padding:'3px 8px', borderRadius:'6px' }}>{c.credit_units}u</span>
              </div>
            ))}
          </div>
        ))}
    </div>
  )
}
