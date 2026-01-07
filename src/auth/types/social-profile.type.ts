export interface SocialProfile {
  providerId: string;
  email: string | null;
  emailVerified: boolean;
  name?: string;
  avatar?: string;
}
