import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class AppleNotesTool {
  /**
   * Add a checkbox item to a specific Apple Note
   */
  async addToNote(
    noteName: string,
    parameters: any,
    user: any | null
  ): Promise<{
    success: boolean;
    message: string;
    reply: string;
    notify?: boolean;
  }> {
    const item = parameters.item || parameters.text || 'New item';
    const cleanItem = item.replace(/["'`]/g, ''); // Basic sanitization

    try {
      // AppleScript to append a checkbox to a specific note
      const appleScript = `
        tell application "Notes"
          set targetNote to first note whose name is "${noteName}"
          set newBody to (body of targetNote) & return & "- [ ] ${cleanItem}"
          set body of targetNote to newBody
          return "Added to ${noteName}: ${cleanItem}"
        end tell
      `;

      const { stdout, stderr } = await execAsync(`osascript -e '${appleScript}'`);

      if (stderr) {
        console.error('AppleScript error:', stderr);
        return {
          success: false,
          message: 'Failed to update Apple Note',
          reply: 'Sorry, I couldn’t update the note. Please try again.',
        };
      }

      const resultMessage = stdout.trim() || `Added "${cleanItem}" to ${noteName}`;

      return {
        success: true,
        message: resultMessage,
        reply: resultMessage,
        notify: true, // Trigger notification to parents/etc.
      };

    } catch (error: any) {
      console.error('Apple Notes error:', error);
      return {
        success: false,
        message: 'AppleScript execution failed',
        reply: `Sorry, I couldn’t add "${cleanItem}" to ${noteName}.`,
      };
    }
  }
}