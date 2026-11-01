import { DataColumn, TestUser } from './api'
export interface Dataset { id: string; name: string; rows: TestUser[] }
const normalized = (header: string) => header.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const aliases: Record<string, string[]> = {
 username:['username','usernamemsisdn','msisdn','user'], password:['pass','password'], market:['market','country','usedinwhichmarket'],
 environment:['environment','env'], userType:['usertype'], serviceType:['service','servicetype','servicetypes'],
 role:['role','businessrole'], paymentType:['payment','paymenttype'], accountId:['accountid'], serviceId:['serviceid'], journey:['journey','journeys','usedinwhichjourney','testscenario']
}
function keyFor(label: string) {
 const key=normalized(label)
 return Object.keys(aliases).find(name=>aliases[name].includes(key)) || `field_${key || Array.from(label).map(char=>char.codePointAt(0)?.toString(16)).join('_')}`
}
export function recordsToRows(records: unknown): TestUser[] {
 if (!Array.isArray(records) || !records.length || records.length>10000) throw new Error('Use an array of 1–10,000 row objects.')
 const definitions=new Map<string,DataColumn>()
 const rows=records.map((record,index)=>{
  if(!record || typeof record!=='object' || Array.isArray(record))throw new Error(`Row ${index+1} must be an object with named columns.`)
  const entries=Object.entries(record); if(entries.length>200)throw new Error('Maximum 200 columns per row.')
  const row:Record<string,unknown>={};const used=new Set<string>()
  for(const [header,value] of entries){
   if(!header.trim())throw new Error('Column headers must not be empty.')
   const key=keyFor(header)
   if(used.has(key))throw new Error(`Headers in the same row map to the same column: ${header}. Rename one before importing.`)
   used.add(key)
   definitions.set(key,definitions.get(key)||{key,label:header,sensitive:/pass(word)?|secret|token|credential/i.test(header)})
   row[key]=value==null || value==='' ? null : typeof value==='object'?JSON.stringify(value):value
  }
  return {...row,id:index+1} as TestUser
 })
 if(definitions.size>200)throw new Error('Maximum 200 distinct columns per source.')
 return rows.map(row=>({...row,columns:[...definitions.values()]}))
}
export function parseJsonRows(text: string): TestUser[] {
 const data=JSON.parse(text)
 return recordsToRows(Array.isArray(data)?data:data?.rows ?? data?.data)
}
export function harmonize(sources: Dataset[]): TestUser[] {
 if(sources.length>60 || sources.reduce((sum,source)=>sum+source.rows.length,0)>50000)throw new Error('Maximum 60 sources and 50,000 combined rows. Remove a source.')
 const columns=new Map<string,DataColumn>()
 const prepared=sources.map(source=>({source,rows:source.rows.map(row=>{
   const descriptors=row.columns || Object.keys(row).filter(key=>key!=='id'&&key!=='columns').map(key=>({key,label:key}))
   const mapped:Record<string,unknown>={}
   for(const column of descriptors){const key=keyFor(column.label);columns.set(key,columns.get(key)||{...column,key});mapped[key]=row[column.key]===''?null:row[column.key]??null}
   return mapped
 })}))
 if(columns.size>300)throw new Error('Combined sources exceed 300 columns. Remove a source.')
 const schema=[{key:'_source',label:'Source'},...columns.values()]
 const empty=Object.fromEntries([...columns.keys()].map(key=>[key,null]))
 return prepared.flatMap(({source,rows})=>rows.map(row=>({...empty,...row,_source:source.name,columns:schema}))).map((row,index)=>({...row,id:index+1} as unknown as TestUser))
}
export async function importDatasetFile(file: File): Promise<Array<{name:string;rows:TestUser[]}>> {
 if(file.size>10*1024*1024)throw new Error('Maximum file size is 10 MB.')
 if(/\.json$/i.test(file.name))return [{name:file.name,rows:parseJsonRows(await file.text())}]
 if(!/\.xlsx?$/i.test(file.name))throw new Error('Choose JSON, XLSX or XLS files.')
 const body=new FormData();body.append('file',file)
 const response=await fetch('/api/users/import-tables',{method:'POST',body})
 const result=await response.json()
 if(!response.ok)throw new Error(result.message||'Workbook import failed.')
 return result.map((sheet:{name:string;records:unknown})=>({name:`${file.name} · ${sheet.name}`,rows:recordsToRows(sheet.records)}))
}
