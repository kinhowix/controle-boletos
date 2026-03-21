import { db } from "./firebase";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";

export async function getUsers() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    return [];
  }
}

export async function deleteUserDoc(uid) {
  try {
    await deleteDoc(doc(db, "users", uid));
    return true;
  } catch (error) {
    console.error("Erro ao remover documento do usuário:", error);
    return false;
  }
}

export async function setUserRole(uid, email, role) {
  try {
    await setDoc(doc(db, "users", uid), { email, role });
    return true;
  } catch (error) {
    console.error("Erro ao definir papel do usuário:", error);
    return false;
  }
}
