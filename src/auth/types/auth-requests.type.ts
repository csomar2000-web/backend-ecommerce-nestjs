import { RequestContext } from './request-context.type';

export interface RegisterRequest extends RequestContext {
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber?: string;
    username?: string;
    displayName?: string;
}

export interface LoginRequest extends RequestContext {
    email: string;
    password: string;
}

export interface RefreshRequest extends RequestContext {
    refreshToken: string;
}

export interface PasswordResetRequest extends RequestContext {
    email: string;
}

export interface ConfirmPasswordResetRequest extends RequestContext {
    token: string;
    newPassword: string;
}

export interface ChangePasswordRequest extends RequestContext {
    userId: string;
    currentPassword: string;
    newPassword: string;
}
