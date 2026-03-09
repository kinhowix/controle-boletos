import { db } from "./firebase";

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  limit
} from "firebase/firestore";

const ref = collection(db, "notas");

// ======================
// LISTAR NOTAS
// ======================

export async function getNotas() {

  const snapshot = await getDocs(ref);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

}

// ======================
// ADICIONAR NOTA
// ======================

export async function addNota(nota) {

  const docRef = await addDoc(ref, nota);

  return docRef.id;

}

// ======================
// VERIFICAR DUPLICIDADE
// ======================

export async function existeNota(numeroNF, cnpj) {

  if (!numeroNF || !cnpj) return false;

  const q = query(
    ref,
    where("numeroNF", "==", numeroNF),
    where("cnpj", "==", cnpj),
    limit(1)
  );

  const snapshot = await getDocs(q);

  return !snapshot.empty;

}

// ======================
// MARCAR NOTA USADA
// ======================

export async function marcarNotaUsada(id, boletoId) {

  const docRef = doc(db, "notas", id);

  await updateDoc(docRef, {
    usadaEmBoleto: true,
    boletoId: boletoId,
  });

}

// ======================
// ATUALIZAR NOTA
// ======================

export async function updateNota(id, dados) {

  const docRef = doc(db, "notas", id);

  await updateDoc(docRef, dados);

}

// ======================
// EXCLUIR NOTA
// ======================

export async function deleteNota(id) {

  const docRef = doc(db, "notas", id);

  await deleteDoc(docRef);

}