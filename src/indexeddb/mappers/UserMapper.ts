import { UserDto } from '../dtos/UserDTO';
import { UserEntity } from '../entities/UserEntity';
import { IEntityMapper } from './IEntityMapper';

export class UserMapper implements IEntityMapper<UserEntity, UserDto> {
    toDto(entity: UserEntity): UserDto {
        return {
            id: entity.id,
            name: entity.name,
            email: entity.email,
        };
    }
    toEntity(dto: UserDto): UserEntity {
        const entity = new UserEntity(dto.id, dto.name, dto.email);
        return entity;
    }
}