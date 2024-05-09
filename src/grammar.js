import { apply, lazyTransform, wrap, pipe, map } from "./utils";

export const grammar = (transform) => {
  const createGrammarProxy = ($) => {
    const nodes = {};
    return {
      nodes,
      grammar: new Proxy($, {
        get(_, prop) {
          if (!nodes.hasOwnProperty(prop)) {
            throw Error(`AST node '${prop}' doesn't exisit!`);
          }
          // console.log("GET", nodes[prop].name);
          return nodes[prop].handler;
        },
        set(_, prop, value) {
          if (nodes.hasOwnProperty(prop)) {
            throw Error(`AST node '${prop}' already exisits!`);
          }
          const [definition, handler] = value;
          nodes[prop] = {
            name: prop,
            definition,
            handler: transform(lazyTransform(definition, apply), handler),
            // handler: wrap(lazyTransform(definition, apply), handler),
          };
          return true;
        },
      }),
    };
  };

  const grammarInitializers = new Map();
  const initGrammar = (grammar) => grammarInitializers.get(grammar)();
  const createGrammar = () => {
    let root = null;
    const commands = [];
    const methods = {
      useRoot(node) {
        if (root != null) {
          throw Error("Cannot set multiple roots!");
        }
        root = node;
      },
    };
    const { grammar, nodes } = createGrammarProxy((handler) => {
      commands.push(handler);
    });
    const init = () => {
      commands.forEach((handler) => handler(methods));
      if (!root) {
        throw Error(`Must set root node before initializing grammar`);
      }
      Object.values(nodes).forEach((type) => {
        console.log(`TYPE: ${type.name}`, type);
      });
      return (code) => root.call(pipe, code, map);
    };
    grammarInitializers.set(grammar, init);

    return grammar;
  };

  return { initGrammar, createGrammar };
};
