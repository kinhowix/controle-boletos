// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5Lb48EZ-RIolRX57E0W1SVz32dfsWasU",
  authDomain: "controle-boletos-empresa.firebaseapp.com",
  projectId: "controle-boletos-empresa",
  storageBucket: "controle-boletos-empresa.firebasestorage.app",
  messagingSenderId: "239850076757",
  appId: "1:239850076757:web:e6399e4a0200a0218f72dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize a secondary app to allow admin to create users without logout
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");

export const db = getFirestore(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);





