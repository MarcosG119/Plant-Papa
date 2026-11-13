// Firestore path builders for the mobile app — mirrors functions/src/lib/paths
// so a layout change only touches these two modules.
export const plantsCollectionPath = (uid: string) => `users/${uid}/plants`;
export const plantDocPath = (uid: string, plantId: string) => `users/${uid}/plants/${plantId}`;
export const photosCollectionPath = (uid: string, plantId: string) =>
  `users/${uid}/plants/${plantId}/photos`;
