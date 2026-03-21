import WinkFn, { ItsFunction } from "wink-nlp";
import model from 'wink-eng-lite-web-model';

const nlp = WinkFn(model);

export function lemmatize(word: string): string {
    const doc = nlp.readDoc(word);
    const lemmatizedWord = doc.tokens().out(nlp.its.lemma as ItsFunction<string>);
    return lemmatizedWord[0];
}