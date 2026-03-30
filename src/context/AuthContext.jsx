import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [role, setRole] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [avisoVencimentoMostrado, setAvisoVencimentoMostrado] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuario(user);
        // Buscar o papel do usuário no Firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setRole(docSnap.data().role || "usuario");
        } else {
          // Se não existir, define como usuário comum por padrão
          setRole("usuario");
        }
      } else {
        setUsuario(null);
        setRole(null);
        setAvisoVencimentoMostrado(false);
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, role, carregando, avisoVencimentoMostrado, setAvisoVencimentoMostrado }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
