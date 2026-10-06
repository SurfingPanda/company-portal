import { UPLOAD_NOTE } from '@/lib/uploadNotice'
import { AttachmentUpload } from '@/components/forms/AttachmentUpload'
import { RESUME_EXTENSIONS } from '@/lib/recruitmentValidation'

interface ResumeUploadProps {
  file: File | null
  onChange: (file: File | null) => void
  required?: boolean
  error?: string
}

/**
 * Resume/CV picker (PDF, DOC, DOCX; 5 MB). Built on the shared attachment control, so it is keyboard
 * accessible and shows the chosen filename with a Remove button. The file is NOT uploaded anywhere.
 */
export function ResumeUpload({ file, onChange, required, error }: ResumeUploadProps) {
  return (
    <AttachmentUpload
      file={file}
      onChange={onChange}
      required={required}
      error={error}
      label="Resume / CV"
      accept={RESUME_EXTENSIONS.map((e) => `.${e}`).join(',')}
      help={`PDF, DOC or DOCX, maximum 5 MB. ${UPLOAD_NOTE}`}
    />
  )
}
