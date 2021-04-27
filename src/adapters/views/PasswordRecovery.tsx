import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

export type Props = {
    link: string;
    username: string;
}

function PasswordRecoveryMail({ username, link }: Props) {
    return (
        <body style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            <table cellPadding="1" cellSpacing="1" width="100%">
                <tr>
                    <td>
                        <h2>Olá, {username}!</h2>
                        <p>Aqui está o link para você cadastrar sua nova senha. Clique no link abaixo para prosseguir.</p>
                    </td>
                </tr>
                <tr>
                    <td>
                        <h3>
                            <a href={link}> Clique aqui para cadastrar sua nova senha</a>
                        </h3>
                        <p>Caso você não tenha feito esta solicitação, basta ignorar este e-mail.</p>
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
    )
}

export default function render(props: Props) {
    const component = ReactDOMServer.renderToString(<PasswordRecoveryMail {...props} />);
    return `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Recuperação de senha</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            </head>
            ${component}
        </html>
    `
}