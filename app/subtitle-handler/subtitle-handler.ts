import { IpcMainInvokeEvent, webUtils } from 'electron';
import { createReadStream, WriteStream } from 'fs';
import { parse, resync } from 'subtitle';

interface SubtitleItem {
    startTime: number;
    endTime: number;
    text: string;
}

export async function parseSubtitle(
    event: IpcMainInvokeEvent,
    file: File,
    resyncNum: number = 0
): Promise<SubtitleItem[]> {
    const cleanUpMap = new Map<string, SubtitleItem>();

    
    createReadStream(webUtils.getPathForFile(file))
        .pipe(parse())
        .pipe(resync(resyncNum))
        .on('data', (node) => {
            // 结构见 https://github.com/gsantiago/subtitle.js?tab=readme-ov-file#nodes
            if (node.type === 'cue') {
                const subtitleNode: SubtitleItem = {
                    startTime: node.data.start,
                    endTime: node.data.end,
                    text: node.data.text
                };
                const key = nodeToString(subtitleNode);
                if (!cleanUpMap.has(key)) {
                    cleanUpMap.set(key, subtitleNode);
                } else {
                    
                }
            }
        })
        .on('error', (error: Error) => {
            console.log('Error parsing subtitle:', error.message);
        })
        .on('end', () => {
            console.log('Finished parsing subtitle.');
        });

    return Array.from(cleanUpMap.values());
}


function nodeToString(node: SubtitleItem): string {
    return `${node.startTime}-${node.endTime}-${node.text}`;
}