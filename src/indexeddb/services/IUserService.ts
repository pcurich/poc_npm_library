import { UserEntity } from "../entities/UserEntity";

export interface IUserService {
    createUser(user: UserEntity): Promise<UserEntity>;
    getUserById(id: string): Promise<UserEntity | null>;
    updateUser(user: UserEntity): Promise<UserEntity>;
    deleteUser(id: string): Promise<boolean>;
    getAllUsers(): Promise<UserEntity[]>;
}