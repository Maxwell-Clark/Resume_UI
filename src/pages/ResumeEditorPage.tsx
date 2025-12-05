import React from 'react'
import { useParams } from 'react-router-dom'

export function ResumeEditorPage() {
  const { id } = useParams()

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Resume Editor</h1>
      <p className="text-slate-600 mb-8">
        Edit your resume content and formatting.
      </p>
      
      {id && (
        <p className="text-sm text-slate-500 mb-4">Editing Resume ID: {id}</p>
      )}

      <div className="border border-slate-200 rounded-lg p-8 min-h-[500px] bg-white dark:bg-slate-800 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-500">Rich Text Editor coming soon...</p>
        </div>
      </div>
    </div>
  )
}

