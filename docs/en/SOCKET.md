# Sprava Socket.IO

## Connection

The Socket.IO server is attached to the same HTTP server as the REST API.

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "<accessToken>"
  }
});
```

The token is verified upon connection. If the token is invalid or missing, the connection is refused with a `Missing token` or `Invalid token` error.

## Rooms

Each connected user automatically joins:

| Room | Format | Description |
|------|--------|-------------|
| Personal | `user:<userId>` | Events intended for the user |
| Conversations | `conversation:<conversationId>` | One room per conversation the user is a member of |

When a new conversation is created or a member is added, the relevant sockets are automatically added to the room.

---

## Client → Server Events

### `typing:start`

Signals that the user has started typing in a conversation.

**Payload:** `conversationId: string`

```js
socket.emit("typing:start", "111222333");
```

### `typing:stop`

Signals that the user has stopped typing.

**Payload:** `conversationId: string`

```js
socket.emit("typing:stop", "111222333");
```

---

## Server → Client Events

### Messages

#### `message:create`

A new message has been sent. Broadcast to the `conversation:<conversationId>` room.

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

With a reply:

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

A message has been edited. Broadcast to the `conversation:<conversationId>` room.

Same format as `message:create` with the updated content.

#### `message:delete`

A message has been deleted (soft-delete). Broadcast to the `conversation:<conversationId>` room.

```json
{
  "id": "444555666",
  "conversationId": "111222333"
}
```

The client should mark the message as deleted locally (`deleted: true`, `content: null`).

### Typing

#### `typing:start`

Another user is typing in a conversation.

```json
{
  "userId": "987654321",
  "conversationId": "111222333"
}
```

#### `typing:stop`

Another user has stopped typing.

```json
{
  "userId": "987654321",
  "conversationId": "111222333"
}
```

### Reactions

#### `reaction:add`

A reaction has been added to a message. Broadcast to the `conversation:<conversationId>` room.

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

A reaction has been removed. Broadcast to the `conversation:<conversationId>` room.

```json
{
  "userId": "123456789",
  "messageId": "444555666",
  "emoji": "👍"
}
```

### Conversations

#### `conversation:create`

The user has been added to a new conversation. Sent to each member via `user:<userId>`.

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

Members have been added to a group. Broadcast to the `conversation:<conversationId>` room.

```json
{
  "conversationId": "111222333",
  "memberIds": ["555666777", "888999000"]
}
```

#### `conversation:members:remove`

A member has been removed or has left the group. Broadcast to the `conversation:<conversationId>` room.

```json
{
  "conversationId": "111222333",
  "userId": "987654321"
}
```

#### `conversation:owner:update`

The group owner has changed (manual transfer or previous owner leaving). Broadcast to the `conversation:<conversationId>` room.

```json
{
  "conversationId": "111222333",
  "ownerId": "987654321"
}
```

### Read States

#### `readstate:update`

A user has marked messages as read. Broadcast to the `conversation:<conversationId>` room. Useful for displaying "seen" indicators.

```json
{
  "userId": "123456789",
  "conversationId": "111222333",
  "lastMessageId": "444555666"
}
```

### User

#### `user:update`

The user's profile has been updated (username, avatar). Sent to `user:<userId>`.

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

A user has connected. Broadcast to all of the user's conversation rooms.

```json
{
  "userId": "123456789"
}
```

#### `user:offline`

A user has disconnected. Broadcast to all of the user's conversation rooms.

```json
{
  "userId": "123456789"
}
```

### Friends

#### `friend:request`

The user has received a friend request. Sent to `user:<receiverId>`.

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

A friend request has been accepted. Sent to both users (sender and receiver).

Same format as `friend:request` with `status: "ACCEPTED"`.

#### `friend:remove`

A friend has been removed. Sent to the removed user.

```json
{
  "userId": "123456789"
}
```

---

## Full Example

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { token: accessToken }
});

socket.on("connect", () => {
  console.log("Connected");
});

socket.on("connect_error", (err) => {
  console.error("Connection refused:", err.message);
});

socket.on("message:create", (message) => {
  if (message.replyTo) {
    console.log(`${message.sender.username} replied to ${message.replyTo.sender.username}`);
  }
  console.log(`${message.sender.username}: ${message.content}`);
});

socket.on("message:update", (message) => {
  console.log(`Message edited: ${message.content}`);
});

socket.on("message:delete", ({ id, conversationId }) => {
  console.log(`Message ${id} deleted in ${conversationId}`);
});

socket.on("typing:start", ({ userId, conversationId }) => {
  console.log(`${userId} is typing in ${conversationId}...`);
});

socket.on("typing:stop", ({ userId, conversationId }) => {
  console.log(`${userId} stopped typing`);
});

socket.on("reaction:add", ({ emoji, user, messageId }) => {
  console.log(`${user.username} reacted ${emoji} to message ${messageId}`);
});

socket.on("reaction:remove", ({ emoji, userId, messageId }) => {
  console.log(`${userId} removed ${emoji} from message ${messageId}`);
});

socket.on("conversation:create", (conversation) => {
  console.log(`New conversation: ${conversation.id}`);
});

socket.on("conversation:members:add", ({ conversationId, memberIds }) => {
  console.log(`${memberIds.length} members added to ${conversationId}`);
});

socket.on("conversation:members:remove", ({ conversationId, userId }) => {
  console.log(`${userId} left/was removed from ${conversationId}`);
});

socket.on("conversation:owner:update", ({ conversationId, ownerId }) => {
  console.log(`New owner of ${conversationId}: ${ownerId}`);
});

socket.on("readstate:update", ({ userId, conversationId, lastMessageId }) => {
  console.log(`${userId} read up to ${lastMessageId} in ${conversationId}`);
});

socket.on("user:online", ({ userId }) => {
  console.log(`${userId} is online`);
});

socket.on("user:offline", ({ userId }) => {
  console.log(`${userId} is offline`);
});

socket.on("user:update", (user) => {
  console.log(`Profile updated: ${user.username}`);
});

socket.on("friend:request", (request) => {
  console.log(`Friend request from ${request.sender.username}`);
});

socket.on("friend:request:update", (request) => {
  if (request.status === "ACCEPTED") {
    console.log("Request accepted!");
  }
});

socket.on("friend:remove", ({ userId }) => {
  console.log(`${userId} removed you from their friends`);
});

socket.emit("typing:start", "111222333");
setTimeout(() => socket.emit("typing:stop", "111222333"), 3000);
```
