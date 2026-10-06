import { isApiMode } from '@/services/dataMode'

/** Truthful note for attachment pickers: files are only sent to the server in API mode. */
export const UPLOAD_NOTE = isApiMode ? 'The file is uploaded securely when you submit.' : 'The file stays in your browser; nothing is uploaded in this prototype.'
