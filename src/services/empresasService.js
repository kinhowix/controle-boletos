import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

const ref = collection(db, "empresas");

export async function getEmpresas() {
  const snapshot = await getDocs(ref);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function addEmpresa(empresa) {
  const docRef = await addDoc(ref, empresa);
  return docRef.id;
}

export async function getEmpresaByCNPJ(cnpj) {
  if (!cnpj) return null;

  const q = query(ref, where("cnpj", "==", cnpj));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
  };
}

export async function updateEmpresa(id, dados) {
  const docRef = doc(db, "empresas", id);
  await updateDoc(docRef, dados);
}

export async function deleteEmpresa(id) {
  const docRef = doc(db, "empresas", id);
  await deleteDoc(docRef);
}