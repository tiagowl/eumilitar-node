import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

export type Props = {
    username: string;
};

function PasswordRecoveryMail({ username }: Props) {
    return (
        <>
            <head>
                <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Recuperação de senha</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <table cellPadding="1" cellSpacing="1" width="100%">
                    <tr>
                        <td>
                            <h2>Olá, {username}!</h2>
                            <p>A correção da sua redação já está disponível dentro da plataforma.</p>
                            <p>Vá na página inicial da plataforma e clique em Ver redações</p>
                            <p>Em caso de dúvida, entre em contato com nossa equipe de suporte.</p>
                        </td>
                    </tr>
                    <tr>
                        <td>Atenciosamente,</td>
                    </tr>
                    <tr>
                        <td>Equipe de Suporte Eu Militar</td>
                    </tr>
                </table>
            </body>
        </>
    );
}

export default async function render(props: Props) {
    return `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
        ${ReactDOMServer.renderToString(<PasswordRecoveryMail {...props} />)}
        </html>
    `.replace(/\n|\t/g, '');
}