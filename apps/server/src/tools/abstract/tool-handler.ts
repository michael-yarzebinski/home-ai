import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Base class for all executable tools.
 * Only contains what must be defined in code.
 */
export abstract class ToolHandler<
  TParams extends z.ZodObject<any, any> = z.ZodObject<any, any>,
  TResult = any,
> {
  /**
   * Unique identifier. Must exactly match the 'name' column in the 'tools' table.
   */
  abstract readonly name: string;

  /**
   * Zod schema that defines what parameters the LLM must send.
   */
  abstract readonly parameters: TParams;

  abstract readonly description: string;

  /**
   * The actual business logic of the tool.
   */
  abstract execute(params: z.infer<TParams>, context: any): Promise<TResult>;

  async runAppleScript(appleScript: string): Promise<string> {
    // We use <<'EOF' to treat the script as a raw string in the shell.
    // This prevents the shell from trying to interpret backslashes or quotes.
    const command = `osascript <<'EOF'\n${appleScript}\nEOF`;

    const { stdout } = await execAsync(command);

    return stdout.trim();
  }
}
