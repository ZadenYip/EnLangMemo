import { lemmatize } from ".";

describe('NLP Tokenization Test', () => {
    it('should output lemmatized tokens', () => {
        expect(lemmatize('running')).toBe('run');
        expect(lemmatize('happier')).toBe('happy');
        expect(lemmatize('children')).toBe('child');
        expect(lemmatize('run')).toBe('run');
        expect(lemmatize('qwref')).toBe('qwref');
    });
});
