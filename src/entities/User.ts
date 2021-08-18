
export type AccountStatus = 'active' | 'inactive' | 'pending';
export type AccountPermission = 'admin' | 'corrector' | 'student';

export const accountStatus: AccountStatus[] = ['active', 'inactive', 'pending'];
export const accountPermissions: AccountPermission[] = ['admin', 'corrector', 'student'];

export interface UserInterface {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: AccountStatus;
    permission: AccountPermission;
    creationDate: Date;
    lastModified: Date;
}

export interface UserData extends UserInterface {
    password: string;
}

export interface UserUpdateData {
    firstName?: string;
    lastName?: string;
    email?: string;
    status?: AccountStatus;
    permission?: AccountPermission;
    password?: string;
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
    #permission: AccountPermission;

    constructor(data: UserData) {
        this.#id = data.id;
        this.#firstName = data.firstName;
        this.#lastName = data.lastName;
        this.#email = data.email;
        this.#password = data.password;
        this.#status = data.status;
        this.#creationDate = data.creationDate;
        this.#lastModified = data.lastModified;
        this.#permission = data.permission;
    }

    get data() {
        return {
            id: this.#id,
            firstName: this.#firstName,
            lastName: this.#lastName,
            email: this.#email,
            password: this.#password,
            status: this.#status,
            creationDate: this.#creationDate,
            lastModified: this.#lastModified,
            permission: this.#permission,
        };
    }

    get id() { return this.#id; }

    set fist_name(value: string) {
        this.#firstName = value;
        this.updateDate();
    }
    get firstName() { return this.#firstName; }

    set lastName(value: string) {
        this.#lastName = value;
        this.updateDate();
    }
    get lastName() { return this.#lastName; }

    get fullName() { return [this.#firstName, this.#lastName].join(' '); }

    set email(value: string) {
        this.#email = value;
        this.updateDate();
    }
    get email() { return this.#email; }

    set password(value: string) {
        this.#password = value;
        this.updateDate();
    }

    set status(value: AccountStatus) {
        this.#status = value;
        this.updateDate();
    }
    get status() { return this.#status; }

    get creationDate() { return this.#creationDate; }

    get lastModified() { return this.#lastModified; }

    set permission(value: AccountPermission) {
        this.#permission = value;
        this.updateDate();
    }
    get permission() { return this.#permission; }

    public async checkPassword(password: string, checker: (password: string, hash: string) => Promise<boolean>) {
        return await checker(password, this.#password.replace(/^\$2y(.+)$/i, '$2a$1'));
    }

    public async update(data: UserUpdateData) {
        if (data) {
            this.#email = data.email || this.#email;
            this.#firstName = data.firstName || this.#firstName;
            this.#lastName = data.lastName || this.#lastName;
            this.#status = data.status || this.#status;
            this.#permission = data.permission || this.#permission;
            this.#password = data.password || this.#password;
            this.updateDate();
        }
        return this;
    }

    private async updateDate() {
        this.#lastModified = new Date();
    }

}
