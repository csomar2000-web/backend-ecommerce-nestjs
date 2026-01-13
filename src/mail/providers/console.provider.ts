// console.provider.ts
import { MailProvider } from '../mail.provider';

export class ConsoleMailProvider implements MailProvider {
  async send({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    process.stdout.write(
      JSON.stringify(
        {
          to,
          subject,
          html,
          text,
        },
        null,
        2,
      ) + '\n',
    );
  }
}
