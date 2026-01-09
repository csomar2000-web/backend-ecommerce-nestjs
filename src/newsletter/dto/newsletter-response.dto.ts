export class NewsletterResponseDto {
  id: string;
  email: string;
  active: boolean;
  createdAt: Date;
  unsubscribedAt?: Date | null;
}
