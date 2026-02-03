# Distributed Chat Application — Architecture Diagrams

## 1. High-level component view

```mermaid
flowchart TB
    subgraph clients [Clients]
        Peter[Peter]
        Stiliyan[Stiliyan]
    end

    subgraph entry [Single entry]
        Gateway[API Gateway]
    end

    subgraph auth [Auth]
        AuthService[Auth Service]
        UsersDB[(Users DB)]
    end

    subgraph ws_path [WebSocket path]
        LB[Load Balancer]
        CS1[Channel Service 1]
        CS2[Channel Service 2]
    end

    subgraph messaging [Messaging]
        MessagingService[Messaging Service]
        MessageQ[Message Queue]
        Worker[Messaging Processor Worker]
        MessagesDB[(Messages DB)]
    end

    subgraph presence [Presence]
        PresenceService[Presence Service]
        PresenceRedis[(Presence Redis)]
    end

    subgraph realtime [Real-time delivery]
        PubSub[(Redis Pub/Sub)]
    end

    subgraph notifications [Notifications]
        NotifQ[Notification Queue]
        NotifService[Notification Service]
        NotifDB[(Notification DB)]
    end

    Peter --> Gateway
    Stiliyan --> Gateway
    Gateway --> AuthService
    Gateway --> LB
    Gateway --> MessagingService
    AuthService --> UsersDB
    LB --> CS1
    LB --> CS2
    CS1 --> MessagingService
    CS2 --> MessagingService
    CS1 --> PresenceService
    CS2 --> PresenceService
    PresenceService --> PresenceRedis
    MessagingService --> MessageQ
    MessagingService --> PresenceService
    MessagingService --> PubSub
    MessagingService --> NotifQ
    MessageQ --> Worker
    Worker --> MessagesDB
    MessagingService --> MessagesDB
    PubSub --> CS1
    PubSub --> CS2
    NotifQ --> NotifService
    NotifService --> AuthService
    NotifService --> NotifDB
```

---

## 2. Authentication flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as API Gateway
    participant Auth as Auth Service
    participant UsersDB as Users DB

    Client->>Gateway: POST /auth/register or /auth/login
    Gateway->>Auth: route /auth/*
    Auth->>UsersDB: read/write user
    UsersDB-->>Auth: user data
    Auth-->>Gateway: JWT
    Gateway-->>Client: JWT
```

---

## 3. WebSocket connection and presence registration

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as API Gateway
    participant LB as Load Balancer
    participant Channel as Channel Service
    participant Presence as Presence Service
    participant Redis as Presence Redis

    Client->>Gateway: ws://gateway/ws?token=JWT
    Gateway->>LB: proxy WebSocket upgrade
    LB->>Channel: assign connection
    Channel->>Channel: validate JWT, extract userId
    Channel->>Presence: POST /presence/register (userId, channelServiceId)
    Presence->>Redis: set presence:userId, TTL 30s
    Presence-->>Channel: OK
    Channel-->>Client: WebSocket connected

    loop every 15s
        Channel->>Presence: POST /presence/heartbeat (userIds batched)
        Presence->>Redis: refresh TTL
    end

    Note over Client,Redis: On disconnect: Channel -> Presence POST /presence/unregister
```

---

## 4. Send message flow (one-to-one or group)

```mermaid
flowchart LR
    subgraph request [Request path]
        A[Client over WS] --> B[Channel Service]
        B --> C[Messaging Service]
    end

    subgraph parallel [Messaging Service does in parallel]
        C --> D[Message Queue]
        C --> E[Presence Service]
        D --> F[Messaging Processor Worker]
        F --> G[(Messages DB)]
        E --> H[(Presence Redis)]
    end

    subgraph decision [Then]
        E --> I{Recipient online?}
        I -->|Yes| J[Publish to Redis Pub/Sub]
        I -->|No| K[Push to Notification Queue]
        J --> L[Channel Services]
        L --> M[Client recipient over WS]
        K --> N[Notification Service]
        N --> O[Auth Service get email]
        O --> P[Send email + Notification DB]
    end
```

---

## 5. Send message — sequence (online vs offline)

```mermaid
sequenceDiagram
    participant Sender
    participant Channel as Channel Service
    participant Messaging as Messaging Service
    participant MessageQ as Message Queue
    participant Presence as Presence Service
    participant PubSub as Redis Pub/Sub
    participant NotifQ as Notification Queue
    participant Worker as Messaging Processor Worker
    participant MessagesDB as Messages DB
    participant NotifService as Notification Service
    participant Auth as Auth Service
    participant Recipient

    Sender->>Channel: send message (over WS)
    Channel->>Messaging: HTTP send message (channelId, issuer, recipientIds or groupId)

    par Persistence
        Messaging->>MessageQ: push message
        MessageQ->>Worker: consume
        Worker->>MessagesDB: write message
    and Presence check
        Messaging->>Presence: GET /presence/status/:userId (or batch)
        Presence-->>Messaging: online: [userId1], offline: [userId2]
    end

    alt Recipient(s) online
        Messaging->>PubSub: publish (recipientIds, message, issuer, sentAt, channelId)
        PubSub->>Channel: fanout
        Channel->>Recipient: deliver over WS
    else Recipient(s) offline
        Messaging->>NotifQ: push (recipientId, issuer, messagePreview)
        NotifQ->>NotifService: consume
        NotifService->>Auth: GET /users/:recipientId (email)
        Auth-->>NotifService: email
        NotifService->>NotifService: send email, write Notification DB
    end

    Messaging-->>Channel: 200 OK
    Channel-->>Sender: message sent
```

---

## 6. Group: resolve members and offline users

```mermaid
flowchart TB
    subgraph persistent [Persistent — who is in the group]
        UsersDB[(Users DB)]
        GroupsTable[groups table]
        GroupMembersTable[group_members table]
        UsersDB --> GroupsTable
        UsersDB --> GroupMembersTable
    end

    subgraph ephemeral [Ephemeral — who is online now]
        PresenceService[Presence Service]
        PresenceRedis[(Presence Redis)]
        PresenceService --> PresenceRedis
    end

    subgraph logic [Messaging Service logic for group message]
        QueryMembers[Query Users DB: all user_id for group_id]
        CheckPresence[Call Presence Service: which of these user_ids are online?]
        OnlineSet[Online user IDs]
        OfflineSet[Offline = all members minus online]
        QueryMembers --> CheckPresence
        CheckPresence --> OnlineSet
        CheckPresence --> OfflineSet
    end

    QueryMembers --> GroupMembersTable
    CheckPresence --> PresenceService
    OnlineSet --> PubSub[Publish to Pub/Sub for online]
    OfflineSet --> NotifQ[Push to Notification Queue per offline user]
```

---

## 7. Message history (read path)

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as API Gateway
    participant Messaging as Messaging Service
    participant MessagesDB as Messages DB

    Client->>Gateway: GET /messages/:channelId (JWT in header)
    Gateway->>Gateway: validate JWT
    Gateway->>Messaging: route GET /messages/:channelId
    Messaging->>MessagesDB: SELECT * WHERE channelId ORDER BY sentAt
    MessagesDB-->>Messaging: messages
    Messaging-->>Gateway: JSON response
    Gateway-->>Client: message history
```

---

## 8. Data stores summary

| Store              | Purpose                                          | Persistent?   | Who writes                 | Who reads                         |
| ------------------ | ------------------------------------------------ | ------------- | -------------------------- | --------------------------------- |
| Users DB           | Users, credentials, email, groups, group_members | Yes (volume)  | Auth Service               | Auth, Notification (via Auth)     |
| Messages DB        | All messages, channel history                    | Yes (volume)  | Messaging Processor Worker | Messaging Service (history)       |
| Notification DB    | Notification records, delivery status            | Yes (volume)  | Notification Service       | Notification Service              |
| Presence Redis     | Online status, channelServiceId per user         | No            | Presence Service           | Presence Service (Messaging asks) |
| Redis Pub/Sub      | Fan-out messages to Channel Services             | No            | Messaging Service          | Channel Services                  |
| Message Queue      | Async persistence buffer                         | No (or Redis) | Messaging Service          | Messaging Processor Worker        |
| Notification Queue | Async offline notifications                      | No (or Redis) | Messaging Service          | Notification Service              |

---

## 9. End-to-end picture (all flows in one)

```mermaid
flowchart TB
    Client[Client]
    Gateway[API Gateway]
    Auth[Auth Service]
    UsersDB[(Users DB)]
    LB[Load Balancer]
    CS[Channel Services]
    Messaging[Messaging Service]
    Presence[Presence Service]
    PresenceRedis[(Presence Redis)]
    MessageQ[Message Queue]
    Worker[Messaging Processor Worker]
    MessagesDB[(Messages DB)]
    PubSub[(Redis Pub/Sub)]
    NotifQ[Notification Queue]
    Notif[Notification Service]
    NotifDB[(Notification DB)]

    Client --> Gateway
    Gateway --> Auth
    Gateway --> LB
    Gateway --> Messaging
    Auth --> UsersDB
    LB --> CS
    CS --> Messaging
    CS --> Presence
    Presence --> PresenceRedis
    Messaging --> MessageQ
    Messaging --> Presence
    Messaging --> PubSub
    Messaging --> NotifQ
    Messaging --> MessagesDB
    MessageQ --> Worker
    Worker --> MessagesDB
    PubSub --> CS
    NotifQ --> Notif
    Notif --> Auth
    Notif --> NotifDB
    CS --> Client
```

---

_Diagrams reflect: auth flow, WebSocket + presence, send message (persistence + presence + online/offline), group membership from Users DB and offline = all members minus online, history read path, and data stores._
