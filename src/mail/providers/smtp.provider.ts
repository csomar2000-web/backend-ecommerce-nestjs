import nodemailer from 'nodemailer';
import { MailProvider } from '../mail.provider';

export class SmtpMailProvider implements MailProvider {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  constructor() {
    this.transporter.verify().catch((err) => {
      console.error('SMTP connection failed:', err);
    });
  }

  async send({ to, subject, html, text }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
      text,
    });
  }
}
