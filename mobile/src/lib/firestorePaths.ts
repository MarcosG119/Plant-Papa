// Firestore path builders for the mobile app — mirrors functions/src/lib/paths
// so a layout change only touches these two modules.
export const plantsCollectionPath = (uid: string) => `users/${uid}/plants`;
export const plantDocPath = (uid: string, plantId: string) => `users/${uid}/plants/${plantId}`;
export const photosCollectionPath = (uid: string, plantId: string) =>
  `users/${uid}/plants/${plantId}/photos`;
export const notesCollectionPath = (uid: string, plantId: string) =>
  `users/${uid}/plants/${plantId}/notes`;
export const noteDocPath = (uid: string, plantId: string, noteId: string) =>
  `${notesCollectionPath(uid, plantId)}/${noteId}`;
export const careLogCollectionPath = (uid: string, plantId: string) =>
  `users/${uid}/plants/${plantId}/careLog`;
export const chatsCollectionPath = (uid: string, plantId: string) =>
  `users/${uid}/plants/${plantId}/chats`;
export const chatMessagesCollectionPath = (
  uid: string,
  plantId: string,
  chatId: string,
) => `${chatsCollectionPath(uid, plantId)}/${chatId}/messages`;
