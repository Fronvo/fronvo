// ******************** //
// Types for all kinds of files.
// ******************** //

export type Errors =
    | 'UNKNOWN'
    | 'LOGGED_IN'
    | 'LOGGED_OUT'
    | 'MISSING'
    | 'REQUIRED'
    | 'LENGTH'
    | 'LENGTH_EXACT'
    | 'NOT_BOOLEAN'
    | 'INVALID'
    | 'INVALID_REGEX'
    | 'EMAIL_TAKEN'
    | 'ID_TAKEN'
    | 'ACCOUNT_404'
    | 'ROOM_404'
    | 'POST_404'
    | 'ALREADY_IN_ROOM'
    | 'USER_IN_ROOM'
    | 'USER_NOT_IN_ROOM'
    | 'NOT_IN_ROOM'
    | 'ROOM_NOT_DM'
    | 'DM_EXISTS'
    | 'DM_HIDDEN'
    | 'DM_INACCESSIBLE'
    | 'NOT_OWNER'
    | 'NOT_YOURSELF'
    | 'NOT_FRIEND'
    | 'FRIEND_ALREADY_SENT'
    | 'FRIEND_ALREADY_PENDING'
    | 'FRIEND_NOT_PENDING'
    | 'FRIEND_ALREADY_ACCEPTED'
    | 'NOT_HIGHER'
    | 'TOO_MUCH'
    | 'OVER_LIMIT'
    | 'ALREADY_USED'
    | 'NOT_IN_BETA'
    | 'DISABLED_IN_BETA';

export type TestAssertTypes =
    | 'string'
    | 'boolean'
    | 'number'
    | 'function'
    | 'object';

export type EnvValues =
    | 'ADMIN_PANEL_USERNAME'
    | 'ADMIN_PANEL_PASSWORD'
    | 'PRISMA_URL'
    | 'BINARY_PARSER'
    | 'EMAIL_BLACKLISTING_ENABLED'
    | 'SILENT_LOGGING'
    | 'EMAIL_USERNAME'
    | 'EMAIL_PASSWORD'
    | 'SETUP_MODE'
    | 'IMAGEKIT_ENDPOINT'
    | 'IMAGEKIT_PUBLIC'
    | 'IMAGEKIT_PRIVATE'
    | 'TENOR_KEY';
