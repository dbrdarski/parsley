import { grammar } from "./grammar";
import { wrap } from "./utils";
export * from "./types";
export * from "./types2";

const transform = (definition, handler) => wrap(definition, handler);
const $ = grammar(transform);

export const createGrammar = $.createGrammar;
export const initGrammar = $.initGrammar;
