export const nigerianStates = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
]

export const ALL_ROLES = [
  { value:'student',       label:'Student'            },
  { value:'lecturer',      label:'Lecturer'           },
  { value:'exam_officer',  label:'Exam Officer'       },
  { value:'hod',           label:'Head of Department' },
  { value:'dean',          label:'Dean of Faculty'    },
  { value:'school_admin',  label:'School Admin'       },
]

export const ROLE_COLORS = {
  school_admin: { bg:'#fadbd8', color:'#c0392b' },
  dean:         { bg:'#e8daef', color:'#6c3483' },
  hod:          { bg:'#fdebd0', color:'#d35400' },
  exam_officer: { bg:'#d1f2eb', color:'#0e6655' },
  lecturer:     { bg:'#d5f5e3', color:'#1e8449' },
  student:      { bg:'#d6eaf8', color:'#1B4F72' },
}

export const STATUS_COLORS = {
  none:      { bg:'#f0f4f8', color:'#7f8c8d' },
  draft:     { bg:'#f0f4f8', color:'#566573' },
  submitted: { bg:'#d6eaf8', color:'#1B4F72' },
  verified:  { bg:'#d1f2eb', color:'#0e6655' },
  approved:  { bg:'#fdebd0', color:'#d35400' },
  published: { bg:'#d5f5e3', color:'#1e8449' },
}

export const APPS = {
  registry: { id:'registry', name:'Registry', tagline:'School Administration & Setup', color:'#1B4F72', light:'#d6eaf8', icon:'🏛️', status:'active' },
  acadex:   { id:'acadex',   name:'Acadex',   tagline:'Academic Records & Results',    color:'#1a6b3c', light:'#d5f5e3', icon:'📊', status:'active' },
  skedocs:  { id:'skedocs',  name:'Skedocs',  tagline:'Smart Scheduling & Documents', color:'#6c3483', light:'#e8daef', icon:'📅', status:'soon'   },
}

export const ACADEX_LAST_SCHOOL_KEY = 'acadex_last_school_slug'

export function semesterLabel(sem) {
  if (!sem) return ''
  const t = sem.type==='first' ? 'First Semester' : sem.type==='second' ? 'Second Semester' : 'Summer'
  return `${sem.session_name} · ${t}`
}
