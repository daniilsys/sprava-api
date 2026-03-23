# Sprava Socket.IO

## Connexion

Le serveur Socket.IO est attaché au même serveur HTTP que l'API REST.

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "<accessToken>"
  }
});
```

Le token est vérifié à la connexion. Si le token est invalide ou manquant, la connexion est refusée avec une erreur `Missing token` ou `Invalid token`.

## Rooms

Chaque utilisateur connecté rejoint automatiquement :

| Room | Format | Description |
|------|--------|-------------|
| Personnelle | `user:<userId>` | Événements destinés à l'utilisateur |
| Conversations | `conversation:<conversationId>` | Une room par conversation dont l'utilisateur est membre |

Quand une nouvelle conversation est créée ou qu'un membre est ajouté, les sockets concernés sont automatiquement ajoutés à la room.

---

## Événements client → serveur

### `typing:start`

Signale que l'utilisateur commence à taper dans une conversation.

**Payload:** `conversationId: string`

```js
socket.emit("typing:start", "111222333");
```

### `typing:stop`

Signale que l'utilisateur a arrêté de taper.

**Payload:** `conversationId: string`

```js
socket.emit("typing:stop", "111222333");
```

---

## Événements serveur → client

### Messages

#### `message:create`

Un nouveau message a été envoyé. Diffusé à la room `conversation:<conversationId>`.

```json
{
  "id": "444555666",
  "content": "Salut !",
  "deleted": false,
  "conversationId": "111222333",
  "senderId": "123456789",
  "createdAt": "2026-03-20T10:00:00.000Z",
  "updatedAt": "2026-03-20T10:00:00.000Z",
  "sender": {
    "id": "123456789",
    "username": "alice",
    "avatarUrl": null
  },
  "attachments": [],
  "reactions": [],
  "replyTo": null
}
```

Avec une réponse :

```json
{
  "id": "555666777",
  "content": "Bien reçu !",
  "deleted": false,
  "replyTo": {
    "id": "444555666",
    "content": "Salut !",
    "senderId": "123456789",
    "sender": { "id": "123456789", "username": "alice", "avatarUrl": null },
    "deleted": false
  },
  "..."
}
```

#### `message:update`

Un message a été modifié. Diffusé à la room `conversation:<conversationId>`.

Même format que `message:create` avec le contenu mis à jour.

#### `message:delete`

Un message a été supprimé (soft-delete). Diffusé à la room `conversation:<conversationId>`.

```json
{
  "id": "444555666",
  "conversationId": "111222333"
}
```

Le client doit marquer le message comme supprimé localement (`deleted: true`, `content: null`).

### Typing

#### `typing:start`

Un autre utilisateur tape dans une conversation.

```json
{
  "userId": "987654321",
  "conversationId": "111222333"
}
```

#### `typing:stop`

Un autre utilisateur a arrêté de taper.

```json
{
  "userId": "987654321",
  "conversationId": "111222333"
}
```

### Reactions

#### `reaction:add`

Une réaction a été ajoutée à un message. Diffusé à la room `conversation:<conversationId>`.

```json
{
  "userId": "123456789",
  "messageId": "444555666",
  "emoji": "👍",
  "createdAt": "2026-03-20T10:00:00.000Z",
  "user": {
    "id": "123456789",
    "username": "alice",
    "avatarUrl": null
  }
}
```

#### `reaction:remove`

Une réaction a été retirée. Diffusé à la room `conversation:<conversationId>`.

```json
{
  "userId": "123456789",
  "messageId": "444555666",
  "emoji": "👍"
}
```

### Conversations

#### `conversation:create`

L'utilisateur a été ajouté à une nouvelle conversation. Envoyé à chaque membre via `user:<userId>`.

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

#### `conversation:members:add`

Des membres ont été ajoutés à un groupe. Diffusé à la room `conversation:<conversationId>`.

```json
{
  "conversationId": "111222333",
  "memberIds": ["555666777", "888999000"]
}
```

#### `conversation:members:remove`

Un membre a été retiré ou a quitté le groupe. Diffusé à la room `conversation:<conversationId>`.

```json
{
  "conversationId": "111222333",
  "userId": "987654321"
}
```

#### `conversation:owner:update`

Le propriétaire du groupe a changé (transfert manuel ou départ de l'ancien owner). Diffusé à la room `conversation:<conversationId>`.

```json
{
  "conversationId": "111222333",
  "ownerId": "987654321"
}
```

### Read States

#### `readstate:update`

Un utilisateur a marqué des messages comme lus. Diffusé à la room `conversation:<conversationId>`. Utile pour afficher les indicateurs "vu".

```json
{
  "userId": "123456789",
  "conversationId": "111222333",
  "lastMessageId": "444555666"
}
```

### User

#### `user:update`

Le profil de l'utilisateur a été mis à jour (username, avatar). Envoyé à `user:<userId>`.

```json
{
  "id": "123456789",
  "username": "alice_updated",
  "email": "alice@example.com",
  "avatarUrl": "https://cdn.sprava.top/avatars/uuid.png",
  "createdAt": "2026-03-20T10:00:00.000Z"
}
```

#### `user:online`

Un utilisateur s'est connecté. Diffusé à toutes les rooms de conversation de l'utilisateur.

```json
{
  "userId": "123456789"
}
```

#### `user:offline`

Un utilisateur s'est déconnecté. Diffusé à toutes les rooms de conversation de l'utilisateur.

```json
{
  "userId": "123456789"
}
```

### Friends

#### `friend:request`

L'utilisateur a reçu une demande d'ami. Envoyé à `user:<receiverId>`.

```json
{
  "id": "fr123",
  "senderId": "987654321",
  "receiverId": "123456789",
  "status": "PENDING",
  "createdAt": "2026-03-20T10:00:00.000Z",
  "sender": {
    "id": "987654321",
    "username": "bob",
    "avatarUrl": null
  },
  "receiver": {
    "id": "123456789",
    "username": "alice",
    "avatarUrl": null
  }
}
```

#### `friend:request:update`

Une demande d'ami a été acceptée. Envoyé aux deux utilisateurs (sender et receiver).

Même format que `friend:request` avec `status: "ACCEPTED"`.

#### `friend:remove`

Un ami a été supprimé. Envoyé à l'utilisateur supprimé.

```json
{
  "userId": "123456789"
}
```

---

## Exemple complet

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { token: accessToken }
});

socket.on("connect", () => {
  console.log("Connecté");
});

socket.on("connect_error", (err) => {
  console.error("Connexion refusée:", err.message);
});

socket.on("message:create", (message) => {
  if (message.replyTo) {
    console.log(`${message.sender.username} a répondu à ${message.replyTo.sender.username}`);
  }
  console.log(`${message.sender.username}: ${message.content}`);
});

socket.on("message:update", (message) => {
  console.log(`Message modifié: ${message.content}`);
});

socket.on("message:delete", ({ id, conversationId }) => {
  console.log(`Message ${id} supprimé dans ${conversationId}`);
});

socket.on("typing:start", ({ userId, conversationId }) => {
  console.log(`${userId} tape dans ${conversationId}...`);
});

socket.on("typing:stop", ({ userId, conversationId }) => {
  console.log(`${userId} a arrêté de taper`);
});

socket.on("reaction:add", ({ emoji, user, messageId }) => {
  console.log(`${user.username} a réagi ${emoji} au message ${messageId}`);
});

socket.on("reaction:remove", ({ emoji, userId, messageId }) => {
  console.log(`${userId} a retiré ${emoji} du message ${messageId}`);
});

socket.on("conversation:create", (conversation) => {
  console.log(`Nouvelle conversation: ${conversation.id}`);
});

socket.on("conversation:members:add", ({ conversationId, memberIds }) => {
  console.log(`${memberIds.length} membres ajoutés à ${conversationId}`);
});

socket.on("conversation:members:remove", ({ conversationId, userId }) => {
  console.log(`${userId} a quitté/été retiré de ${conversationId}`);
});

socket.on("conversation:owner:update", ({ conversationId, ownerId }) => {
  console.log(`Nouveau propriétaire de ${conversationId}: ${ownerId}`);
});

socket.on("readstate:update", ({ userId, conversationId, lastMessageId }) => {
  console.log(`${userId} a lu jusqu'à ${lastMessageId} dans ${conversationId}`);
});

socket.on("user:online", ({ userId }) => {
  console.log(`${userId} est en ligne`);
});

socket.on("user:offline", ({ userId }) => {
  console.log(`${userId} est hors ligne`);
});

socket.on("user:update", (user) => {
  console.log(`Profil mis à jour: ${user.username}`);
});

socket.on("friend:request", (request) => {
  console.log(`Demande d'ami de ${request.sender.username}`);
});

socket.on("friend:request:update", (request) => {
  if (request.status === "ACCEPTED") {
    console.log("Demande acceptée !");
  }
});

socket.on("friend:remove", ({ userId }) => {
  console.log(`${userId} vous a retiré de ses amis`);
});

socket.emit("typing:start", "111222333");
setTimeout(() => socket.emit("typing:stop", "111222333"), 3000);
```
