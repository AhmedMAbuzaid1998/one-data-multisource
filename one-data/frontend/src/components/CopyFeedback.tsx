import { useEffect, useState } from 'react'
export async function copyText(text:string) {
 try { await navigator.clipboard.writeText(text); window.dispatchEvent(new CustomEvent('copy-feedback',{detail:'Copied'})) }
 catch { window.dispatchEvent(new CustomEvent('copy-feedback',{detail:'Copy failed. Select the text and press Ctrl+C / Cmd+C.'})) }
}
export default function CopyFeedback(){
 const [message,setMessage]=useState('')
 useEffect(()=>{let timer:ReturnType<typeof setTimeout>;const show=(value:string)=>{setMessage(value);clearTimeout(timer);timer=setTimeout(()=>setMessage(''),2200)};const feedback=(event:Event)=>show((event as CustomEvent<string>).detail);const copied=()=>{if(window.getSelection()?.toString() || ((document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) && document.activeElement.selectionStart!==document.activeElement.selectionEnd))show('Copied')};window.addEventListener('copy-feedback',feedback);document.addEventListener('copy',copied);return()=>{clearTimeout(timer);window.removeEventListener('copy-feedback',feedback);document.removeEventListener('copy',copied)}},[])
 return <div id="copy-feedback" className={`copy-toast${message?' visible':''}`} role="status" aria-live="polite">{message}</div>
}
