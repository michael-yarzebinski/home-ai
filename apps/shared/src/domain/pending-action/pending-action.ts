import { Insertable, Updatable } from "../helper/crud.helper";

export interface PendingAction {
  id: string;
  readableId: number;
  toolId: string;
  requesterId: string;
  proposedArgs: any;
  status: "pending" | "approved" | "rejected";
  reason?: string;
  executedBy?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type InsertablePendingAction = Insertable<PendingAction>;
export type UpdatablePendingAction = Updatable<PendingAction>;
