import { initializeApp } from 'firebase-admin/app'

// The only wiring file: registering a callable is one export line, and adding
// a feature never touches another domain's files.
initializeApp()

export { trefleSearch } from './plants/trefleSearch'
export { trefleDetails } from './plants/trefleDetails'
export { plantnetIdentify } from './plants/plantnetIdentify'
export { claimUsername } from './accounts/claimUsername'
export { logCare } from './care/logCare'
export { llmChat } from './ai/llmChat'
export { backfillGarden } from './backfill/backfillGarden'
