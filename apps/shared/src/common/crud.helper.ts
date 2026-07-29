export type Insertable<T> = Omit<T, "id" | "active" | "createdAt" | "updatedAt" | "readableId">;

export type Updatable<T> = Partial<
  Omit<T, "id" | "createdAt" | "updatedAt" | "readableId">
>;
