export const log =
  (...args) =>
  (y) => (console.log(...args, y), y)
export const id = (x) => x
export const noop = () => {}
export const apply = (x) => x()

export const stack = (resolver) => {
  const node = (head, tail = null) =>
    function $(next) {
      if (arguments.length) {
        return node(next, $)
      } else {
        return tail ? resolver(head, tail()) : head
      }
    }
  return node
}
export const map = stack(
  (head, tail) => (key) => (head[0] === key ? head[1] : tail?.(key)),
)(noop)
export const pipe = stack(
  (head, tail) =>
    (...args) =>
      tail(head(...args)), // ...args because of handlers (x, y, z) => ... need to work
)(id)
export const collect = stack((head, tail) => [...tail, head])([])
export const bind = stack((head, tail) => tail.bind(null, head))

export const collector = (target = []) => [target, target.push.bind(target)]

export const wrap = (fn, handler) =>
  function (...args) {
    return fn.apply(this?.(handler), args).flat()
  }

export const lazyTransform = (fn, transformer) => {
  let transformed
  return function (...args) {
    if (!transformed) {
      transformed = transformer(fn)
    }
    return transformed.apply(this, args)
  }
}

export const matchString = (target, pattern) =>
  target.indexOf(pattern) === 0 ? pattern : ""

export const matchPattern = (target, pattern) => {
  const match = target.match(pattern)
  return match?.index === 0 ? match[0] : ""
}

const handleRecursion = (type) =>
  (path, code, ...args) => {
    const match = path()(type)
    if (match && match.code === code) {
      return match.node
    }
    const [node, set] = recursiveNode()
    const result = type(path([type, { code, node }]), code, ...args)
    set(result)
    return result
  }

const recursiveNode = (target) => [
  new Proxy(
    {},
    {
      get(_, prop) {
        return target[prop]
      },
    },
  ),
  (node) => (target = node),
]
