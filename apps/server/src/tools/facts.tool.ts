import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class FactsTool {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  /**
   * Store a new fact / preference
   */
  async storeFact(
    parameters: any,
    user: any | null
  ): Promise<{
    success: boolean;
    message: string;
    reply: string;
  }> {
    const key = parameters.key || parameters.fact || parameters.name;
    const value = parameters.value || parameters.details || parameters.text;

    if (!key || !value) {
      return {
        success: false,
        message: 'Missing key or value for fact',
        reply: 'Please tell me both what to remember and the details (e.g. "Remember Mike\'s Chipotle order is a burrito with guacamole").',
      };
    }

    try {
      await this.knex('facts')
        .insert({
          key: key.toLowerCase().trim(),
          value: value.trim(),
          owner_user_id: user?.user_id || null,
          visibility_roles: 'parent,child', // default visibility
        })
        .onConflict('key')
        .merge(); // update if key already exists

      return {
        success: true,
        message: `Stored fact: ${key}`,
        reply: `Got it! I'll remember "${key}" as "${value}".`,
      };
    } catch (error) {
      console.error('Store fact error:', error);
      return {
        success: false,
        message: 'Failed to store fact',
        reply: 'Sorry, I couldn’t save that information right now.',
      };
    }
  }

  /**
   * Retrieve a stored fact by key
   */
  async retrieveFact(
    parameters: any,
    user: any | null
  ): Promise<{
    success: boolean;
    message: string;
    reply: string;
    data?: any;
  }> {
    const key = parameters.key || parameters.fact || parameters.name;

    if (!key) {
      return {
        success: false,
        message: 'No key provided',
        reply: 'What would you like me to recall?',
      };
    }

    try {
      const fact = await this.knex('facts')
        .where('key', key.toLowerCase().trim())
        .first();

      if (!fact) {
        return {
          success: false,
          message: 'Fact not found',
          reply: `I don't have any information stored for "${key}".`,
        };
      }

      return {
        success: true,
        message: `Retrieved fact: ${key}`,
        reply: `${key}: ${fact.value}`,
        data: fact,
      };
    } catch (error) {
      console.error('Retrieve fact error:', error);
      return {
        success: false,
        message: 'Failed to retrieve fact',
        reply: 'Sorry, I couldn’t look that up right now.',
      };
    }
  }
}