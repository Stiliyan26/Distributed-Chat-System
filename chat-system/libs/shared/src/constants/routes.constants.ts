export enum AuthRoutes {
    PREFIX = 'auth',
    REGISTER = 'register',
    LOGIN = 'login',
    REFRESH = 'refresh',
}

export enum UserRoutes {
    PREFIX = 'users',
}

export enum ChannelRoutes {
    PREFIX = 'channels',
    CREATE = 'create',
    MEMBERS = ':channelId/members',
    USER_CHANNELS = 'user',
}

export enum MessageRoutes {
    PREFIX = 'messages',
}
