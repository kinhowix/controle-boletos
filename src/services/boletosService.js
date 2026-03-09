import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const ref = collection(db, "boletos");

export async function getBoletos() {
  const snapshot = await getDocs(ref);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function addBoleto(boleto) {
  
  const docRef = await addDoc(ref, boleto);

  return docRef.id;

}

export async function deleteBoleto(id) {
  await deleteDoc(doc(db, "boletos", id));
}

export async function updateBoleto(id, data) {
  await updateDoc(doc(db, "boletos", id), data);
}

// 🔎 verificar duplicidade

export async function existeNota(numeroNF, cnpj) {

  const snapshot = await getDocs(ref);

  const lista = snapshot.docs.map((d) => d.data());

  return lista.find(
    (b) =>
      b.numeroNF === numeroNF &&
      b.cnpj === cnpj
  );
}