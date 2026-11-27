/** What happened when a file was handed to the phone. */
export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

/**
 * Hands a text file to the user, for the CSV backup.
 * On the iPhone this opens the share sheet (Save to Files, Mail, AirDrop...).
 * Must be called straight from a tap: iOS refuses to share otherwise.
 */
export interface FileSharer {
  shareText(fileName: string, text: string, mimeType: string): Promise<ShareOutcome>;
}
