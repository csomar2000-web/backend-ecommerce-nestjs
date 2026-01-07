import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { SocialProfile } from '../types/social-profile.type';

@Injectable()
export class GoogleAuthService {
    private readonly client: OAuth2Client;

    constructor() {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            throw new Error('GOOGLE_CLIENT_ID is not set');
        }
        this.client = new OAuth2Client(clientId);
    }

    async verifyIdToken(idToken: string): Promise<SocialProfile> {
        let payload: TokenPayload | undefined;

        try {
            const ticket = await this.client.verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch {
            throw new UnauthorizedException('Invalid Google ID token');
        }

        if (!payload?.sub) {
            throw new UnauthorizedException('Invalid Google token payload');
        }

        const validIssuers = [
            'accounts.google.com',
            'https://accounts.google.com',
        ];

        if (!validIssuers.includes(payload.iss ?? '')) {
            throw new UnauthorizedException('Invalid Google token issuer');
        }

        return {
            providerId: payload.sub,
            email: payload.email ?? null,
            emailVerified: payload.email_verified === true,
            name: payload.name,
            avatar: payload.picture,
        };
    }
}

