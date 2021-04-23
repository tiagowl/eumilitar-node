import nodemailer from 'nodemailer';
import settings from '../settings';

const transporter = nodemailer.createTransport(settings.smtp);

export default transporter;