export type Insertable<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type Updatable<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'readableId'>>;
