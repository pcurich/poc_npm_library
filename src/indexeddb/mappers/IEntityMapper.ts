export interface IEntityMapper<T, U> {
    toEntity(dto: U): T;
    toDto(entity: T): U;
}