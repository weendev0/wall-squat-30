import { BrowserFileSharer } from './browser-file-sharer';

describe('BrowserFileSharer', () => {
  it('opens the share sheet with the file when the phone supports it', async () => {
    const shared: ShareData[] = [];
    const sharer = new BrowserFileSharer({
      canShare: () => true,
      share: async (data) => {
        shared.push(data);
      },
    });

    const outcome = await sharer.shareText('history.csv', 'a,b', 'text/csv');

    expect(outcome).toBe('shared');
    const [file] = shared[0].files!;
    expect(file.name).toBe('history.csv');
    expect(await file.text()).toBe('a,b');
  });

  it('reports a closed share sheet as cancelled', async () => {
    const sharer = new BrowserFileSharer({
      canShare: () => true,
      share: () => Promise.reject(new DOMException('closed', 'AbortError')),
    });

    expect(await sharer.shareText('history.csv', 'a,b', 'text/csv')).toBe('cancelled');
  });

  it('passes on any other sharing error', async () => {
    const sharer = new BrowserFileSharer({
      canShare: () => true,
      share: () => Promise.reject(new DOMException('no', 'NotAllowedError')),
    });

    await expect(sharer.shareText('history.csv', 'a,b', 'text/csv')).rejects.toThrow('no');
  });

  it('downloads the file when sharing files is not supported', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:history');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const outcome = await new BrowserFileSharer({}).shareText('history.csv', 'a,b', 'text/csv');

    expect(outcome).toBe('downloaded');
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:history');
    click.mockRestore();
  });
});
