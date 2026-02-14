# FaithFlow - Church Media Group

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

Para visualizar ou editar os dados brutos, acesse o [Console do Firebase](https://console.firebase.google.com/) e localize o seu projeto.

## 👥 Hierarquia de Acesso

- **Moderador**: Acesso total, incluindo gestão de usuários e criação de funções.
- **Administrador**: Gestão de conteúdo (escalas, louvores, eventos).
- **Membro**: Visualização das escalas e envio de feedback.

---

Para suporte ou modificações, utilize o App Prototyper no Firebase Studio.
