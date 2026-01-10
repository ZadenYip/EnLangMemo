import { Cue, ISubtitleService } from './subtitle-service.interface';
import { Observable } from 'rxjs';
import { createReadStream } from 'fs';
import { Parser } from './srt/parser/parser';

export class SubtitleService implements ISubtitleService {

    public fetchSubtitles$(filePath: string): Observable<Cue> {
        const stream = createReadStream(filePath);
        const cueIterator = Parser.createParser(stream);
        
        const ObservableCue$ = new Observable<Cue>(
            (subscriber) => {
                
                const run = async () => {
                    try {
                        for await (const cueAST of cueIterator) {
                            const cue: Cue = {
                                sequence: cueAST.sequence,
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
