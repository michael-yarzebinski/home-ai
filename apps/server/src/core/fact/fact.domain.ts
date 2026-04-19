export interface Fact {
  id: string;
  key: string;
  value: string;
  ownerUserId?: string | null;
  visibleToRoles: string[];
  createdAt: Date;
  updatedAt: Date;
}