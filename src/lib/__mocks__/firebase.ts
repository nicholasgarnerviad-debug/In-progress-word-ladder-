/* Mock Firebase module for testing */
import { Firestore } from 'firebase/firestore';

const mockFirestore: Firestore = {} as Firestore;

export const firestore = mockFirestore;
