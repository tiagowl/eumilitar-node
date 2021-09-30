import winston from "winston";
import { SMS } from "../../adapters/interfaces";
import axios from 'axios';

export default function createSMS(settings: any, logger: winston.Logger): SMS {
    return {
        async send(to, message) {
            try {
                await axios({
                    method: 'POST',
                    url: 'https://sms.comtele.com.br/api/v2/send',
                    headers: {
                        'content-type': 'application/json',
                        'auth-key': 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX'
                    },
                    data: { "Sender": "sender_id", "Receivers": to, "Content": message }
                });
                logger.info(`Sent SMS to +${to}`);
            } catch (error: any) {
                logger.error(error);
                throw { message: 'Erro ao enviar SMS', status: 500 };
            }
        }
    };
}