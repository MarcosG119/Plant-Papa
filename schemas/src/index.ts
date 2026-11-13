// The typed data template for every Firestore collection the mobile app and
// Cloud Functions share. Function writes validate through these schemas and
// stamp schemaVersion (see version.ts).
export { firestoreTimestampSchema, storageUrlSchema } from './common'
export type { FirestoreTimestamp } from './common'
export { CURRENT_SCHEMA_VERSION, schemaVersionSchema, stampSchemaVersion } from './version'
export type { WithSchemaVersion } from './version'
export { userProfileSchema } from './userProfile'
export type { UserProfile } from './userProfile'
export {
  USERNAME_PATTERN,
  usernameLowerSchema,
  usernameRegistrySchema,
  usernameSchema,
} from './usernames'
export type { UsernameRegistry } from './usernames'
export { careProfileSchema, plantSchema } from './plant'
export type { CareProfile, Plant } from './plant'
export { careEventTypeSchema, careLogEventSchema } from './careLog'
export type { CareEventType, CareLogEvent } from './careLog'
export { noteSchema } from './note'
export type { Note } from './note'
export { photoSchema } from './photo'
export type { Photo } from './photo'
export { chatMessageSchema, chatSchema } from './chat'
export type { Chat, ChatMessage } from './chat'
