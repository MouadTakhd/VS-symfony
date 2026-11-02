import { request } from '@/api/client'
import { refs, renderList } from '@/lib/dom'
import { definePage } from '@/lib/page'
import { AllergyListSchema, PatientListSchema } from '@/schema'

// home.html's interface: every element this page touches, by data-ref and tag.
const homeView = {
  error: HTMLParagraphElement,
  patients: HTMLElement,
  allergies: HTMLElement,
  critical: HTMLElement,
  recent: HTMLTableSectionElement,
  recentRow: HTMLTemplateElement,
  searchForm:HTMLInputElement,
  search:HTMLInputElement,
  empty:HTMLParagraphElement
}


export default definePage(async ({ root , signal}) => {
  const $ = refs(root, homeView)
  $.search.addEventListener('input',()=>{
    const filter=$.search.value.trim().toLowerCase()
    let visible=0
    $.recent.querySelectorAll('tr').forEach((row)=>{
      const match = (row.textContent?? '').toLowerCase().includes(filter)
      row.hidden=!match
      if(match)visible++
    })
    $.empty.hidden= visible>0
  },{ signal })
  $.searchForm.addEventListener('submit',(e)=>e.preventDefault(),{signal})
  // TODO (roadmap step 2): move these calls into src/api/patients.ts and src/api/allergies.ts
  
  const [patients, allergies] = await Promise.all([
    request('GET', '/patients?_sort=visit&_order=desc', PatientListSchema),
    request('GET', '/allergies', AllergyListSchema),
  ])
  
  if (!patients.ok || !allergies.ok) {
    $.error.textContent = !patients.ok ? patients.message : !allergies.ok ? allergies.message : ''
    $.error.hidden = false
    return
  }

  $.patients.textContent = String(patients.data.length)
  $.allergies.textContent = String(allergies.data.length)
  $.critical.textContent = String(allergies.data.filter((a) => a.severity === 'life-threatening').length)

  const countFor = (id: string) => allergies.data.filter((a) => a.patientId === id).length
  renderList($.recent, $.recentRow, patients.data.slice(0, 6), (p) => {
    const n = countFor(p.id)
    return {
      ...p,
      allergyLabel: n === 0 ? 'No allergies' : `${n} ${n === 1 ? 'allergy' : 'allergies'}`,
      allergyClass: n === 0 ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-700',
    }
  })
})


    