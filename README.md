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

- Status: 201:
  ```
  {
      "token": string
  }
  ```
- Status: 400:
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

- Status: 201:
  ```
  {
      "message": string
  }
  ```
- Status: 400:
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

- Status: 200:
  ```
  {
      isValid: boolean
  }
  ```
- Status: 500:
  ```
  {
      isValid: boolean
  }
  ```

### Update user password

Recovery the user password

    PUT /users/profile/password/

#### Response

Type: `application/json`;

- Status: 200:

  ```
  {
      "updated": boolean
  }
  ```

- Status: 400:

    ```
    {
        "updated": boolean
    }
    ```
### User profile
Get user information. Require authentication with Bearer token;

    GET /users/profile/

#### Response
Type: `application/json`

- Status: 200:
    ```
    {
        "id": integer,
        "email": string,
        "firstName": string,
        "lastName": string,
        "status": string,
        "permission": "admin" | "esa" | "espcex",
        "creationDate": DateTime ISO 8601 UTC,
        "lastModified": DateTime ISO 8601 UTC
    }   
    ```
- Status 401:
    ```
    {
        "message": string,
        "status": integer
    }
    ```

### Create Essay Themes
Create a new essay theme. Require user authentication and admin permission.

    POST /themes/

#### Receive
Type: `multipart/form-data`  

    ```
    "data": {
        "title": string,
        "startDate": DateTime ISO 8601 UTC,
        "endDate": DateTime ISO 8601 UTC,
        "helpText": string,
        "courses": string[],
    }: application/json

    "themeFile": application/pdf
    ```
#### Response
- Status: 201:
    ```
    {
        "id": integer,
        "title": string,
        "startDate": DateTime ISO 8601 UTC,
        "endDate": DateTime ISO 8601 UTC,
        "helpText": string,
        "courses": string[],
        "lastModified": DateTime ISO 8601 UTC,
        "file": string
    }
    ```
- Status: 401:  
    ```
    {
        "message": string
    }
    ```
- Status: 400:
    ```
    {
        "errors": [<Field:string>, <Message:string>][]
    }
    ```