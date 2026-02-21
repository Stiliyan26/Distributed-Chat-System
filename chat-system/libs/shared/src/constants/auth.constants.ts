export enum AuthCookie {
    ACCESS_TOKEN = 'access_token',
    REFRESH_TOKEN = 'refresh_token',
    SAME_SITE_STRICT = 'strict',
}

export enum CookiePath {
    REFRESH = '/api/auth/refresh',
}

export enum AuthTokenExpiry {
    ACCESS_TOKEN = '15m',
    REFRESH_TOKEN = '30d',
}
