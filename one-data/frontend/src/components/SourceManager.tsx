import { useRef, useState } from 'react'
import { ConfluenceState } from '../services/api'
import { Dataset, importDatasetFile } from '../services/datasets'
export default function SourceManager({state,files,onAdd,onRemove}:{state:ConfluenceState|null;files:Dataset[];onAdd:(sources:Dataset[])=>void;onRemove:(id:string)=>void}){
 const input=useRef<HTMLInputElement>(null);const [url,setUrl]=useState('');const [busy,setBusy]=useState(false);const [message,setMessage]=useState('')
 async function action(run:()=>Promise<unknown>){setBusy(true);setMessage('');try{await run()}catch(error){setMessage(error instanceof Error?error.message:'Action failed.')}finally{setBusy(false)}}
 return <section id="source-manager" className="source-manager" aria-labelledby="source-manager-title">
 <h3 id="source-manager-title">Combined data sources</h3>
 <p id="source-manager-help">Add pages and files together. Matching headers are combined; missing values appear as null. Files remain in this session.</p>
 {window.confluenceDesktop&&<form id="source-page-form" className="source-page-form" onSubmit={event=>{event.preventDefault();void action(async()=>{await window.confluenceDesktop!.addPage(url);setUrl('')})}}>
 <label id="source-url-label" htmlFor="source-page-url">Confluence page link</label><input id="source-page-url" type="url" required value={url} onChange={event=>setUrl(event.target.value)} placeholder="https://cps.confluence.agile.vodafone.com/…"/>
 <button id="source-add-page" disabled={busy||state?.status==='refreshing'}>Add page</button>
 <button id="confluence-sign-in" type="button" disabled={busy} onClick={()=>void action(()=>window.confluenceDesktop!.signIn())}>Sign in to Confluence</button>
 <button id="source-refresh" type="button" disabled={busy||state?.status==='refreshing'} onClick={()=>void action(()=>window.confluenceDesktop!.refresh())}>Refresh pages</button>
 <button id="source-sign-out" type="button" disabled={busy} onClick={()=>void action(()=>window.confluenceDesktop!.signOut())}>Sign out & clear copies</button>
 </form>}
 <p id="source-status" role="status">{state?.message}</p>
 <button id="dataset-choose-file" type="button" className="primary-action" disabled={busy} onClick={()=>input.current?.click()}>{busy?'Working…':'Add JSON / Excel files'}</button>
 <input id="dataset-file-input" className="sr-only" ref={input} type="file" multiple accept=".json,.xlsx,.xls" onChange={event=>{const selected=Array.from(event.target.files||[]);event.target.value='';void action(async()=>{for(const file of selected){const loaded=await importDatasetFile(file);onAdd(loaded.map(source=>({...source,id:crypto.randomUUID()})))}})}}/>
 <p id="source-format-help">JSON: array of row objects, or an object containing rows/data. Excel: headers in the first row of each non-empty sheet. Up to 10 MB per file. Confluence links must use this organization’s configured host and contain a page ID.</p>
 {message&&<p id="source-error" role="alert" className="dataset-upload-error">{message}</p>}
 <ul id="source-list">{state?.sources?.map(source=><li id={`source-page-${source.id}`} key={source.id}><div id={`source-page-summary-${source.id}`}><strong id={`source-page-title-${source.id}`}>{source.title||`Page ${source.id}`}</strong><span id={`source-page-state-${source.id}`}>{source.status} · {source.rows.length} rows · {source.lastSuccess?new Date(source.lastSuccess).toLocaleString():'Not downloaded'}</span><p id={`source-page-message-${source.id}`}>{source.message}</p></div><button id={`source-remove-page-${source.id}`} disabled={busy||state.status==='refreshing'} onClick={()=>void action(()=>window.confluenceDesktop!.removePage(source.id))}>Remove page</button></li>)}
 {files.map(source=><li id={`source-file-${source.id}`} key={source.id}><span id={`source-file-label-${source.id}`}>{source.name} · {source.rows.length} rows</span><button id={`source-remove-file-${source.id}`} onClick={()=>onRemove(source.id)}>Remove file</button></li>)}</ul>
 </section>
}
