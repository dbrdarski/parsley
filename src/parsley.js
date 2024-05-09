import { grammar } from "./grammar";
import { wrap } from "./utils";
export * from "./types";
export * from "./types2";

const transform = (definition, handler) => wrap(definition, handler);
const init = (root) => (code) => root.call(pipe, code, map);
const $ = grammar(transform, init);
export const $grammar = grammar;

export const createGrammar = $.createGrammar;
export const initGrammar = $.initGrammar;
