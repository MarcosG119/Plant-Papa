// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// TODO: Add SDKs for Firebase products that you want to use




// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

const firebaseConfig = {

    apiKey: "AIzaSyDfUO83Q-7_pHvEretn2ZcuH0krfSI6XrA",
  
    authDomain: "plant-papa.firebaseapp.com",
  
    projectId: "plant-papa",
  
    storageBucket: "plant-papa.appspot.com",
  
    messagingSenderId: "487304988103",
  
    appId: "1:487304988103:web:16de89072b2a5661b8c5e2"
  
  };
  


// Initialize Firebase

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const app = initializeApp(firebaseConfig);

//authentication
export const auth = getAuth(app);
// can add google auth here
// export const googleProvider = new GoogleAuthProvider();

//database
export const db = getFirestore(app);