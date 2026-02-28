import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
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
  await addDoc(ref, empresa);
}

export async function getEmpresaByCNPJ(cnpj) {

  const snapshot = await getDocs(ref);

  const lista = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return lista.find(
    (e) => e.cnpj === cnpj
  );
}