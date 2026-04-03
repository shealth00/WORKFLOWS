/**
 * Firebase initialization and exports.
 *
 * Exports: auth, db, storage, googleProvider, and Firestore/Storage helpers.
 * Collections: users, forms, forms/{id}/submissions (Drive sync when configured),
 * consentSubmissions,
 * precisionScreenings, precisionDiagnosticScreenings.
 * Storage: consent-uploads/{uid}/..., precision-diagnostic/{uid}/...
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocs, setDoc, collection, addDoc, updateDoc, deleteDoc, query, where, limit, onSnapshot, orderBy, serverTimestamp, getDocFromServer, getCountFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});
const dbId = firebaseConfig.firestoreDatabaseId;
export const db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc, 
  getDoc,
  getDocs,
  setDoc,
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  limit, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  getDocFromServer,
  getCountFromServer,
  ref,
  uploadBytes,
  getDownloadURL
};

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
