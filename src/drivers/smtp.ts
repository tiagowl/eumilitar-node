import mailjet from 'node-mailjet';
import { Logger } from 'winston';
import { Mail } from '../adapters/interfaces';
import { SMTPSettings } from './interfaces';

export default function createTransport(settings: SMTPSettings, logger: Logger): Mail {
    const sender = mailjet.connect(settings.auth.key, settings.auth.secret);
    return {
        async sendMail(mail) {
            const { html, text, subject, to, from } = mail;
            const data = {
                "Messages": [{
                    "From": {
                        "Email": from.email,
                        "Name": from.name,
                    },
                    "To": [{
                        "Email": to.email,
                        "Name": to.name,
                    }],
                    "Subject": subject,
                    "TextPart": text,
                    "HTMLPart": html,
                    "CustomID": "AppGettingStartedTest"
                }]
            };
            logger.info(JSON.stringify({ to, subject }));
            return sender
                .post('send', { 'version': 'v3.1' })
                .request(data)
                .catch((error) => {
                    logger.error(error);
                    logger.info(JSON.stringify({ to, subject, error }));
                    throw { message: 'Erro ao enviar email', status: 500 };
                });
        }
    };
}