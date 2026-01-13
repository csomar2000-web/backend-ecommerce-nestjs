import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import { MailProvider } from './mail.provider';

type SecurityAlertType =
    | 'NEW_DEVICE_LOGIN'
    | 'SESSION_REVOKED';

export class MailService {
    constructor(
        private readonly provider: MailProvider,
    ) { }

    async sendEmailVerification(
        email: string,
        link: string,
    ): Promise<void> {
        await this.send({
            to: email,
            subject: 'Verify your email',
            template: 'verify-email',
            context: { link },
            text: `Verify your email: ${link}`,
        });
    }

    async sendPasswordReset(
        email: string,
        link: string,
    ): Promise<void> {
        await this.send({
            to: email,
            subject: 'Reset your password',
            template: 'reset-password',
            context: { link },
            text: `Reset your password: ${link}`,
        });
    }

    async sendTestEmail(email: string): Promise<void> {
        const sentAt = new Date().toISOString();

        await this.send({
            to: email,
            subject: 'Test email delivery',
            template: 'test-email',
            context: { email, sentAt },
            text: `Test email sent to ${email} at ${sentAt}`,
        });
    }

    async sendSecurityAlert(
        email: string,
        params: {
            type: SecurityAlertType;
            ipAddress: string;
            userAgent: string;
        },
    ): Promise<void> {
        const templateMap: Record<SecurityAlertType, string> = {
            NEW_DEVICE_LOGIN: 'new-device-login',
            SESSION_REVOKED: 'session-revoked',
        };

        const subjectMap: Record<SecurityAlertType, string> = {
            NEW_DEVICE_LOGIN: 'New login detected',
            SESSION_REVOKED: 'Session revoked',
        };

        await this.send({
            to: email,
            subject: subjectMap[params.type],
            template: templateMap[params.type],
            context: {
                ipAddress: params.ipAddress,
                userAgent: params.userAgent,
            },
            text: `Security alert:
IP: ${params.ipAddress}
Device: ${params.userAgent}`,
        });
    }

    private async send(options: {
        to: string;
        subject: string;
        template: string;
        context: Record<string, unknown>;
        text?: string;
    }): Promise<void> {
        const html = this.renderTemplate(
            options.template,
            options.context,
        );

        await this.provider.send({
            to: options.to,
            subject: options.subject,
            html,
            text: options.text,
        });
    }

    private renderTemplate(
        template: string,
        context: Record<string, unknown>,
    ): string {
        const candidates = [
            path.join(process.cwd(), 'dist', 'mail', 'templates', `${template}.hbs`),
            path.join(__dirname, 'templates', `${template}.hbs`),
        ];

        const filePath = candidates.find((p) => fs.existsSync(p));
        if (!filePath) {
            throw new Error(`Mail template not found: ${template}`);
        }

        const source = fs.readFileSync(filePath, 'utf8');
        return Handlebars.compile(source, { strict: true })(context);
    }
}
