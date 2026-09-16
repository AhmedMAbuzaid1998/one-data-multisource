import { ChangeEvent, useRef, useState } from 'react'
import { importUsers, TestUser } from '../services/api'

interface Props {
  personalFileName: string | null
  personalRowCount: number
  onLoaded: (users: TestUser[], fileName: string) => void
  onUseMain: () => void
}

export default function DatasetUpload({ personalFileName, personalRowCount, onLoaded, onUseMain }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setImporting(true)
    setError('')
    try {
      const users = await importUsers(file)
      onLoaded(users, file.name)
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'The workbook could not be imported.')
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  return <section id="dataset-source" className={`dataset-source${personalFileName ? ' personal' : ''}`} aria-labelledby="dataset-source-title">
    <div id="dataset-source-icon" className="dataset-source-icon" aria-hidden="true">{personalFileName ? '▤' : '◫'}</div>
    <div id="dataset-source-copy" className="dataset-source-copy">
      <span id="dataset-source-label">DATA SOURCE</span>
      <h3 id="dataset-source-title">{personalFileName ? personalFileName : 'Main team dataset'}</h3>
      <p id="dataset-source-description">{personalFileName ? `${personalRowCount} personal rows are active in this browser session.` : 'Using the shared workbook maintained for your team.'}</p>
      {error && <p id="dataset-upload-error" className="dataset-upload-error" role="alert">{error}</p>}
    </div>
    <div id="dataset-source-actions" className="dataset-source-actions">
      {personalFileName && <button id="dataset-use-main" type="button" onClick={onUseMain}>Use main data</button>}
      <button id="dataset-choose-file" className="primary-action" type="button" onClick={() => inputRef.current?.click()} disabled={importing}>{importing ? 'Importing…' : personalFileName ? 'Replace file' : 'Upload personal file'}</button>
      <input id="dataset-file-input" ref={inputRef} className="sr-only" type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={chooseFile} />
    </div>
    <details id="dataset-format-help" className="dataset-format-help"><summary id="dataset-format-summary">Required Excel format</summary><p id="dataset-format-columns">First sheet with columns: Username, Market, Environment, User Type, Role, Payment Type, Account ID, Service ID. Maximum file size: 10 MB.</p></details>
  </section>
}
