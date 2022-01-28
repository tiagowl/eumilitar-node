import * as React from 'react';
import ReactDOMServer from 'react-dom/server';

export type Props = {
    link: string;
    username: string;
    expirationTime: number;
};

function PasswordRecoveryMail({ username, link, expirationTime }: Props) {
    return (
        <>
            <table style={{height: 600, width: 600, backgroundColor: 'white', display: "block"}}>
                <tbody>
                    <tr>
                        <td style={{width: 600, height: 67, backgroundColor: "#2E4E34", display: "block"}}>
                            <img style={{width: "80px", height: "97px", paddingLeft: "40px", paddingTop: "30px"}} src="https://eumilitar.vercel.app/eumilitar-logo.png" />
                        </td>
                    </tr>
                    <tr>
                        <td style={{fontFamily: 'Roboto', fontSize: 24, paddingLeft: "40px", paddingTop: "80px"}}>Olá, {username}!</td>
                    </tr>
                    <tr>
                        <td style={{fontFamily: 'Roboto', fontSize: 16, paddingLeft: "40px", paddingTop: "30px"}}>Aqui está o link para você cadastrar sua nova senha.<br />Clique no link abaixo para prosseguir</td>
                    </tr>
                    <tr>
                        <td style={{paddingTop: "20px"}} ><a href={link} style={{fontFamily: 'Roboto', color: '#498f56', paddingLeft: "40px"}}>Clique aqui para cadastrar a nova senha</a></td>
                    </tr>
                    <tr>
                        <td style={{fontFamily: 'Roboto', fontSize: 14, paddingLeft: "40px", paddingTop: '-280px'}}>{`Válido por ${expirationTime} hora${expirationTime >= 1 && "s"}`}</td>
                    </tr>
                    <tr>
                        <td style={{fontFamily: 'Roboto', fontSize: 16, paddingLeft: "40px", paddingTop: '50px'}}>Caso você não tenha feito esta solicitação, basta ignorar este e-mail</td>
                    </tr>
                    <tr>
                        <td style={{fontFamily: 'Roboto', fontSize: 14, paddingLeft: "40px", paddingTop: '60px'}}>Atensiosamente</td>
                    </tr>
                    <tr>
                        <td style={{fontFamily: 'Roboto', fontSize: 14, paddingLeft: "40px", paddingTop: '-95px'}}><strong>Equipe Eu Militar</strong></td>
                    </tr>
                </tbody>
            </table>

        </>
    );
}

export default async function render(props: Props) {
    return `
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
                <title>Recuperação de senha</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap');
                </style>
            </head>
        ${ReactDOMServer.renderToString(<PasswordRecoveryMail {...props} />)}
        </html>
    `.replace(/\n|\t/g, '');
}