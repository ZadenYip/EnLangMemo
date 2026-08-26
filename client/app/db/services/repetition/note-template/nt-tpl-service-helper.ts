import { NoteTemplate, TemplateField } from "./nt-tpl-service-types.js";

/**
 * Official preset id for the sentence-mining definition note template.
 */
export const SENTENCE_MINING_DEF_TPL_PRESET_ID = 1;

/**
 * User-visible name for the sentence-mining definition note template.
 */
export const SENTENCE_MINING_DEFINITION_TPL_NAME = "Sentence Mining Definition";

/**
 * Create the built-in sentence-mining definition note template.
 */
export function createSentenceMiningDefinitionNoteTpl(): NoteTemplate {
    const dateTime = Date.now();
    const word = createField(dateTime, "Word");
    const ctxField = createField(dateTime + 1, "Context");
    const phonetic = createField(dateTime + 2, "Phonetic");
    const srcDefinition = createField(dateTime + 3, "Source Definition");
    const tgtDefinition = createField(dateTime + 4, "Target Definition");
    const audio = createField(dateTime + 5, "Audio");
    return {
        css,
        sortField: ctxField.id,
        fields: [word, ctxField, phonetic, srcDefinition, tgtDefinition, audio],
        front,
        back,
    };
}

const front =
`
<div class="bar head">Processing</div>

<div class="section">
  <div class="word-line">
    <span class="word-meta">{{Word}}</span>
    {{#Phonetic}}
      <span class="word-meta">[{{Phonetic}}]</span>
    {{/Phonetic}}
  </div>

  <div class="expression">
    {{Context}}
  </div>
</div>
`;

const back =
`
<div class="bar head">Processing</div>

<div class="section">
  <div class="word-line">
    <span class="word-meta">{{Word}}</span>
    {{#Phonetic}}
      <span class="word-meta">[{{Phonetic}}]</span>
    {{/Phonetic}}
  </div>

  <div class="expression">
    {{Context}}
  </div>

  <div class="divide"></div>

  <div class="definitions">
    {{#Source Definition}}
      <div class="items definition">{{Source Definition}}</div>
    {{/Source Definition}}

    {{#Target Definition}}
      <div class="items target-definition">{{Target Definition}}</div>
    {{/Target Definition}}
  </div>
</div>
`;

const css =
`
html {
  font-size: 16px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-family: helvetica, arial, sans-serif;
  font-size: 14px;
  text-align: left;
  color: #1d2129;
  background-color: #e9ebee;
}

.bar {
  display: flex;
  align-items: center;
  min-height: 1.75rem;
  border-radius: 4px;
  border-bottom: 1px solid #29487d;
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  color: #fff;
  font-weight: bold;
}

.head,
.foot {
  background: #365899;
}

.foot {
  justify-content: flex-end;
}

.section {
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0.875rem;
  border: 1px solid;
  border-color: #e5e6e9 #dfe0e4 #d0d1d5;
  border-radius: 4px;
  background-color: #fff;
  gap: 0.5rem;
}

.word-line {
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
}

.word-meta {
  font-size: 0.875rem;
  color: #606770;
}

.expression {
  padding: 0.125rem 0 0;
  font-size: 1rem;
  line-height: 1.5;
}

.definitions {
  display: flex;
  flex-direction: column;
}

.definition {
  padding: 0;
}

.target-definition {
  color: #606770;
}

.divide {
  border-bottom: 2px solid #e5e5e5;
  background-color: #e5e5e5;
}

.items {
  padding: 0;
  font-size: 1rem;
  line-height: 1.5;
}

.expression b {
  font-weight: normal;
  border-radius: 3px;
  color: #fff;
  background-color: #666;
  padding: 0 3px;
}

.audio-row {
  padding-top: 0.5rem;
  font-size: 0.875rem;
}
`;

export function createField(idTime: number, name: string): TemplateField {
    return {
        id: idTime,
        name,
    };
}
