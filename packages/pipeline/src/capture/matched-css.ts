// The matched CSS of an element (docs/specs/capture-and-states.md, step 6): its author rules in
// cascade order, its inline declarations and its pseudo-elements. Read from the page's CSSOM by
// `cssom-match.ts` (D-068). Previews are rebuilt from these.

export type Declaration = { name: string; value: string; important: boolean };
export type MatchedRule = { selector: string; matched: string[]; origin: string; media: string[]; supports: string[]; declarations: Declaration[] };
export type MatchedStyles = { rules: MatchedRule[]; inline: Declaration[]; pseudo: { pseudo: string; rules: MatchedRule[] }[] };
