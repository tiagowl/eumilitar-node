# "Eu Militar" API

## API Reference

### Authentication
Create authorization token.  

    POST /tokens/ 
#### Receive:
Type: `application/json`;  
```
{
    "email": string,
    "password": string 
}
```

#### Response:  
Type: `application/json`;  
- Status: 201
    ```
    {
        "token": string
    }
    ```
- Status: 400
    ```
    {
        "errors": [<Field:string>, <Message:string>][]
    }
    ```

### Password Recovery  
Send a password recovery email to user.  

    POST /password-recoveries/

#### Receive:
Type: `application/json`;  
```
{
    "email": string
}
```  

#### Response:
Type: `application/json`;  
- Status: 201
    ```
    {
        "message": string
    }
    ```
- Status: 400
    ```
    {
        "message": string
    }
    ```

### Check Password Recovery Token
Verify if the password recovery token is valid.  

    GET /password-recoveries/<Token:string>/

#### Response:
Type: `application/json`;  
Status: 200;  
```
{
    isValid: boolean
}
```  

