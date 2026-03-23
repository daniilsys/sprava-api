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
  "error": "Error message"
}
```

| Status | Description |
|--------|-------------|
| 400 | Validation / bad request |
| 401 | Missing or invalid token |
| 403 | Access denied / blocked |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limit exceeded |
| 500 | Internal error |

---

## Auth

### `POST /auth/register`

Creates a user account.

**Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `username` | string | yes | 3-32 characters |
| `email` | string | yes | Valid email |
| `password` | string | yes | 8-128 characters |

**Response:** `201`

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

| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |
| `password` | string | yes |

**Response:** `200` — Same format as register.

### `POST /auth/refresh`

**Body:**

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | yes |

**Response:** `200`

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### `POST /auth/logout`

**Body:**

| Field | Type | Required |
|-------|------|----------|
| `refreshToken` | string | yes |

**Response:** `204` No Content

---

## Users

All routes require authentication.

### `GET /users/me`

Returns the profile of the logged-in user.

**Response:** `200`

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

Updates the profile.

**Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `username` | string | no | 3-32 characters |

**Response:** `200` — Updated user object.

### `GET /users/search?q={query}`

Searches for users by name. Excludes blocked users (in both directions) and the current user.

| Param | Type | Required |
|-------|------|----------|
| `q` | string | yes |

**Response:** `200`

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

Returns the public profile of a user.

**Response:** `200` — Same format as `/users/me`.

---

## Conversations

All routes require authentication.

### `POST /conversations`

Creates a conversation. If 2 members → DM, if 3+ → group (max 50 members).

The creator of a group automatically becomes the owner (`ownerId`).

DMs cannot be created with a blocked user. Groups do not have this restriction.

**Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | no | 1-100 characters |
| `memberIds` | string[] | yes | 1-49 IDs (+ creator = 50 max) |

**Response:** `201`

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

`ownerId` is `null` for DMs.

### `GET /conversations`

Lists the user's conversations, sorted by `updatedAt` desc. Includes the last message.

**Response:** `200`

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

`lastMessage` is `null` if the conversation has no messages.

### `GET /conversations/unread/counts`

Returns the number of unread messages per conversation. Only conversations with unread messages are included.

**Response:** `200`

```json
[
  { "conversationId": "111222333", "unreadCount": 5 },
  { "conversationId": "444555666", "unreadCount": 12 }
]
```

### `GET /conversations/:id`

Returns a conversation. The user must be a member.

**Response:** `200` — Same format as creation (without `lastMessage`).

### `POST /conversations/:id/members`

Adds members to a group. Any group member can add. The total cannot exceed 50 members.

**Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `memberIds` | string[] | yes | 1-49 IDs |

**Response:** `200` — Updated conversation.

### `DELETE /conversations/:id/members/:userId`

Removes a member from the group. **Owner only.**

**Response:** `204` No Content

### `PUT /conversations/:id/owner`

Transfers group ownership to another member. **Owner only.**

**Body:**

| Field | Type | Required |
|-------|------|----------|
| `userId` | string | yes |

**Response:** `204` No Content

### `POST /conversations/:id/leave`

Leaves a group. If the owner leaves, the oldest member becomes the owner. If it was the last member, the group is deleted.

Not available for DMs.

**Response:** `204` No Content

### `PUT /conversations/:id/read`

Marks messages as read up to the specified message. The `messageId` must belong to the conversation. Cannot regress (if a more recent message is already marked as read, the call is ignored).

**Body:**

| Field | Type | Required |
|-------|------|----------|
| `messageId` | string | yes |

**Response:** `200`

```json
{
  "userId": "123456789",
  "conversationId": "111222333",
  "lastMessageId": "444555666"
}
```

### `GET /conversations/:id/readstates`

Returns the read states of all members of a conversation. The user must be a member.

**Response:** `200`

```json
[
  { "userId": "123456789", "lastMessageId": "444555666" },
  { "userId": "987654321", "lastMessageId": "333444555" }
]
```

---

## Messages

All routes require authentication.

### `POST /messages`

Sends a message. The user must be a member of the conversation. In a DM, sending is blocked if either user has blocked the other. No restriction in groups.

**Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `content` | string | yes | 1-4000 characters |
| `conversationId` | string | yes | |
| `replyToId` | string | no | ID of a message in the same conversation |
| `attachmentIds` | string[] | no | Max 10 IDs |

The `attachmentIds` reference files uploaded via `POST /upload/attachments` that have not yet been linked to a message. They must belong to the current user. Orphan attachments (not linked after 1 hour) are automatically deleted.

**Response:** `201`

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
      "type": "FILE",
      "url": "https://cdn.sprava.top/attachments/uuid.png",
      "filename": "photo.png",
      "mimeType": "image/png",
      "size": 102400,
      "duration": null,
      "waveform": null,
      "messageId": "444555666",
      "createdAt": "2026-03-20T10:00:00.000Z"
    }
  ],
  "reactions": [],
  "replyTo": null
}
```

#### Message with reply

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

If the parent message has been deleted:

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

Retrieves messages from a conversation (cursor-based pagination, descending order). Deleted messages are included with `deleted: true` and `content: null`.

| Param | Type | Required | Constraints |
|-------|------|----------|-------------|
| `cursor` | string | no | ID of the last received message |
| `limit` | number | no | 1-100, default 50 |

**Response:** `200` — Array of messages.

#### Deleted message

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

Edits the content of a message. Only the author can edit their message. Deleted messages cannot be edited.

**Body:**

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `content` | string | yes | 1-4000 characters |

**Response:** `200` — Updated message.

### `DELETE /messages/:id`

Deletes a message (soft-delete). Only the author can delete their message. The message remains visible in the thread with `deleted: true` and `content: null`.

**Response:** `204` No Content

### `PUT /messages/:messageId/reactions/:emoji`

Adds an emoji reaction to a message. The user must be a member of the conversation. Idempotent (no error if the reaction already exists). A user can add multiple different emojis to the same message.

The emoji must be a valid Unicode character (e.g., `👍`, `❤️`, `😂`).

**Response:** `201`

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

Removes your own reaction from a message.

**Response:** `204` No Content

### `GET /messages/:messageId/reactions`

Lists all reactions on a message.

**Response:** `200` — Array of reactions (same format as above).

#### Reactions in a message

Reactions are grouped by emoji in message responses:

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

All routes require authentication. Files are sent as `multipart/form-data` with the `file` field.

### `PUT /upload/avatar`

Uploads the user's avatar. Replaces the previous one if it exists.

| Constraint | Value |
|------------|-------|
| Max size | 5 MB |
| Types | image/jpeg, image/png, image/gif, image/webp |

**Response:** `200` — Updated user object (with new `avatarUrl`).

### `PUT /upload/conversations/:id/icon`

Uploads the icon of a conversation. The user must be a member.

| Constraint | Value |
|------------|-------|
| Max size | 5 MB |
| Types | image/jpeg, image/png, image/gif, image/webp |

**Response:** `200` — Updated conversation object (with new `iconUrl`).

### `POST /upload/attachments`

Uploads a file or a voice message to be linked later to a message via `attachmentIds`. Unlinked files after 1 hour are automatically deleted (R2 file + DB row).

| Constraint | Value |
|------------|-------|
| Max size | 25 MB |
| Types | image/jpeg, image/png, image/gif, image/webp, application/pdf, text/plain, audio/mpeg, audio/ogg, video/mp4, video/webm |

**Body (multipart/form-data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | file | yes | The file |
| `type` | string | no | `FILE` (default) or `VOICE` |
| `duration` | number | VOICE only | Duration in seconds |
| `waveform` | string | no | Base64-encoded amplitudes |

For `type: VOICE`:
- `duration` is required
- The file must be of type `audio/*`
- The file is stored in the `voice/` folder on R2

**File response:** `201`

```json
{
  "id": "777888999",
  "type": "FILE",
  "url": "https://cdn.sprava.top/attachments/uuid.png",
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "size": 204800,
  "duration": null,
  "waveform": null,
  "messageId": null,
  "createdAt": "2026-03-20T10:00:00.000Z"
}
```

**Voice message response:** `201`

```json
{
  "id": "888999000",
  "type": "VOICE",
  "url": "https://cdn.sprava.top/voice/uuid.ogg",
  "filename": "voice.ogg",
  "mimeType": "audio/ogg",
  "size": 48000,
  "duration": 4.2,
  "waveform": "AQIDBAUGBwgJCgsMDQ4P...",
  "messageId": null,
  "createdAt": "2026-03-20T10:00:00.000Z"
}
```

---

## Friends

All routes require authentication.

### `GET /friends`

Lists all accepted friends.

**Response:** `200`

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

Removes a friend. Both sides lose the relationship.

**Response:** `204` No Content

### `GET /friends/requests/pending`

Received pending friend requests.

**Response:** `200`

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

Sent pending friend requests. Same format as above.

### `POST /friends/requests/:userId`

Sends a friend request.

Special behaviors:
- If the other user has already sent a request → auto-accept
- If a block exists in either direction → `403`
- If already friends → `409`
- If request already sent → `409`

**Response:** `201` — FriendRequest object.

### `POST /friends/requests/:requestId/accept`

Accepts a request. Only the recipient can accept.

**Response:** `200` — FriendRequest with `status: "ACCEPTED"`.

### `POST /friends/requests/:requestId/decline`

Declines a request. Only the recipient can decline. The request is deleted from the DB.

**Response:** `204` No Content

### `DELETE /friends/requests/:requestId`

Cancels a sent request. Only the sender can cancel.

**Response:** `204` No Content

### `GET /friends/blocked`

Lists users blocked by the current user.

**Response:** `200`

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

Blocks a user. Automatically removes any existing friendship or pending request.

Effects of blocking:
- Cannot create a DM with the blocked user
- Cannot send a message in an existing DM
- The blocked user no longer appears in search
- No effect on group conversations

**Response:** `204` No Content

### `DELETE /friends/block/:userId`

Unblocks a user. Only the blocker can unblock.

**Response:** `204` No Content
