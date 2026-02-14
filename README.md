# Atos Multimídia - Church Media Group

Este é um sistema interno para gestão de grupos de mídia de igrejas, construído com NextJS e Firebase.

## 🛠️ Tecnologias Utilizadas

- **Framework**: NextJS 15 (App Router)
- **UI**: ShadCN UI + Tailwind CSS
- **Autenticação**: Firebase Authentication
- **Banco de Dados**: Cloud Firestore (NoSQL)
- **IA**: Genkit (Google AI)

## 🗄️ Onde estão os dados?

Este projeto **não utiliza Cloud SQL**. Todos os dados estão armazenados no ecossistema Firebase:

1.  **Usuários e Senhas**: Gerenciados pelo *Firebase Authentication*.
2.  **Dados da Aplicação**: (Escalas, Louvores, Eventos, Funções) Estão no *Cloud Firestore*.

## 💰 Limites do Plano Gratuito (Firebase Spark)

Este projeto foi desenhado para operar dentro do plano gratuito do Firebase. Abaixo estão os limites principais:

- **Authentication**: Até 50.000 usuários ativos mensais.
- **Firestore (Banco de Dados)**:
  - Armazenamento: 1 GB (milhares de escalas e músicas).
  - Leituras: 50.000 por dia.
  - Escritas/Deleções: 20.000 por dia.
- **Hospedagem**: Se usar Firebase Hosting, o limite é de 10 GB de armazenamento e 360 MB de transferência diária.

*Nota: Para um grupo de mídia de igreja, esses limites são mais do que suficientes para operar sem custos.*

## 🚀 Portabilidade

Este projeto é totalmente portátil. Como o banco de dados e a autenticação são serviços de nuvem, você pode hospedar em qualquer plataforma (Netlify, Vercel, Firebase App Hosting).

---

Para suporte ou modificações, utilize o App Prototyper no Firebase Studio.
