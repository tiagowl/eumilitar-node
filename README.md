# "Eu Militar" API

## API Reference

### Authentication
    POST /tokens/ 
#### Receive:
Type: `application/json`  

    {
        "email": string,
        "password": string 
    }

#### Response:  
Type: `application/json`  

    {
        "token": string
    }
