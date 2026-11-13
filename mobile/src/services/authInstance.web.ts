import { getAuth, type Auth } from 'firebase/auth';

import { firebaseApp } from './firebaseApp';

// getAuth applies the web default (browser localStorage) persistence.
export const auth: Auth = getAuth(firebaseApp);
