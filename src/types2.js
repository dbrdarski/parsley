import { matchString, matchPattern, collector } from "./utils"

export const $next = (init) => {
  const [target, add] = collector(init)
  return [target, (next, code) => add({ next, code })]
}

export const $token = (...tokens) =>
  function (code, next) {
    for (const token of tokens) {
      const result = typeof token === "string"
        ? matchString(code, token)
        : matchPattern(code, token)
      result && next(
        this()(result),
        code.substring(result.length, code.length)
      )
    }
  }
