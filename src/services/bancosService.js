import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";

const ref = collection(db, "bancos");

export async function getBancos() {
  const snapshot = await getDocs(ref);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function addBanco(banco) {
  const docRef = await addDoc(ref, banco);
  return docRef.id;
}
