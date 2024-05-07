export const log =
  (...args) =>
  (y) => (console.log(...args, y), y);
const id = (x) => x;
const apply = (x) => x();

const stack = (resolver) => {
  const node = (head, tail = null) =>
    function $(next) {
      if (arguments.length) {
        return node(next, $);
      } else {
        return tail ? resolver(head, tail()) : head;
      }
    };
  return node;
};

const pipe = stack(
  (head, tail) =>
    (...args) =>
      tail(head(...args)), // ...args because of handlers (x, y, z) => ... need to work
)(id);
const collect = stack((head, tail) => [...tail, head])([]);
const bind = stack((head, tail) => tail.bind(null, head));
const smap = stack(
  (head, tail) => (key) => (head[0] === key ? head[1] : tail?.(key)),
)();

// const map = (f, arr) => {
//   const target = [];
//   const push = Array.prototype.push.bind(target);
//   arr.forEach((...args) => push(f.apply(target, args)));
//   return target;
// };

// const mergeMap = (f, target = []) => {
//   const push = Array.prototype.push.bind(target);
//   return [
//     target,
//     (arr) => arr.forEach((...args) => push(f.apply(target, args))),
//   ];
// };

const wrap = (fn, handler) =>
  function (...args) {
    return fn.apply(this?.(handler), args).flat();
  };

const lazyTransform = (fn, transformer) => {
  let transformed;
  return function (...args) {
    if (!transformed) {
      transformed = transformer(fn);
    }
    return transformed.apply(this, args);
  };
};

const createGrammarProxy = ($) => {
  const nodes = {};
  return {
    nodes,
    grammar: new Proxy($, {
      get(target, prop, receiver) {
        if (!nodes.hasOwnProperty(prop)) {
          throw Error(`AST node '${prop}' doesn't exisit!`);
        }
        // console.log("GET", nodes[prop].name);
        return nodes[prop].handler;
      },
      set(target, prop, value, receiver) {
        if (nodes.hasOwnProperty(prop)) {
          throw Error(`AST node '${prop}' already exisits!`);
        }
        const children = new Set();
        const parents = new Set();
        const [definition, handler] = value;
        const node = (nodes[prop] = {
          name: prop,
          has(type) {
            return children.has(type);
          },
          addParent(type) {
            if (children.has(type)) return;
            parents.add(type);
          },
          addChild(type) {
            if (children.has(type)) return;
            if (node === type) node.recursive = true;
            children.add(type);
            for (const child of type.children) {
              this.addChild(child);
            }
            for (const parent of parents) {
              parent.addChild(type);
            }
            type.addParent(node);
          },
          recursive: false,
          definition,
          handler: wrap(lazyTransform(definition, apply), handler), // wrap(lazyTransform)
        });
        return true;
      },
    }),
  };
};

const grammarInitializers = new Map();
export const initGrammar = (grammar) => grammarInitializers.get(grammar)();
export const createGrammar = () => {
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
    return (code) => root.call(pipe, code);
  };
  grammarInitializers.set(grammar, init);

  return grammar;
};

const matchString = (target, pattern) =>
  target.indexOf(pattern) === 0 ? pattern : "";

const matchPattern = (target, pattern) => {
  const match = target.match(pattern);
  return match?.index === 0 ? match[0] : "";
};

export const Type = (node, handler = id) => [node, handler];
export const Token = (...tokens) =>
  function (targetString) {
    const matches = [];
    for (const token of tokens) {
      const result =
        typeof token === "string"
          ? matchString(targetString, token)
          : matchPattern(targetString, token);
      if (result) {
        matches.push({
          next: this()(result),
          code: targetString.substring(result.length, targetString.length),
        });
      }
    }
    return matches;
  };

export const Maybe = (node) =>
  function (code) {
    const next = node.call(pipe, code);
    return next.length ? next : [{ code, next: null }];
  };

export const Match = (...nodes) =>
  function (code) {
    const binder = bind(this());
    return nodes
      .reduce(
        (acc, node) =>
          acc.flatMap(({ ctx, code }) =>
            node.call(pipe, code).flatMap(({ next, code }) => {
              return { node, next, code, ctx: ctx(next) };
            }),
          ),
        [{ code, ctx: binder }],
      )
      .map((x) => ({
        code: x.code,
        next: x.ctx()(),
      }));
  };

export const Either = (...nodes) =>
  function (code) {
    return nodes.map((node) => node.call(this, code));
  };

const walk = (node, finalizer, code, list) => {
  const results = node.call(pipe, code);
  return results.length
    ? results.flatMap((result) =>
        result.code === code
          ? []
          : walk(node, finalizer, result.code, list(result.next)),
      )
    : [{ code, next: finalizer()(list()) }];
};

export const List = (node) =>
  function (code) {
    return walk(node, this, code, collect);
  };

// const initOperators = operators => () => operators

// export const Operator = (...operators) => (definition) => {
//   const Operator = initOperators(operators)
//   const node = definition({ Operator })

//   function handler(code) {
//     if (threadItem && threadItem.has(handler)) {
//       return [{ code, next: [] }]
//     }
//     return [
//       useThread(new Set([...threadItem ?? [], handler]), () => node.call(this, code))()
//     ]
//   }

//   return handler
// }

// export const Operation = (definition) => {
//   const handler = definition({
//     Operator(node) {
//       console.log("OPERATOR", this, node)
//       return function(code) {
//         return node.call(this, code)
//       }
//     }, Operand(node) {
//       console.log("OPERAND", this, node)
//       return function(code) {
//         return node.call(this, code)
//       }
//     }
//   })
//   console.log({ definition, handler })

//   // threadItem && threadItem.has(fn)
//   //   ? []
//   //   : useThread(new Set([...threadItem ?? [], fn]), fn)

//   return function(code) {
//     if (threadItem && threadItem.has(handler)) {
//       return [{ code, next: [] }]
//     }

//     console.log({ handler, x: handler.call(log("WTF"), code) })
//     const node = handler.call(this, code)
//     console.log({ node, code })
//     return [{ code, next: [] }]
//   }
// }

// export const createOperator = (operator, precedence, associativity) => ({
//   token: Token(operator),
//   precedence,
//   associativity
// })

// let thread = null

// const useThread = (item, fn) => (...args) => {
//   const prev = thread
//   thread = item
//   const result = fn(...args)
//   thread = prev
//   return result
// }

// export const example = (Operation, operators) =>
//   Operation(({ Operator, Operand }) =>
//     Match(
//       Operand(Expr),
//       Operator(Token(...operators)),
//       Operand(Expr)
//     )
//   )
