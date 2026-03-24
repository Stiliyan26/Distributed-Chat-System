export enum AuthError {
    PASSWORDS_MISMATCH = "Passwords don't match.",
    USER_EXISTS = 'User with this email already exists',
    USER_NOT_FOUND = 'User not found.',
    INVALID_CREDENTIALS = 'Invalid credentials',
    INVALID_REFRESH_TOKEN = 'Invalid refresh token',
    REFRESH_TOKEN_IS_ABSENT = 'Refresh token is absent'
}

export enum UserTable {
    USERS = 'users',
}

export const ValidationMessages = {
  USERNAME_INVALID_CHARS: 'Username can only contain letters, numbers, and underscores',
  PASSWORD_TOO_SHORT: (min: number) => `Password is too short (min ${min} characters)`,
  PASSWORD_TOO_LONG: (max: number) => `Password is too long (max ${max} characters)`,
  PASSWORD_TOO_WEAK: 'Password is too weak. Must include uppercase, lowercase, and a number or symbol.',
} as const;
