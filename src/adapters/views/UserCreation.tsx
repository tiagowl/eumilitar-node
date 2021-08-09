import * as React from 'react';
import ReactDOMServer from 'react-dom/server';
import User from '../../entities/User';

export type Props = {
    user: User;
    link: string;
    expirationTime: number;
};

function UserCreation({ user, link, expirationTime }: Props) {
    return (
        <>
            <head>
                <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Seja bem vindo!</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <table cellPadding="1" cellSpacing="1" width="100%">
                    <tr>
                        <td>
                            <h2>Olá, {user.fullName}!</h2>
                            <p>Aqui estão algumas orientações importantes, a repeito do procedimento para o <strong>envio da sua redação</strong>:</p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p>Assista ao vídeo <strong>"COMO ENVIAR SUA REDAÇÃO"</strong>, que está postado no módulo "REDAÇÃO";</p>
                            <p><strong>Cadastre sua senha</strong> na nossa plataforma de redações:
                                <ul>
                                    <p><strong><a href={link}>Clique aqui para cadastrar sua senha</a></strong></p>
                                    <p><strong>Nome de usuário:</strong>{user.email}</p>
                                    <p><strong><em>OBS.: Este link irá expirar em {expirationTime} horas. Após este prazo você terá que clicar em <u>"Redefinir senha"</u> na tela de login.</em></strong></p>
                                </ul>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p>Faça o upload do seu texto nos formatos .jpg, .jpeg, .gif, .png</p>
                            <p>Utilize de preferência a aplicativo CAMSCANNER no formato JPG;</p>
                            <p>Só é possível enviar fotos com tamanho máximo de 10 MB;</p>
                            <p>Você conseguirá enviar apenas 2 (dois) arquivos por mês. Não tente enviar o mesmo texto mais de uma vez;</p>
                            <p>Você receberá a correção no mesmo e-mail cadastrado na plataforma num prazo de <strong>ATÉ 2 SEMANAS após o envio</strong>;</p>
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
            ${ReactDOMServer.renderToString(<UserCreation {...props} />)}
        </html>
    `.replace(/\n|\t/g, '');
}