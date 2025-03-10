// Imports
import * as admin from 'firebase-admin';
import { kFirebaseConfigPath } from 'src/constant/path';

admin.initializeApp({
  credential: admin.credential.cert(kFirebaseConfigPath),
});

const firestore_db = admin.firestore();

export { firestore_db };
