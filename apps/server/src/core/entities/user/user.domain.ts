export interface User {
  id: string;
  name: string;
  role: string;
  messagingId: string;
  accessCodeHash: string;
  quietStart?: string | null;   // HH:mm
  quietEnd?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}