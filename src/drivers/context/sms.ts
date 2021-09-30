import winston from "winston";
import { SMS } from "../../adapters/interfaces";

export default function createSMS(settings: any, logger: winston.Logger): SMS {
    return {
        async send(to, message) {
            return;
        }
    };
}