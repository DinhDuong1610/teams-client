import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCPtZNdaqOkvA5WbMDOFcIWqPnNm1Ctvlk",
  authDomain: "ms-teams-4d8ff.firebaseapp.com",
  projectId: "ms-teams-4d8ff",
  storageBucket: "ms-teams-4d8ff.appspot.com",
  messagingSenderId: "848915545661",
  appId: "1:848915545661:web:f35a473d7be52fdd84b454"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();