// src/tools/default/register-note.tool.ts
import { z } from 'zod';
import { ToolHandler } from '../../abstract/tool-handler';
import { NoteStore } from '../../../core/stores/note/note.store';
import type { ToolContext } from '../../types/tool-context';
import { Injectable } from '@nestjs/common';
import { Tool } from 'src/tools/decorators/tool.decorator';
import { Role } from '@home-ai/shared/domain/role/role';

const RegisterNoteToolSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe('Exact note/folder name from Apple Notes (e.g. "Shopping List")'),
  friendlyName: z.string().optional().describe('Friendly display name (optional)'),
  readRoles: z.array(z.string()).optional().describe('Roles that can read this note'),
  writeRoles: z.array(z.string()).optional().describe('Roles that can write to this note'),
});

export interface RegisterNoteResult {
  success: boolean;
  message: string;
  noteName: string;
}

@Tool()
@Injectable()
export class RegisterNoteTool extends ToolHandler<typeof RegisterNoteToolSchema, RegisterNoteResult> {
  readonly name = 'register-note';
  readonly filterOnIsRecursiveCall = false;

  readonly description =
    'Register an Apple Note or folder in Home AI so it can be listed and used by tools. ' +
    "Admin-only tool. If read/write roles are not provided, they default to the current user's role.";

  readonly parameters = RegisterNoteToolSchema;

  constructor(private readonly noteStore: NoteStore) {
    super();
  }

  async execute(
    params: z.infer<typeof RegisterNoteToolSchema>,
    context: ToolContext,
  ): Promise<RegisterNoteResult> {
    const readRoles = params.readRoles?.length
      ? (params.readRoles as Role[])
      : [context.userRole];
    const writeRoles = params.writeRoles?.length
      ? (params.writeRoles as Role[])
      : [context.userRole];

    const note = await this.noteStore.create({
      name: params.name,
      friendlyName: params.friendlyName || params.name,
      readRoles,
      writeRoles,
      aliases: [],
    });

    return {
      success: true,
      message: `✅ Note "${params.name}" has been registered successfully.`,
      noteName: note.name,
    };
  }
}
