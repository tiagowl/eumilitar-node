# "Eu Militar" API

## API Reference

### Authentication
    POST /tokens/ 
#### Receive:
    {
        "email": string,
        "password": string 
    }
#### Response:
    {
        "token": string
    }

