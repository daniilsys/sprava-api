# Sprava API

Base URL: `/`

## Authentication

All authenticated routes require a `Authorization: Bearer <accessToken>` header.

Tokens are JWTs:
- **Access token**: 15 minutes
- **Refresh token**: 7 days (rotation on each refresh)

## Rate Limiting

| Scope | Limit | Window | Routes |
|-------|-------|--------|--------|
| IP | 30 req | 60s | `/auth/*` |
| User | 100 req | 60s | All authenticated routes |

Headers returned on every request:
- `X-RateLimit-Limit` — max requests per window
- `X-RateLimit-Remaining` — remaining requests
- `Retry-After` — seconds until reset (only on 429)

## Error Format

All errors follow this format:

```json
{
  "error": "Message d'erreur"
}
```

| Status | Description |
|--------|-------------|
| 400 | Validation / bad request |
| 401 | Token manquant ou invalide |
| 403 | Accès refusé / bloqué |
| 404 | Ressource introuvable |
| 409 | Conflit (doublon) |
| 429 | Rate limit dépassé |
| 500 | Erreur interne |

---

## Auth

### `POST /auth/register`

Crée un compte utilisateur.

**Body:**

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `username` | string | oui | 3-32 caractères |
| `email` | string | oui | Email valide |
| `password` | string | oui | 8-128 caractères |

**Réponse:** `201`

```json
{
  "user": {
    "id": "123456789",
    "username": "alice",
    "email": "alice@example.com",
    "avatarUrl": null,
    "createdAt": "2026-03-20T10:00:00.000Z"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### `POST /auth/login`

**Body:**

| Champ | Type | Requis |
|-------|------|--------|
| `email` | string | oui |
| `password` | string | oui |

**Réponse:** `200` — Même format que register.

### `POST /auth/refresh`

**Body:**

| Champ | Type | Requis |
|-------|------|--------|
| `refreshToken` | string | oui |

**Réponse:** `200`

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### `POST /auth/logout`

**Body:**

| Champ | Type | Requis |
|-------|------|--------|
| `refreshToken` | string | oui |

**Réponse:** `204` No Content

---

## Users

Toutes les routes nécessitent une authentification.

### `GET /users/me`

Retourne le profil de l'utilisateur connecté.

**Réponse:** `200`

```json
{
  "id": "123456789",
  "username": "alice",
  "email": "alice@example.com",
  "avatarUrl": "https://cdn.sprava.top/avatars/uuid.png",
  "createdAt": "2026-03-20T10:00:00.000Z"
}
```

### `PATCH /users/me`

Met à jour le profil.

**Body:**

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `username` | string | non | 3-32 caractères |

**Réponse:** `200` — Objet user mis à jour.

### `GET /users/search?q={query}`

Recherche des utilisateurs par nom. Exclut les utilisateurs bloqués (dans les deux sens) et l'utilisateur courant.

| Param | Type | Requis |
|-------|------|--------|
| `q` | string | oui |

**Réponse:** `200`

```json
[
  {
    "id": "987654321",
    "username": "bob",
    "avatarUrl": null
  }
]
```

### `GET /users/:id`

Retourne le profil public d'un utilisateur.

**Réponse:** `200` — Même format que `/users/me`.

---

## Conversations

Toutes les routes nécessitent une authentification.

### `POST /conversations`

Crée une conversation. Si 2 membres → DM, si 3+ → groupe (max 50 membres).

Le créateur d'un groupe en devient automatiquement le propriétaire (`ownerId`).

Les DMs ne peuvent pas être créés avec un utilisateur bloqué. Les groupes n'ont pas cette restriction.

**Body:**

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `name` | string | non | 1-100 caractères |
| `memberIds` | string[] | oui | 1-49 IDs (+ créateur = 50 max) |

**Réponse:** `201`

```json
{
  "id": "111222333",
  "name": "Mon groupe",
  "iconUrl": null,
  "isGroup": true,
  "ownerId": "123456789",
  "createdAt": "2026-03-20T10:00:00.000Z",
  "updatedAt": "2026-03-20T10:00:00.000Z",
  "members": [
    {
      "userId": "123456789",
      "joinedAt": "2026-03-20T10:00:00.000Z",
      "user": {
        "id": "123456789",
        "username": "alice",
        "avatarUrl": null
      }
    }
  ]
}
```

`ownerId` est `null` pour les DMs.

### `GET /conversations`

Liste les conversations de l'utilisateur, triées par `updatedAt` desc. Inclut le dernier message.

**Réponse:** `200`

```json
[
  {
    "id": "111222333",
    "name": null,
    "iconUrl": null,
    "isGroup": false,
    "ownerId": null,
    "createdAt": "...",
    "updatedAt": "...",
    "members": [...],
    "lastMessage": {
      "id": "444555666",
      "content": "Salut !",
      "deleted": false,
      "conversationId": "111222333",
      "senderId": "123456789",
      "createdAt": "...",
      "updatedAt": "...",
      "sender": { "id": "123456789", "username": "alice", "avatarUrl": null },
      "attachments": [],
      "reactions": [],
      "replyTo": null
    }
  }
]
```

`lastMessage` est `null` si la conversation n'a aucun message.

### `GET /conversations/unread/counts`

Retourne le nombre de messages non lus par conversation. Seules les conversations avec des messages non lus sont incluses.

**Réponse:** `200`

```json
[
  { "conversationId": "111222333", "unreadCount": 5 },
  { "conversationId": "444555666", "unreadCount": 12 }
]
```

### `GET /conversations/:id`

Retourne une conversation. L'utilisateur doit en être membre.

**Réponse:** `200` — Même format que la création (sans `lastMessage`).

### `POST /conversations/:id/members`

Ajoute des membres à un groupe. Tout membre du groupe peut ajouter. Le total ne peut pas dépasser 50 membres.

**Body:**

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `memberIds` | string[] | oui | 1-49 IDs |

**Réponse:** `200` — Conversation mise à jour.

### `DELETE /conversations/:id/members/:userId`

Retire un membre du groupe. **Owner uniquement.**

**Réponse:** `204` No Content

### `PUT /conversations/:id/owner`

Transfère la propriété du groupe à un autre membre. **Owner uniquement.**

**Body:**

| Champ | Type | Requis |
|-------|------|--------|
| `userId` | string | oui |

**Réponse:** `204` No Content

### `POST /conversations/:id/leave`

Quitte un groupe. Si l'owner quitte, le membre le plus ancien devient owner. Si c'était le dernier membre, le groupe est supprimé.

Non disponible pour les DMs.

**Réponse:** `204` No Content

### `PUT /conversations/:id/read`

Marque les messages comme lus jusqu'au message spécifié. Le `messageId` doit appartenir à la conversation. Ne peut pas régresser (si un message plus récent est déjà marqué comme lu, l'appel est ignoré).

**Body:**

| Champ | Type | Requis |
|-------|------|--------|
| `messageId` | string | oui |

**Réponse:** `200`

```json
{
  "userId": "123456789",
  "conversationId": "111222333",
  "lastMessageId": "444555666"
}
```

### `GET /conversations/:id/readstates`

Retourne les read states de tous les membres d'une conversation. L'utilisateur doit être membre.

**Réponse:** `200`

```json
[
  { "userId": "123456789", "lastMessageId": "444555666" },
  { "userId": "987654321", "lastMessageId": "333444555" }
]
```

---

## Messages

Toutes les routes nécessitent une authentification.

### `POST /messages`

Envoie un message. L'utilisateur doit être membre de la conversation. Dans un DM, l'envoi est bloqué si l'un des utilisateurs a bloqué l'autre. Pas de restriction dans les groupes.

**Body:**

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `content` | string | oui | 1-4000 caractères |
| `conversationId` | string | oui | |
| `replyToId` | string | non | ID d'un message de la même conversation |
| `attachmentIds` | string[] | non | Max 10 IDs |

Les `attachmentIds` référencent des fichiers uploadés via `POST /upload/attachments` qui n'ont pas encore été liés à un message. Ils doivent appartenir à l'utilisateur courant. Les attachments orphelins (non liés après 1h) sont automatiquement supprimés.

**Réponse:** `201`

```json
{
  "id": "444555666",
  "content": "Regarde cette image",
  "deleted": false,
  "conversationId": "111222333",
  "senderId": "123456789",
  "createdAt": "...",
  "updatedAt": "...",
  "sender": {
    "id": "123456789",
    "username": "alice",
    "avatarUrl": null
  },
  "attachments": [
    {
      "id": "777888999",
      "url": "https://cdn.sprava.top/attachments/uuid.png",
      "filename": "photo.png",
      "mimeType": "image/png",
      "size": 102400,
      "messageId": "444555666",
      "createdAt": "..."
    }
  ],
  "reactions": [],
  "replyTo": null
}
```

#### Message avec réponse

```json
{
  "id": "555666777",
  "content": "Bien reçu !",
  "deleted": false,
  "conversationId": "111222333",
  "senderId": "987654321",
  "replyTo": {
    "id": "444555666",
    "content": "Regarde cette image",
    "senderId": "123456789",
    "sender": { "id": "123456789", "username": "alice", "avatarUrl": null },
    "deleted": false
  },
  "..."
}
```

Si le message parent a été supprimé :

```json
{
  "replyTo": {
    "id": "444555666",
    "content": null,
    "senderId": "123456789",
    "sender": { "id": "123456789", "username": "alice", "avatarUrl": null },
    "deleted": true
  }
}
```

### `GET /messages/:conversationId`

Récupère les messages d'une conversation (pagination par curseur, ordre décroissant). Les messages supprimés sont inclus avec `deleted: true` et `content: null`.

| Param | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `cursor` | string | non | ID du dernier message reçu |
| `limit` | number | non | 1-100, défaut 50 |

**Réponse:** `200` — Tableau de messages.

#### Message supprimé

```json
{
  "id": "444555666",
  "content": null,
  "deleted": true,
  "conversationId": "111222333",
  "senderId": "123456789",
  "createdAt": "...",
  "updatedAt": "...",
  "sender": { "id": "123456789", "username": "alice", "avatarUrl": null },
  "attachments": [],
  "reactions": [],
  "replyTo": null
}
```

### `PATCH /messages/:id`

Modifie le contenu d'un message. Seul l'auteur peut modifier son message. Les messages supprimés ne peuvent pas être modifiés.

**Body:**

| Champ | Type | Requis | Contraintes |
|-------|------|--------|-------------|
| `content` | string | oui | 1-4000 caractères |

**Réponse:** `200` — Message mis à jour.

### `DELETE /messages/:id`

Supprime un message (soft-delete). Seul l'auteur peut supprimer son message. Le message reste visible dans le fil avec `deleted: true` et `content: null`.

**Réponse:** `204` No Content

### `PUT /messages/:messageId/reactions/:emoji`

Ajoute une réaction emoji à un message. L'utilisateur doit être membre de la conversation. Idempotent (pas d'erreur si la réaction existe déjà). Un utilisateur peut ajouter plusieurs emojis différents au même message.

L'emoji doit être un caractère Unicode valide (ex: `👍`, `❤️`, `😂`).

**Réponse:** `201`

```json
{
  "userId": "123456789",
  "messageId": "444555666",
  "emoji": "👍",
  "createdAt": "...",
  "user": { "id": "123456789", "username": "alice", "avatarUrl": null }
}
```

### `DELETE /messages/:messageId/reactions/:emoji`

Retire sa propre réaction d'un message.

**Réponse:** `204` No Content

### `GET /messages/:messageId/reactions`

Liste toutes les réactions d'un message.

**Réponse:** `200` — Tableau de réactions (même format que ci-dessus).

#### Reactions dans un message

Les réactions sont groupées par emoji dans les réponses de messages :

```json
{
  "reactions": [
    {
      "emoji": "👍",
      "count": 3,
      "users": [
        { "id": "123456789", "username": "alice", "avatarUrl": null },
        { "id": "987654321", "username": "bob", "avatarUrl": null }
      ]
    },
    {
      "emoji": "❤️",
      "count": 1,
      "users": [
        { "id": "123456789", "username": "alice", "avatarUrl": null }
      ]
    }
  ]
}
```

---

## Upload

Toutes les routes nécessitent une authentification. Les fichiers sont envoyés en `multipart/form-data` avec le champ `file`.

### `PUT /upload/avatar`

Upload l'avatar de l'utilisateur. Remplace l'ancien s'il existe.

| Contrainte | Valeur |
|------------|--------|
| Taille max | 5 MB |
| Types | image/jpeg, image/png, image/gif, image/webp |

**Réponse:** `200` — Objet user mis à jour (avec nouveau `avatarUrl`).

### `PUT /upload/conversations/:id/icon`

Upload l'icône d'une conversation. L'utilisateur doit être membre.

| Contrainte | Valeur |
|------------|--------|
| Taille max | 5 MB |
| Types | image/jpeg, image/png, image/gif, image/webp |

**Réponse:** `200` — Objet conversation mis à jour (avec nouveau `iconUrl`).

### `POST /upload/attachments`

Upload un fichier à lier ultérieurement à un message via `attachmentIds`. Les fichiers non liés après 1 heure sont automatiquement supprimés (fichier R2 + row DB).

| Contrainte | Valeur |
|------------|--------|
| Taille max | 25 MB |
| Types | image/jpeg, image/png, image/gif, image/webp, application/pdf, text/plain, audio/mpeg, audio/ogg, video/mp4, video/webm |

**Réponse:** `201`

```json
{
  "id": "777888999",
  "url": "https://cdn.sprava.top/attachments/uuid.png",
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "size": 204800,
  "messageId": null,
  "createdAt": "..."
}
```

---

## Friends

Toutes les routes nécessitent une authentification.

### `GET /friends`

Liste tous les amis acceptés.

**Réponse:** `200`

```json
[
  {
    "id": "987654321",
    "username": "bob",
    "avatarUrl": null,
    "since": "2026-03-20T10:00:00.000Z"
  }
]
```

### `DELETE /friends/:friendId`

Supprime un ami. Les deux côtés perdent la relation.

**Réponse:** `204` No Content

### `GET /friends/requests/pending`

Demandes d'ami reçues en attente.

**Réponse:** `200`

```json
[
  {
    "id": "fr123",
    "senderId": "987654321",
    "receiverId": "123456789",
    "status": "PENDING",
    "createdAt": "...",
    "sender": { "id": "987654321", "username": "bob", "avatarUrl": null },
    "receiver": { "id": "123456789", "username": "alice", "avatarUrl": null }
  }
]
```

### `GET /friends/requests/sent`

Demandes d'ami envoyées en attente. Même format que ci-dessus.

### `POST /friends/requests/:userId`

Envoie une demande d'ami.

Comportements spéciaux :
- Si l'autre utilisateur a déjà envoyé une demande → auto-accept
- Si un block existe dans un sens ou l'autre → `403`
- Si déjà amis → `409`
- Si demande déjà envoyée → `409`

**Réponse:** `201` — Objet FriendRequest.

### `POST /friends/requests/:requestId/accept`

Accepte une demande. Seul le destinataire peut accepter.

**Réponse:** `200` — FriendRequest avec `status: "ACCEPTED"`.

### `POST /friends/requests/:requestId/decline`

Décline une demande. Seul le destinataire peut décliner. La demande est supprimée de la DB.

**Réponse:** `204` No Content

### `DELETE /friends/requests/:requestId`

Annule une demande envoyée. Seul l'expéditeur peut annuler.

**Réponse:** `204` No Content

### `GET /friends/blocked`

Liste les utilisateurs bloqués par l'utilisateur courant.

**Réponse:** `200`

```json
[
  {
    "id": "987654321",
    "username": "bob",
    "avatarUrl": null,
    "blockedAt": "2026-03-20T10:00:00.000Z"
  }
]
```

### `POST /friends/block/:userId`

Bloque un utilisateur. Supprime automatiquement toute relation d'amitié ou demande en cours.

Effets du block :
- Impossible de créer un DM avec l'utilisateur bloqué
- Impossible d'envoyer un message dans un DM existant
- L'utilisateur bloqué n'apparaît plus dans la recherche
- Aucun effet sur les conversations de groupe

**Réponse:** `204` No Content

### `DELETE /friends/block/:userId`

Débloque un utilisateur. Seul le bloqueur peut débloquer.

**Réponse:** `204` No Content
