import { useState } from 'react'
import { DataColumn, Filters, TestUser } from '../services/api'
import { cellText } from '../services/tableData'
export default function DynamicFilters({rows,columns,filters,onChange,onReset}:{rows:TestUser[];columns:DataColumn[];filters:Filters;onChange:(value:Filters)=>void;onReset:()=>void}){
 const [chosen,setChosen]=useState<string[]|null>(()=>{try{const value=JSON.parse(localStorage.getItem('one-data-filter-columns')||'null');return Array.isArray(value)&&value.every(item=>typeof item==='string')?value:null}catch{return null}})
 const defaults=columns.filter(column=>!column.sensitive&&!['username','accountId','serviceId','_source'].includes(column.key)&&new Set(rows.map(row=>cellText(row,column.key))).size<=20).slice(0,5).map(column=>column.key)
 const selected=chosen??defaults
 function choose(key:string){const next=selected.includes(key)?selected.filter(item=>item!==key):[...selected,key];setChosen(next);try{localStorage.setItem('one-data-filter-columns',JSON.stringify(next))}catch{};if(!next.includes(key)){const updated={...filters};delete updated[key];onChange(updated)}}
 return <aside id="filter-panel" className="filter-panel curated-filters" aria-label="Filter table data">
 <div id="filter-header" className="filter-header"><h3 id="filter-title">Refine results</h3><button id="filter-clear-all" className="text-button" onClick={onReset}>Clear filters</button></div>
 <details id="filter-chooser"><summary id="filter-chooser-title">Choose filter columns</summary><div id="filter-chooser-options">{columns.map((column,index)=><label id={`filter-choice-label-${index}`} key={column.key}><input id={`filter-choice-${index}`} type="checkbox" checked={selected.includes(column.key)} onChange={()=>choose(column.key)}/>{column.label}</label>)}</div></details>
 <p id="filter-help" className="filter-help">Labels follow your sources. Choose the columns you need. Small value lists use buttons; larger lists use text search.</p>
 <div id="curated-filter-grid" className="curated-filter-grid">{columns.filter(column=>selected.includes(column.key)).map((column,index)=>{
 const values=[...new Set(rows.map(row=>cellText(row,column.key)).filter(Boolean))].sort((a,b)=>a.localeCompare(b));const textField=column.sensitive||values.length>30||['username','accountId','serviceId'].includes(column.key)
 return <fieldset id={`filter-group-${index}`} key={column.key} className="filter-group"><legend id={`filter-legend-${index}`}>{column.label}</legend>
 {textField?<input id={`filter-input-${index}`} type={column.sensitive?'password':'search'} autoComplete="off" aria-label={column.label} placeholder={`Search ${column.label}`} value={filters[column.key]||''} onChange={event=>onChange({...filters,[column.key]:event.target.value})}/>:<div id={`filter-values-${index}`} className="filter-options">{values.map((value,option)=><button id={`filter-${index}-${option}`} key={value} className={`filter-chip${filters[column.key]===`=${value}`?' selected':''}`} aria-pressed={filters[column.key]===`=${value}`} onClick={()=>onChange({...filters,[column.key]:filters[column.key]===`=${value}`?'':`=${value}`})}>{value}</button>)}{rows.some(row=>row[column.key]==null)&&<button id={`filter-null-${index}`} className={`filter-chip${filters[column.key]==='__NULL__'?' selected':''}`} aria-pressed={filters[column.key]==='__NULL__'} onClick={()=>onChange({...filters,[column.key]:filters[column.key]==='__NULL__'?'':'__NULL__'})}>null</button>}</div>}
 </fieldset>})}</div>
 {!columns.some(column=>selected.includes(column.key))&&<p id="filter-empty-selection">Choose filter columns above.</p>}
 </aside>
}
