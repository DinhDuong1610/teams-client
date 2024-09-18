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

// // const app = initializeApp(firebaseConfig);

// // Import the functions you need from the SDKs you need
// // import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyBX5O2Q3I1IlkQncHlN7hONGgaWutYAVTY",
//   authDomain: "react-a2314.firebaseapp.com",
//   databaseURL: "https://react-a2314-default-rtdb.firebaseio.com",
//   projectId: "react-a2314",
//   storageBucket: "react-a2314.appspot.com",
//   messagingSenderId: "233675153225",
//   appId: "1:233675153225:web:dd0a40844cdbb327e48498",
//   measurementId: "G-1RB9DKBNW5"
// };


// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// Import the functions you need from the SDKs you need
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyCezb1clNNYX_CCbGy9L5Bkmwh7_bLsKfQ",
//   authDomain: "msteam-2b2f6.firebaseapp.com",
//   projectId: "msteam-2b2f6",
//   storageBucket: "msteam-2b2f6.appspot.com",
//   messagingSenderId: "715742503978",
//   appId: "1:715742503978:web:e476006dcaa1ea79abcf53",
//   measurementId: "G-YWC3TNKLV0"
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();