import { id, bind, pipe, collect, matchString, matchPattern } from "./utils"

export const Type = (node, handler = id) => [node, handler]
export const Token = (...tokens) =>
  function (targetString) {
    const matches = []
    for (const token of tokens) {
      const result =
        typeof token === "string"
          ? matchString(targetString, token)
          : matchPattern(targetString, token)
      if (result) {
        matches.push({
          next: this()(result),
          code: targetString.substring(result.length, targetString.length),
        })
      }
    }
    return matches
  }

export const Maybe = (node) =>
  function (code, prev) {
    const next = node.call(pipe, code)
    return next.length ? next : [{ prev, code, next: null }]
  }

export const Match = (...nodes) =>
  function (code, prev) {
    const binder = bind(this())
    return nodes
      .reduce(
        (acc, node) =>
          acc.flatMap(({ ctx, code }) =>
            node.call(pipe, code).flatMap(({ next, code }) => {
              return { node, next, code, ctx: ctx(next) }
            }),
          ),
        [{ prev, code, ctx: binder }],
      )
      .map((x) => ({
        prev,
        code: x.code,
        next: x.ctx()(),
      }))
  }

export const Either = (...nodes) =>
  function (code, prev) {
    return nodes.map((node) => node.call(this, code, prev))
  }

const walk = (node, finalizer, code, list, prev) => {
  const results = node.call(pipe, code)
  return results.length
    ? results.flatMap((result) =>
        result.code === code
          ? []
          : walk(node, finalizer, result.code, list(result.next), prev),
      )
    : [{ prev, code, next: finalizer()(list()) }]
}

export const List = (node) =>
  function (code, prev) {
    return walk(node, this, code, collect, prev)
  }
