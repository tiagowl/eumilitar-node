
export type AccountStatus = 'active' | 'inactive' | 'pending'

export interface UserInterface {
    readonly id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: AccountStatus;
    readonly creationDate: Date;
    readonly lastModified: Date;
}

export interface UserData extends UserInterface {
    password: string;
}

export interface UserUpdateData {
    firstName?: string;
    lastName?: string;
    email?: string;
    status?: AccountStatus;
}

export default class User implements UserInterface {
    #id: number;
    #firstName: string;
    #lastName: string;
    #email: string;
    #password: string;
    #status: AccountStatus;
    #creationDate: Date;
    #lastModified: Date;

    constructor(data: UserData) {
        this.#id = data.id;
        this.#firstName = data.firstName;
        this.#lastName = data.lastName;
        this.#email = data.email;
        this.#password = data.password;
        this.#status = data.status;
        this.#creationDate = data.creationDate;
        this.#lastModified = data.lastModified;
    }

    get id() { return this.#id }

    set fist_name(value: string) {
        this.#firstName = value;
        this.updateDate()
    }
    get firstName() { return this.#firstName }

    set lastName(value: string) {
        this.#lastName = value;
        this.updateDate()
    }
    get lastName() { return this.#lastName }

    set email(value: string) {
        this.#email = value;
        this.updateDate();
    }
    get email() { return this.#email }

    set password(value: string) { this.#password = value }

    set status(value: AccountStatus) {
        this.#status = value;
        this.updateDate();
    }
    get status() { return this.#status }

    get creationDate() { return this.#creationDate }

    get lastModified() { return this.#lastModified }

    public async checkPassword(password: string, checker: (password: string, hash: string) => Promise<boolean>) {
        return await checker(password, this.#password);
    }

    public async update(data: UserUpdateData) {
        if(data) {
            this.#email = data.email || this.#email;
            this.#firstName = data.firstName || this.#firstName;
            this.#lastName = data.lastName || this.#lastName;
            this.#status = data.status || this.#status;
            this.updateDate();
        }
        return this;
    }

    private async updateDate(){
        this.#lastModified = new Date();
    }

}
