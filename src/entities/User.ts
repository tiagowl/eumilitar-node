
export type AccountStatus = 'active' | 'inactive' | 'pending'

export interface UserInterface {
    readonly id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: AccountStatus;
    readonly creation_date: Date;
    readonly last_modified: Date;
}

export interface UserData extends UserInterface {
    password: string;
}

export interface UserUpdateData {
    first_name?: string;
    last_name?: string;
    email?: string;
    status?: AccountStatus;
}

export default class User implements UserInterface {
    #id: number;
    #first_name: string;
    #last_name: string;
    #email: string;
    #password: string;
    #status: AccountStatus;
    #creation_date: Date;
    #last_modified: Date;

    constructor(data: UserData) {
        this.#id = data.id;
        this.#first_name = data.first_name;
        this.#last_name = data.last_name;
        this.#email = data.email;
        this.#password = data.password;
        this.#status = data.status;
        this.#creation_date = data.creation_date;
        this.#last_modified = data.last_modified;
    }

    get id() { return this.#id }

    set fist_name(value: string) {
        this.#first_name = value;
        this.updateDate()
    }
    get first_name() { return this.#first_name }

    set last_name(value: string) {
        this.#last_name = value;
        this.updateDate()
    }
    get last_name() { return this.#last_name }

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

    get creation_date() { return this.#creation_date }

    get last_modified() { return this.#last_modified }

    public checkPassword(password: string) {
        return this.#password === password;
    }

    public update(data: UserUpdateData) {
        Object.assign(this, data);
        this.updateDate();
        return this;
    }

    private updateDate(){
        this.#last_modified = new Date();
    }

}
