# Sprava API - Exemples de reponses

Reference complete de tous les objets retournes par l'API. Utile pour typer les reponses cote client.

---

## Objets de base

### PublicUser

Profil public d'un utilisateur, utilise dans les membres, senders, reactions, etc.

```json
{
  "id": "927318475628371",
  "username": "alice",
  "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
}
```

`avatarUrl` peut etre `null`.

### SelfUser

Profil complet de l'utilisateur connecte. Retourne par `/users/me`, `/auth/register`, `/auth/login`.

```json
{
  "id": "927318475628371",
  "username": "alice",
  "email": "alice@example.com",
  "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png",
  "createdAt": "2026-03-20T10:00:00.000Z"
}
```

### Attachment (fichier)

```json
{
  "id": "927318475628999",
  "type": "FILE",
  "url": "https://cdn.sprava.top/attachments/e5f6g7h8.png",
  "filename": "screenshot.png",
  "mimeType": "image/png",
  "size": 245000,
  "duration": null,
  "waveform": null,
  "messageId": "927318475628555",
  "createdAt": "2026-03-20T10:05:00.000Z"
}
```

### Attachment (message vocal)

```json
{
  "id": "927318475629000",
  "type": "VOICE",
  "url": "https://cdn.sprava.top/voice/i9j0k1l2.ogg",
  "filename": "voice.ogg",
  "mimeType": "audio/ogg",
  "size": 48000,
  "duration": 4.2,
  "waveform": "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHw==",
  "messageId": "927318475628556",
  "createdAt": "2026-03-20T10:06:00.000Z"
}
```

### Attachment (orphelin, pas encore lie a un message)

```json
{
  "id": "927318475629001",
  "type": "FILE",
  "url": "https://cdn.sprava.top/attachments/m3n4o5p6.pdf",
  "filename": "rapport.pdf",
  "mimeType": "application/pdf",
  "size": 1024000,
  "duration": null,
  "waveform": null,
  "messageId": null,
  "createdAt": "2026-03-20T10:07:00.000Z"
}
```

---

## Auth

### POST /auth/register — 201

```json
{
  "user": {
    "id": "927318475628371",
    "username": "alice",
    "email": "alice@example.com",
    "avatarUrl": null,
    "createdAt": "2026-03-20T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MjczMTg0NzU2MjgzNzEiLCJpYXQiOjE3NDI0NjU2MDAsImV4cCI6MTc0MjQ2NjUwMH0.abc123",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MjczMTg0NzU2MjgzNzEiLCJpYXQiOjE3NDI0NjU2MDAsImV4cCI6MTc0MzA3MDQwMH0.def456"
}
```

### POST /auth/login — 200

Meme format que register.

### POST /auth/refresh — 200

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/logout — 204

Pas de body.

---

## Users

### GET /users/me — 200

```json
{
  "id": "927318475628371",
  "username": "alice",
  "email": "alice@example.com",
  "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png",
  "createdAt": "2026-03-20T10:00:00.000Z"
}
```

### PATCH /users/me — 200

```json
{
  "id": "927318475628371",
  "username": "alice_new",
  "email": "alice@example.com",
  "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png",
  "createdAt": "2026-03-20T10:00:00.000Z"
}
```

### GET /users/search?q=bob — 200

```json
[
  {
    "id": "927318475628372",
    "username": "bob",
    "avatarUrl": null
  },
  {
    "id": "927318475628373",
    "username": "bobby",
    "avatarUrl": "https://cdn.sprava.top/avatars/q1r2s3t4.png"
  }
]
```

### GET /users/:id — 200

```json
{
  "id": "927318475628372",
  "username": "bob",
  "email": "bob@example.com",
  "avatarUrl": null,
  "createdAt": "2026-03-20T09:00:00.000Z"
}
```

---

## Conversations

### POST /conversations (DM) — 201

```json
{
  "id": "927318475628400",
  "name": null,
  "iconUrl": null,
  "isGroup": false,
  "ownerId": null,
  "createdAt": "2026-03-20T10:10:00.000Z",
  "updatedAt": "2026-03-20T10:10:00.000Z",
  "members": [
    {
      "userId": "927318475628371",
      "joinedAt": "2026-03-20T10:10:00.000Z",
      "user": {
        "id": "927318475628371",
        "username": "alice",
        "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
      }
    },
    {
      "userId": "927318475628372",
      "joinedAt": "2026-03-20T10:10:00.000Z",
      "user": {
        "id": "927318475628372",
        "username": "bob",
        "avatarUrl": null
      }
    }
  ]
}
```

### POST /conversations (groupe) — 201

```json
{
  "id": "927318475628401",
  "name": "Projet Sprava",
  "iconUrl": null,
  "isGroup": true,
  "ownerId": "927318475628371",
  "createdAt": "2026-03-20T10:15:00.000Z",
  "updatedAt": "2026-03-20T10:15:00.000Z",
  "members": [
    {
      "userId": "927318475628371",
      "joinedAt": "2026-03-20T10:15:00.000Z",
      "user": {
        "id": "927318475628371",
        "username": "alice",
        "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
      }
    },
    {
      "userId": "927318475628372",
      "joinedAt": "2026-03-20T10:15:00.000Z",
      "user": { "id": "927318475628372", "username": "bob", "avatarUrl": null }
    },
    {
      "userId": "927318475628373",
      "joinedAt": "2026-03-20T10:15:00.000Z",
      "user": {
        "id": "927318475628373",
        "username": "charlie",
        "avatarUrl": null
      }
    }
  ]
}
```

### GET /conversations — 200

```json
[
  {
    "id": "927318475628400",
    "name": null,
    "iconUrl": null,
    "isGroup": false,
    "ownerId": null,
    "createdAt": "2026-03-20T10:10:00.000Z",
    "updatedAt": "2026-03-20T11:00:00.000Z",
    "members": [
      {
        "userId": "927318475628371",
        "joinedAt": "2026-03-20T10:10:00.000Z",
        "user": {
          "id": "927318475628371",
          "username": "alice",
          "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
        }
      },
      {
        "userId": "927318475628372",
        "joinedAt": "2026-03-20T10:10:00.000Z",
        "user": {
          "id": "927318475628372",
          "username": "bob",
          "avatarUrl": null
        }
      }
    ],
    "lastMessage": {
      "id": "927318475628555",
      "content": "Ca marche !",
      "deleted": false,
      "conversationId": "927318475628400",
      "senderId": "927318475628372",
      "createdAt": "2026-03-20T11:00:00.000Z",
      "updatedAt": "2026-03-20T11:00:00.000Z",
      "sender": {
        "id": "927318475628372",
        "username": "bob",
        "avatarUrl": null
      },
      "attachments": [],
      "reactions": [],
      "replyTo": null
    }
  },
  {
    "id": "927318475628401",
    "name": "Projet Sprava",
    "iconUrl": "https://cdn.sprava.top/icons/u5v6w7x8.png",
    "isGroup": true,
    "ownerId": "927318475628371",
    "createdAt": "2026-03-20T10:15:00.000Z",
    "updatedAt": "2026-03-20T10:15:00.000Z",
    "members": [],
    "lastMessage": null
  }
]
```

### GET /conversations/unread/counts — 200

```json
[
  { "conversationId": "927318475628400", "unreadCount": 3 },
  { "conversationId": "927318475628401", "unreadCount": 12 }
]
```

Retourne un tableau vide `[]` si aucun message non lu.

### PUT /conversations/:id/read — 200

```json
{
  "userId": "927318475628371",
  "conversationId": "927318475628400",
  "lastMessageId": "927318475628555"
}
```

### GET /conversations/:id/readstates — 200

```json
[
  { "userId": "927318475628371", "lastMessageId": "927318475628555" },
  { "userId": "927318475628372", "lastMessageId": "927318475628550" }
]
```

---

## Messages

### POST /messages (texte simple) — 201

```json
{
  "id": "927318475628555",
  "content": "Salut, comment ca va ?",
  "deleted": false,
  "conversationId": "927318475628400",
  "senderId": "927318475628371",
  "createdAt": "2026-03-20T10:30:00.000Z",
  "updatedAt": "2026-03-20T10:30:00.000Z",
  "sender": {
    "id": "927318475628371",
    "username": "alice",
    "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
  },
  "attachments": [],
  "reactions": [],
  "replyTo": null
}
```

### POST /messages (avec image) — 201

```json
{
  "id": "927318475628556",
  "content": "Regarde cette photo",
  "deleted": false,
  "conversationId": "927318475628400",
  "senderId": "927318475628371",
  "createdAt": "2026-03-20T10:31:00.000Z",
  "updatedAt": "2026-03-20T10:31:00.000Z",
  "sender": {
    "id": "927318475628371",
    "username": "alice",
    "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
  },
  "attachments": [
    {
      "id": "927318475628999",
      "type": "FILE",
      "url": "https://cdn.sprava.top/attachments/e5f6g7h8.png",
      "filename": "vacances.png",
      "mimeType": "image/png",
      "size": 245000,
      "duration": null,
      "waveform": null,
      "messageId": "927318475628556",
      "createdAt": "2026-03-20T10:30:50.000Z"
    }
  ],
  "reactions": [],
  "replyTo": null
}
```

### POST /messages (message vocal) — 201

```json
{
  "id": "927318475628557",
  "content": "",
  "deleted": false,
  "conversationId": "927318475628400",
  "senderId": "927318475628371",
  "createdAt": "2026-03-20T10:32:00.000Z",
  "updatedAt": "2026-03-20T10:32:00.000Z",
  "sender": {
    "id": "927318475628371",
    "username": "alice",
    "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
  },
  "attachments": [
    {
      "id": "927318475629000",
      "type": "VOICE",
      "url": "https://cdn.sprava.top/voice/i9j0k1l2.ogg",
      "filename": "voice.ogg",
      "mimeType": "audio/ogg",
      "size": 48000,
      "duration": 4.2,
      "waveform": "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHw==",
      "messageId": "927318475628557",
      "createdAt": "2026-03-20T10:31:55.000Z"
    }
  ],
  "reactions": [],
  "replyTo": null
}
```

### POST /messages (reponse) — 201

```json
{
  "id": "927318475628558",
  "content": "Bien recu !",
  "deleted": false,
  "conversationId": "927318475628400",
  "senderId": "927318475628372",
  "createdAt": "2026-03-20T10:33:00.000Z",
  "updatedAt": "2026-03-20T10:33:00.000Z",
  "sender": {
    "id": "927318475628372",
    "username": "bob",
    "avatarUrl": null
  },
  "attachments": [],
  "reactions": [],
  "replyTo": {
    "id": "927318475628556",
    "content": "Regarde cette photo",
    "senderId": "927318475628371",
    "sender": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    },
    "deleted": false
  }
}
```

### POST /messages (reponse a un message supprime) — 201

```json
{
  "id": "927318475628559",
  "content": "Ah dommage c'est supprime",
  "deleted": false,
  "conversationId": "927318475628400",
  "senderId": "927318475628372",
  "createdAt": "2026-03-20T10:34:00.000Z",
  "updatedAt": "2026-03-20T10:34:00.000Z",
  "sender": {
    "id": "927318475628372",
    "username": "bob",
    "avatarUrl": null
  },
  "attachments": [],
  "reactions": [],
  "replyTo": {
    "id": "927318475628555",
    "content": null,
    "senderId": "927318475628371",
    "sender": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    },
    "deleted": true
  }
}
```

### GET /messages/:conversationId (avec messages mixtes) — 200

```json
[
  {
    "id": "927318475628558",
    "content": "Bien recu !",
    "deleted": false,
    "conversationId": "927318475628400",
    "senderId": "927318475628372",
    "createdAt": "2026-03-20T10:33:00.000Z",
    "updatedAt": "2026-03-20T10:33:00.000Z",
    "sender": { "id": "927318475628372", "username": "bob", "avatarUrl": null },
    "attachments": [],
    "reactions": [
      {
        "emoji": "👍",
        "count": 1,
        "users": [
          {
            "id": "927318475628371",
            "username": "alice",
            "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
          }
        ]
      }
    ],
    "replyTo": {
      "id": "927318475628556",
      "content": "Regarde cette photo",
      "senderId": "927318475628371",
      "sender": {
        "id": "927318475628371",
        "username": "alice",
        "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
      },
      "deleted": false
    }
  },
  {
    "id": "927318475628557",
    "content": "",
    "deleted": false,
    "conversationId": "927318475628400",
    "senderId": "927318475628371",
    "createdAt": "2026-03-20T10:32:00.000Z",
    "updatedAt": "2026-03-20T10:32:00.000Z",
    "sender": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    },
    "attachments": [
      {
        "id": "927318475629000",
        "type": "VOICE",
        "url": "https://cdn.sprava.top/voice/i9j0k1l2.ogg",
        "filename": "voice.ogg",
        "mimeType": "audio/ogg",
        "size": 48000,
        "duration": 4.2,
        "waveform": "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHw==",
        "messageId": "927318475628557",
        "createdAt": "2026-03-20T10:31:55.000Z"
      }
    ],
    "reactions": [],
    "replyTo": null
  },
  {
    "id": "927318475628556",
    "content": "Regarde cette photo",
    "deleted": false,
    "conversationId": "927318475628400",
    "senderId": "927318475628371",
    "createdAt": "2026-03-20T10:31:00.000Z",
    "updatedAt": "2026-03-20T10:31:00.000Z",
    "sender": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    },
    "attachments": [
      {
        "id": "927318475628999",
        "type": "FILE",
        "url": "https://cdn.sprava.top/attachments/e5f6g7h8.png",
        "filename": "vacances.png",
        "mimeType": "image/png",
        "size": 245000,
        "duration": null,
        "waveform": null,
        "messageId": "927318475628556",
        "createdAt": "2026-03-20T10:30:50.000Z"
      }
    ],
    "reactions": [],
    "replyTo": null
  },
  {
    "id": "927318475628550",
    "content": null,
    "deleted": true,
    "conversationId": "927318475628400",
    "senderId": "927318475628371",
    "createdAt": "2026-03-20T10:29:00.000Z",
    "updatedAt": "2026-03-20T10:35:00.000Z",
    "sender": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    },
    "attachments": [],
    "reactions": [],
    "replyTo": null
  },
  {
    "id": "927318475628549",
    "content": "Salut, comment ca va ?",
    "deleted": false,
    "conversationId": "927318475628400",
    "senderId": "927318475628371",
    "createdAt": "2026-03-20T10:28:00.000Z",
    "updatedAt": "2026-03-20T10:28:00.000Z",
    "sender": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    },
    "attachments": [],
    "reactions": [
      {
        "emoji": "❤️",
        "count": 2,
        "users": [
          { "id": "927318475628372", "username": "bob", "avatarUrl": null },
          { "id": "927318475628373", "username": "charlie", "avatarUrl": null }
        ]
      },
      {
        "emoji": "😂",
        "count": 1,
        "users": [
          { "id": "927318475628372", "username": "bob", "avatarUrl": null }
        ]
      }
    ],
    "replyTo": null
  }
]
```

### Message supprime (dans un fil) — 200

```json
{
  "id": "927318475628550",
  "content": null,
  "deleted": true,
  "conversationId": "927318475628400",
  "senderId": "927318475628371",
  "createdAt": "2026-03-20T10:29:00.000Z",
  "updatedAt": "2026-03-20T10:35:00.000Z",
  "sender": {
    "id": "927318475628371",
    "username": "alice",
    "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
  },
  "attachments": [],
  "reactions": [],
  "replyTo": null
}
```

---

## Reactions

### PUT /messages/:messageId/reactions/:emoji — 201

```json
{
  "userId": "927318475628371",
  "messageId": "927318475628555",
  "emoji": "👍",
  "createdAt": "2026-03-20T10:40:00.000Z",
  "user": {
    "id": "927318475628371",
    "username": "alice",
    "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
  }
}
```

### GET /messages/:messageId/reactions — 200

```json
[
  {
    "userId": "927318475628371",
    "messageId": "927318475628555",
    "emoji": "👍",
    "createdAt": "2026-03-20T10:40:00.000Z",
    "user": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    }
  },
  {
    "userId": "927318475628372",
    "messageId": "927318475628555",
    "emoji": "👍",
    "createdAt": "2026-03-20T10:41:00.000Z",
    "user": { "id": "927318475628372", "username": "bob", "avatarUrl": null }
  },
  {
    "userId": "927318475628371",
    "messageId": "927318475628555",
    "emoji": "❤️",
    "createdAt": "2026-03-20T10:42:00.000Z",
    "user": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    }
  }
]
```

---

## Upload

### PUT /upload/avatar — 200

```json
{
  "id": "927318475628371",
  "username": "alice",
  "email": "alice@example.com",
  "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png",
  "createdAt": "2026-03-20T10:00:00.000Z"
}
```

### PUT /upload/conversations/:id/icon — 200

```json
{
  "id": "927318475628401",
  "name": "Projet Sprava",
  "iconUrl": "https://cdn.sprava.top/icons/u5v6w7x8.png",
  "isGroup": true,
  "ownerId": "927318475628371",
  "createdAt": "2026-03-20T10:15:00.000Z",
  "updatedAt": "2026-03-20T10:45:00.000Z",
  "members": [
    {
      "userId": "927318475628371",
      "joinedAt": "2026-03-20T10:15:00.000Z",
      "user": {
        "id": "927318475628371",
        "username": "alice",
        "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
      }
    }
  ]
}
```

### POST /upload/attachments (fichier) — 201

```json
{
  "id": "927318475628999",
  "type": "FILE",
  "url": "https://cdn.sprava.top/attachments/e5f6g7h8.png",
  "filename": "screenshot.png",
  "mimeType": "image/png",
  "size": 245000,
  "duration": null,
  "waveform": null,
  "messageId": null,
  "createdAt": "2026-03-20T10:30:50.000Z"
}
```

### POST /upload/attachments (vocal) — 201

```json
{
  "id": "927318475629000",
  "type": "VOICE",
  "url": "https://cdn.sprava.top/voice/i9j0k1l2.ogg",
  "filename": "voice.ogg",
  "mimeType": "audio/ogg",
  "size": 48000,
  "duration": 4.2,
  "waveform": "AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHw==",
  "messageId": null,
  "createdAt": "2026-03-20T10:31:55.000Z"
}
```

---

## Friends

### GET /friends — 200

```json
[
  {
    "id": "927318475628372",
    "username": "bob",
    "avatarUrl": null,
    "since": "2026-03-20T10:20:00.000Z"
  },
  {
    "id": "927318475628373",
    "username": "charlie",
    "avatarUrl": "https://cdn.sprava.top/avatars/y9z0a1b2.png",
    "since": "2026-03-19T15:00:00.000Z"
  }
]
```

### GET /friends/requests/pending — 200

```json
[
  {
    "id": "927318475628800",
    "senderId": "927318475628374",
    "receiverId": "927318475628371",
    "status": "PENDING",
    "createdAt": "2026-03-20T10:50:00.000Z",
    "sender": {
      "id": "927318475628374",
      "username": "dave",
      "avatarUrl": null
    },
    "receiver": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    }
  }
]
```

### GET /friends/requests/sent — 200

```json
[
  {
    "id": "927318475628801",
    "senderId": "927318475628371",
    "receiverId": "927318475628375",
    "status": "PENDING",
    "createdAt": "2026-03-20T10:55:00.000Z",
    "sender": {
      "id": "927318475628371",
      "username": "alice",
      "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
    },
    "receiver": {
      "id": "927318475628375",
      "username": "eve",
      "avatarUrl": null
    }
  }
]
```

### POST /friends/requests/:userId — 201

```json
{
  "id": "927318475628802",
  "senderId": "927318475628371",
  "receiverId": "927318475628376",
  "status": "PENDING",
  "createdAt": "2026-03-20T11:00:00.000Z",
  "sender": {
    "id": "927318475628371",
    "username": "alice",
    "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
  },
  "receiver": {
    "id": "927318475628376",
    "username": "frank",
    "avatarUrl": null
  }
}
```

### POST /friends/requests/:requestId/accept — 200

```json
{
  "id": "927318475628800",
  "senderId": "927318475628374",
  "receiverId": "927318475628371",
  "status": "ACCEPTED",
  "createdAt": "2026-03-20T10:50:00.000Z",
  "sender": {
    "id": "927318475628374",
    "username": "dave",
    "avatarUrl": null
  },
  "receiver": {
    "id": "927318475628371",
    "username": "alice",
    "avatarUrl": "https://cdn.sprava.top/avatars/a1b2c3d4.png"
  }
}
```

### GET /friends/blocked — 200

```json
[
  {
    "id": "927318475628377",
    "username": "troll42",
    "avatarUrl": null,
    "blockedAt": "2026-03-19T12:00:00.000Z"
  }
]
```

---

## Erreurs

### 400 — Validation

```json
{
  "error": "Invalid input: expected string, received undefined at \"username\""
}
```

### 401 — Non authentifié

```json
{
  "error": "Missing token"
}
```

```json
{
  "error": "Invalid or expired token"
}
```

```json
{
  "error": "Invalid credentials"
}
```

### 403 — Acces refuse

```json
{
  "error": "You are not a member of this conversation"
}
```

```json
{
  "error": "Only the group owner can perform this action"
}
```

```json
{
  "error": "You can only act on your own messages"
}
```

### 404 — Introuvable

```json
{
  "error": "User not found"
}
```

```json
{
  "error": "Conversation not found"
}
```

```json
{
  "error": "Message not found"
}
```

### 409 — Conflit

```json
{
  "error": "Email or username already taken"
}
```

```json
{
  "error": "Already friends"
}
```

### 429 — Rate limit

```json
{
  "error": "Too many requests, please try again later"
}
```

### 500 — Erreur serveur

```json
{
  "error": "Internal server error"
}
```
