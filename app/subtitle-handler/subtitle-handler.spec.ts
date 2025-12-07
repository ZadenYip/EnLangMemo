import { resolve } from 'path';
import { parseSubtitle } from './subtitle-handler';
import { readFile, readFileSync } from 'fs';

jest.mock('electron', () => ({
  webUtils: {
    getPathForFile: jest.fn((file: File) => resolve(__dirname, './fixture/' + file.name))
  }
}));

describe('Subtitle Handler', () => {

    it('should parse an SRT file correctly', async () => {
        const srtFilePath = resolve(__dirname, './fixture/GBC.srt');
        const buffer = readFileSync(srtFilePath);
        const file: File = new File([buffer], 'GBC.srt', { type: 'text/plain' });
        const subtitles = await parseSubtitle(null as any, file, 0);
        
    });

});