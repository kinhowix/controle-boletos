import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5Lb48EZ-RIolRX57E0W1SVz32dfsWasU",
  authDomain: "controle-boletos-empresa.firebaseapp.com",
  projectId: "controle-boletos-empresa",
  storageBucket: "controle-boletos-empresa.firebasestorage.app",
  messagingSenderId: "239850076757",
  appId: "1:239850076757:web:e6399e4a0200a0218f72dc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  // Verificação de segurança para o Cron do Vercel
  // if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).end('Unauthorized');
  // }

  try {
    // 1. Buscar o número de WhatsApp configurado
    const settingsDoc = await getDoc(doc(db, "config", "global_settings"));
    const settings = settingsDoc.exists() ? settingsDoc.data() : null;

    if (!settings || !settings.whatsappNumber) {
      return res.status(400).json({ error: "WhatsApp não configurado em global_settings" });
    }

    const waNumber = settings.whatsappNumber.replace(/\D/g, '');

    // 2. Calcular a data de vencimento (daqui a 3 dias)
    const alvo = new Date();
    alvo.setDate(alvo.getDate() + 3);
    alvo.setHours(0, 0, 0, 0);

    // No Firestore, boletos podem estar como Timestamp ou String YYYY-MM-DD
    // Vamos buscar todos não pagos e filtrar no código para maior precisão (ou query específica)
    const boletosRef = collection(db, "boletos");
    const q = query(boletosRef, where("pago", "==", false));
    const querySnapshot = await getDocs(q);

    const lembretes = [];

    querySnapshot.forEach((docSnap) => {
      const b = docSnap.data();
      let vencimentoDate = null;

      if (b.vencimento?.toDate) {
        vencimentoDate = b.vencimento.toDate();
      } else if (typeof b.vencimento === "string") {
        const [y, m, d] = b.vencimento.split('-').map(Number);
        vencimentoDate = new Date(y, m - 1, d);
      } else {
        vencimentoDate = new Date(b.vencimento);
      }

      if (vencimentoDate) {
        vencimentoDate.setHours(0, 0, 0, 0);

        // Verifica se é exatamente daqui a 3 dias
        const diffTime = vencimentoDate.getTime() - alvo.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        if (diffDays === 0) {
          lembretes.push({
            empresa: b.empresa,
            valor: b.valor,
            vencimento: vencimentoDate.toLocaleDateString('pt-BR'),
          });
        }
      }
    });

    if (lembretes.length === 0) {
      return res.status(200).json({ message: "Nenhum boleto vencendo em 3 dias." });
    }

    // 3. Disparar os avisos por WhatsApp
    // Como não há uma API nativa gratuita, sugerimos Z-API, Whapi.cloud ou CallMeBot.
    // Exemplo usando um Webhook genérico ou CallMeBot (precisa de API Key)
    for (const item of lembretes) {
      const mensagem = `🔔 *Lembrete de Boleto*\n\n` +
        `*Empresa:* ${item.empresa}\n` +
        `*Valor:* R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
        `*Vencimento:* ${item.vencimento}\n\n` +
        `Por favor, acesse o sistema para processá-lo.\n` +
          `https://controle-boletos-sable.vercel.app/login`;

      console.log(`Enviando WhatsApp para ${waNumber}: ${item.empresa}`);

      // NOTE: Aqui você deve integrar com sua API de WhatsApp escolhida.
      // Exemplo genérico (substitua pela sua URL de API):
      /*
      await fetch(`https://api.seuservico.com/send?phone=${waNumber}&text=${encodeURIComponent(mensagem)}`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer SUA_API_KEY' }
      });
      */
    }

    return res.status(200).json({
      success: true,
      count: lembretes.length,
      target: waNumber
    });

  } catch (error) {
    console.error("Erro no cron:", error);
    return res.status(500).json({ error: error.message });
  }
}
