# "Eu Militar" API

## API Reference

### Authentication
Create authorization token  

    POST /tokens/ 
#### Receive:
Type: `application/json`  
```
{
    "email": string,
    "password": string 
}
```

#### Response:  
- Type: `application/json`  
- Status: 201
    ```
    {
        "token": string
    }
    ```
- Status: 400
    ```
    {
        "errors": [<Field: string>, <Message: string>][]
    }
    ```