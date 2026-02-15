
# Atos Multimídia - Church Media Group

Este é um sistema interno para gestão de grupos de mídia de igrejas, construído com NextJS e Firebase.

## 🛠️ Tecnologias Utilizadas

- **Framework**: NextJS 15 (App Router)
- **UI**: ShadCN UI + Tailwind CSS
- **Autenticação**: Firebase Authentication
- **Banco de Dados**: Cloud Firestore (NoSQL)

## 🗄️ Onde estão os dados?

Este projeto **não utiliza Cloud SQL**. Todos os dados estão armazenados no ecossistema Firebase:

1.  **Usuários e Senhas**: Gerenciados pelo *Firebase Authentication*.
2.  **Dados da Aplicação**: (Escalas, Louvores, Eventos, Funções) Estão no *Cloud Firestore*.

## 💰 Viabilidade e Limites (Plano Spark)

Este projeto foi desenhado para operar permanentemente dentro do plano gratuito do Firebase. Para uma equipe de **7 usuários**, o consumo é praticamente irrelevante frente aos limites:

- **Authentication**: 50.000 usuários/mês (Uso atual: 0.01%).
- **Firestore (Banco de Dados)**:
  - Leituras: 50.000/dia.
  - Escritas: 20.000/dia.
  - Armazenamento: 1 GB (Suficiente para anos de histórico de escalas e letras).

*Nota: O sistema é "zero custo" para a igreja na escala atual e suporta crescimento sem necessidade de upgrade imediato.*

## 🚀 Portabilidade

O projeto é totalmente independente. O banco de dados e a autenticação são serviços de nuvem, permitindo hospedagem em plataformas como Vercel, Firebase App Hosting ou Netlify sem perda de dados.

---

Para suporte ou modificações, utilize o App Prototyper no Firebase Studio.
