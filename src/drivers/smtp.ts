import mailjet from 'node-mailjet';
import { Mail } from '../adapters/interfaces';

export default function createTransport(settings: any): Mail {
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
            return sender
                .post('send', { 'version': 'v3.1' })
                .request(data);
        }
    };
}