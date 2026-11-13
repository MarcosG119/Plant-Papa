import { initializeApp, deleteApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

// Each test file gets a throwaway admin app pointed at the Firestore emulator
// (FIRESTORE_EMULATOR_HOST is set by `firebase emulators:exec`). A unique
// project id per file keeps tests isolated without touching production.
export interface TestDb {
  app: App
  db: Firestore
}

export async function createTestDb(projectId: string): Promise<TestDb> {
  const app = initializeApp({ projectId }, `${projectId}-${Date.now()}`)
  return { app, db: getFirestore(app) }
}

export async function destroyTestDb(handle: TestDb): Promise<void> {
  await handle.db.terminate()
  await deleteApp(handle.app)
}
