import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SocialProfile } from '../types/social-profile.type';

@Injectable()
export class FacebookAuthService {
    private readonly graphUrl = 'https://graph.facebook.com';

    async verifyAccessToken(accessToken: string): Promise<SocialProfile> {
        if (!accessToken) {
            throw new UnauthorizedException('Missing Facebook access token');
        }

        const debugRes = await fetch(
            `${this.graphUrl}/debug_token?input_token=${accessToken}&access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`,
        );

        const debug = await debugRes.json();

        if (!debug?.data?.is_valid) {
            throw new UnauthorizedException('Invalid Facebook access token');
        }

        if (debug.data.app_id !== process.env.FACEBOOK_APP_ID) {
            throw new UnauthorizedException('Facebook token does not belong to this app');
        }

        const profileRes = await fetch(
            `${this.graphUrl}/me?fields=id,name,email,picture&access_token=${accessToken}`,
        );

        if (!profileRes.ok) {
            throw new UnauthorizedException('Failed to fetch Facebook user profile');
        }

        const data = await profileRes.json();

        if (!data?.id) {
            throw new UnauthorizedException('Invalid Facebook token payload');
        }

        return {
            providerId: data.id,
            email: data.email ?? null,
            emailVerified: true,
            name: data.name,
            avatar: data.picture?.data?.url,
        };
    }
}
