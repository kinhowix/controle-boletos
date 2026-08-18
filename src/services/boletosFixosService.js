import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

const ref = collection(db, "boletosFixos");

export async function getBoletosFixos() {
  try {
    const snapshot = await getDocs(ref);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao obter boletos fixos:", error);
    return [];
  }
}

export async function addBoletoFixo(boletoFixo) {
  try {
    const docRef = await addDoc(ref, boletoFixo);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar boleto fixo:", error);
    throw error;
  }
}

export async function updateBoletoFixo(id, dados) {
  try {
    const docRef = doc(db, "boletosFixos", id);
    await updateDoc(docRef, dados);
  } catch (error) {
    console.error("Erro ao atualizar boleto fixo:", error);
    throw error;
  }
}

export async function deleteBoletoFixo(id) {
  try {
    const docRef = doc(db, "boletosFixos", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Erro ao excluir boleto fixo:", error);
    throw error;
  }
}
