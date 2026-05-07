export interface HassEvent {
  id: number;
  type: string;
  data: {
    entity_id: string;
    new_state: State;
    old_state: State;
  };
  event_type: string;
  time_fired: string;
  origin: string;
  context: {
    id: string;
    parent_id: string;
    user_id: string;
  };
}

interface State {
  entity_id: string;
  last_changed: string;
  state: string;
  attributes: Record<string, any>;
  last_updated: string;
  context: {
    id: string;
    parent_id: string;
    user_id: string;
  };
}
