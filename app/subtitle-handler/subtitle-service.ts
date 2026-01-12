import { ISubtitleService } from './subtitle-service.interface';
import { Observable } from 'rxjs';
import { createReadStream } from 'fs';
import { Parser } from './srt/parser/parser';
import { GlobalSubtitle } from '../../src/app/immerse/subtitle-interface';

export class SubtitleService implements ISubtitleService {

    public fetchSubtitles$(filePath: string): Observable<GlobalSubtitle> {
        const stream = createReadStream(filePath);
        const cueIterator = Parser.createParser(stream);
        
        const ObservableCue$ = new Observable<GlobalSubtitle>(
            (subscriber) => {
                
                const run = async () => {
                    try {
                        for await (const cueAST of cueIterator) {
                            const cue: GlobalSubtitle = {
                                id: cueAST.sequence,
                                startTime: cueAST.startTime.totalMilliseconds,
                                endTime: cueAST.endTime.totalMilliseconds,
                                textLines: cueAST.textLines,
                            };
                            subscriber.next(cue);
                        }
                    } catch (error) {
                        subscriber.error(error);
                    } finally {
                        subscriber.complete();
                        console.log('Subtitle stream completed.');
                        stream.close();
                    }
                };

                run();
            }
        )

        return ObservableCue$;
    }

}
