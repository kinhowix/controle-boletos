import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const SETTINGS_DOC_ID = "global_settings";

export async function getSettings() {
  try {
    const docRef = doc(db, "config", SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return {};
  }
}

export async function updateSettings(data) {
  try {
    const docRef = doc(db, "config", SETTINGS_DOC_ID);
    await setDoc(docRef, data, { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return false;
  }
}
