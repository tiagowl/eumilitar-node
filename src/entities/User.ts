import { compare } from 'bcrypt';

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
    phone?: string;
    permissions: Set<Permissions>;
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
    phone?: string;
    permissions?: Set<Permissions>;
}

export enum Permissions {
    SEE_USERS,
    UPDATE_STUDENTS,
    CREATE_STUDENTS,
    CREATE_USERS,
    CREATE_SINGLE_ESSAY,
    UPDATE_USER_PASSWORD,
    SEE_DASHBOARD,
    MANAGE_THEMES,
    MANAGE_PRODUCTS,
    SEE_ESSAYS,
    CORRECT_ESSAYS,
    UPDATE_SETTINGS,
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
    #phone?: string;
    #permissions: Set<Permissions>;

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
        this.#phone = data.phone;
        this.#permissions = data.permissions || new Set();
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
            phone: this.#phone,
            permissions: this.#permissions,
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

    set phone(value: string | undefined) {
        this.#phone = value;
        this.updateDate();
    }
    get phone() { return this.#phone; }

    set permissions(value: Set<Permissions>) {
        this.#permissions = value;
        this.updateDate();
    }
    get permissions() { return this.#permissions; }

    public async checkPassword(password: string) {
        return compare(password, this.#password.replace(/^\$2y(.+)$/i, '$2a$1'));
    }

    public async update(data: UserUpdateData) {
        if (data) {
            this.#email = data.email || this.#email;
            this.#firstName = data.firstName || this.#firstName;
            this.#lastName = data.lastName || this.#lastName;
            this.#status = data.status || this.#status;
            this.#permission = data.permission || this.#permission;
            this.#password = data.password || this.#password;
            this.#phone = data.phone || this.#phone;
            this.updateDate();
        }
        return this;
    }

    private updateDate() {
        this.#lastModified = new Date();
    }

}