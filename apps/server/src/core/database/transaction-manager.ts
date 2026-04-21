// src/core/database/transaction-manager.ts
import { Injectable, Scope } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { KNEX_CONNECTION } from './knex.constants';
import { Knex } from 'knex';

@Injectable()
export class TransactionManager {
  private trx: Knex.Transaction | null = null;

  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
  ) {}

  /**
   * Start a new transaction at the root of processMessage
   */
  async start(): Promise<Knex.Transaction> {
    if (this.trx) {
      throw new Error('Transaction already started');
    }
    this.trx = await this.knex.transaction();
    return this.trx;
  }

  /**
   * Get the current transaction (for services to use)
   */
  getTrx(): Knex.Transaction {
    if (!this.trx) {
      throw new Error('No active transaction. Call start() first.');
    }
    return this.trx;
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (this.trx) {
      await this.trx.commit();
      this.trx = null;
    }
  }

  /**
   * Rollback the transaction (call on error)
   */
  async rollback(): Promise<void> {
    if (this.trx) {
      await this.trx.rollback();
      this.trx = null;
    }
  }

  /**
   * Convenience method for try/finally pattern
   */
  async execute<T>(work: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    const trx = await this.start();
    try {
      const result = await work(trx);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}