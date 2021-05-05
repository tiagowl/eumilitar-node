import nodemailer from 'nodemailer';

export default function createTransport(settings: any) {
    return nodemailer.createTransport(settings)
}