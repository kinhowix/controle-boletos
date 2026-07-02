import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
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

// 🔎 verificar duplicidade eficiente

export async function existeNota(numeroNF, cnpj) {
  if (!numeroNF) return false;

  const q = query(
    ref,
    where("numeroNF", "==", numeroNF),
    where("cnpj", "==", cnpj || "")
  );

  const snapshot = await getDocs(q);

  return !snapshot.empty;
}

export async function existeBoletoNoMes({ empresaId, valor, vencimento }) {
  if (!empresaId || !valor || !vencimento) return false;

  const data = vencimento instanceof Date ? vencimento : new Date(vencimento);

  if (Number.isNaN(data.getTime())) return false;

  const valorNormalizado = Number(Number(valor).toFixed(2));
  const q = query(ref, where("empresaId", "==", empresaId));
  const snapshot = await getDocs(q);

  return snapshot.docs.some((docItem) => {
    const boleto = docItem.data();
    const vencimentoBoleto = boleto.vencimento?.toDate
      ? boleto.vencimento.toDate()
      : new Date(boleto.vencimento);

    if (Number.isNaN(vencimentoBoleto.getTime())) return false;

    const mesmoValor = Number(Number(boleto.valor).toFixed(2)) === valorNormalizado;
    const mesmoMes =
      vencimentoBoleto.getFullYear() === data.getFullYear() &&
      vencimentoBoleto.getMonth() === data.getMonth();

    return mesmoValor && mesmoMes;
  });
}