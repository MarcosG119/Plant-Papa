// Firestore path builders — collection and document shapes live here so a
// layout change never has to touch domain code.
export const userProfilePath = (uid: string) => `users/${uid}`
export const usernameRegistryPath = (usernameLower: string) =>
  `usernames/${usernameLower}`
export const plantPath = (uid: string, plantId: string) =>
  `users/${uid}/plants/${plantId}`
export const legacyGardenPath = (uid: string) => `myGarden/${uid}`
export const careLogCollectionPath = (uid: string, plantId: string) =>
  `${plantPath(uid, plantId)}/careLog`
export const chatsCollectionPath = (uid: string, plantId: string) =>
  `${plantPath(uid, plantId)}/chats`
export const chatMessagesCollectionPath = (
  uid: string,
  plantId: string,
  chatId: string,
) => `${chatsCollectionPath(uid, plantId)}/${chatId}/messages`
