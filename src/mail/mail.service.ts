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

    async sendSecurityAlert(
        email: string,
        params: {
            type: SecurityAlertType;
            ipAddress: string;
            userAgent: string;
        },
    ): Promise<void> {
        const template =
            params.type === 'NEW_DEVICE_LOGIN'
                ? 'new-device-login'
                : 'session-revoked';

        const subject =
            params.type === 'NEW_DEVICE_LOGIN'
                ? 'New login detected'
                : 'Session revoked';

        await this.send({
            to: email,
            subject,
            template,
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
        context: Record<string, any>;
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
        context: Record<string, any>,
    ): string {
        const templatesDir = path.join(
            process.cwd(),
            'dist',
            'mail',
            'templates',
        );

        const fallbackDir = path.join(
            __dirname,
            'templates',
        );

        const filePath = fs.existsSync(
            path.join(templatesDir, `${template}.hbs`),
        )
            ? path.join(templatesDir, `${template}.hbs`)
            : path.join(fallbackDir, `${template}.hbs`);

        const source = fs.readFileSync(filePath, 'utf8');
        return Handlebars.compile(source)(context);
    }
}
