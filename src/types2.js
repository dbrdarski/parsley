import { matchString, matchPattern, collector } from "./utils";

export const $next = () => collector();
export const $token = (...tokens) =>
  function (next, code) {
    for (const token of tokens) {
      const result =
        typeof token === "string"
          ? matchString(code, token)
          : matchPattern(code, token);
      result && next(result, code.substring(result.length, code.length));
    }
  };
