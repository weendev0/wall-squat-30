import { FileSharer, ShareOutcome } from '../../application';

/** The parts of `navigator` this class uses, so tests can pass a fake. */
export interface ShareCapableNavigator {
  canShare?(data: ShareData): boolean;
  share?(data: ShareData): Promise<void>;
}

/**
 * Shares a file with the Web Share API (the iOS share sheet).
 * Browsers without it, such as most desktop browsers, download the file instead.
 */
export class BrowserFileSharer implements FileSharer {
  constructor(
    private readonly browser: ShareCapableNavigator = navigator,
    private readonly page: Document = document,
  ) {}

  async shareText(fileName: string, text: string, mimeType: string): Promise<ShareOutcome> {
    const file = new File([text], fileName, { type: mimeType });
    const shareData: ShareData = { files: [file], title: fileName };

    if (this.browser.share && this.browser.canShare?.(shareData)) {
      try {
        await this.browser.share(shareData);
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'cancelled'; // the user closed the share sheet
        }
        throw error;
      }
    }

    this.download(file);
    return 'downloaded';
  }

  private download(file: File): void {
    const url = URL.createObjectURL(file);
    const link = this.page.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  }
}
