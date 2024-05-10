import { apply, lazyTransform, wrap, pipe, map } from "./utils"

export const grammar = (transform, initializer) => {
  const createGrammarProxy = ($) => {
    const nodes = {}
    return {
      nodes,
      grammar: new Proxy($, {
        get(_, prop) {
          if (!nodes.hasOwnProperty(prop)) {
            throw Error(`AST node '${prop}' doesn't exisit!`)
          }
          return nodes[prop].handler
        },
        set(_, prop, value) {
          if (nodes.hasOwnProperty(prop)) {
            throw Error(`AST node '${prop}' already exisits!`)
          }
          const [definition, handler] = value
          nodes[prop] = {
            name: prop,
            definition,
            handler: transform(lazyTransform(definition, apply), handler),
            // handler: wrap(lazyTransform(definition, apply), handler),
          }
          return true
        },
      }),
    }
  }

  const grammarInitializers = new Map()
  const initGrammar = (grammar) => grammarInitializers.get(grammar)()
  const createGrammar = () => {
    let root = null
    const commands = []
    const methods = {
      useRoot(node) {
        console.log({ root, node })
        if (root != null) {
          throw Error("Cannot set multiple roots!")
        }
        root = node
      },
    }
    const { grammar, nodes } = createGrammarProxy((handler) => {
      commands.push(handler)
    })
    const init = () => {
      commands.forEach((handler) => handler(methods))
      if (!root) {
        throw Error(`Must set root node before initializing grammar`)
      }
      Object.values(nodes).forEach((type) => {
        console.log(`TYPE: ${type.name}`, type)
      })
      console.log({ root, init })
      // return (code) => root.call(pipe, code, map)
      return initializer(root)
    }
    grammarInitializers.set(grammar, init)

    return grammar
  }

  return { initGrammar, createGrammar }
}
