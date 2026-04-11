import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Knex } from 'knex';

export interface AiAuditRecord {
  audit_id?: number;
  timestamp?: Date;
  event_type: string;
  user_id?: string | null;
  user_role?: string;
  task_request_id?: number;
  task_name?: string;
  raw_input?: string;
  model_input?: string;
  model_output?: string;
  extracted_parameters?: any;
  action?: string;
  status?: string;
  result?: string;
  latency_ms?: number;
  metadata?: any;
  notes?: string;
}

@Injectable()
export class AuditTool {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  /**
   * Log any event to the ai_audit table
   */
  async logEvent(data: Partial<AiAuditRecord>): Promise<void> {
    try {
      await this.knex('ai_audit').insert({
        event_type: data.event_type,
        user_id: data.user_id,
        user_role: data.user_role,
        task_request_id: data.task_request_id,
        task_name: data.task_name,
        raw_input: data.raw_input,
        model_input: data.model_input,
        model_output: data.model_output,
        extracted_parameters: data.extracted_parameters,
        action: data.action,
        status: data.status || 'success',
        result: data.result,
        latency_ms: data.latency_ms,
        metadata: data.metadata || {},
        notes: data.notes,
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Fail silently — audit should not break main application flow
    }
  }

  /**
   * Log a full model interaction (prompt + response)
   */
  async logModelInteraction(
    user_id: string | undefined,
    task_name: string,
    model_input: string,
    model_output: string,
    latency_ms: number,
    status: string = 'success'
  ): Promise<void> {
    await this.logEvent({
      event_type: 'model_response',
      user_id,
      task_name,
      model_input,
      model_output,
      latency_ms,
      status,
    });
  }

  /**
   * Get recent audit logs for a user
   */
  async getRecentLogs(user_id: string, limit: number = 50): Promise<AiAuditRecord[]> {
    return this.knex<AiAuditRecord>('ai_audit')
      .where('user_id', user_id)
      .orderBy('timestamp', 'desc')
      .limit(limit);
  }
}