import {
  initGrammar,
  createGrammar,
  Type,
  List,
  Either,
  Match,
  Token,
  Maybe,
  $next,
  $token,
  $grammar,
} from "/src/parsley";

globalThis.$next = (init) => {
  const [target, add] = $next(init);
  return [target, (next, code) => add({ next, code })];
};

globalThis.$token = $token;

const $ = createGrammar();

// const $$ = $grammar(x => x, (root) => (code) => root.call(pipe, code, map)).createGrammar();
// $$(({ useRoot }) => useRoot($$.Statement));
// $$.Statement = Type(() => $token("na"));
// globalThis.$$ = $$;

$(({ useRoot }) => useRoot($.File));

$.File = Type(
  () => $.Program,
  (x) => ({ type: "File", program: x }),
);

$.Program = Type(
  () => List($.Statement),
  (x) => ({ type: "Program", body: x }),
);

$.Statement = Type(
  () => Match($.Expression, Maybe(Token(";"))),
  (expression) => ({ type: "Statement", expression }),
);

$.Operation = Type(
  () =>
    Match(
      Token("+", "-", "=", "*", "/", "++"),
      Token("("),
      List(Match($.Expression, Token(" "))),
      Token(")"),
    ),
  (operator, _, operands) => ({
    type: "Operation",
    operator,
    operands,
  }),
);

$.BinaryExpression = Type(
  () =>
    Match(
      Token("++", "+", "-", "=", "*", "/"),
      $.Expression,
      Token(" "),
      $.Expression,
    ),
  (operation, left, _, right) => ({
    type: "BinaryExpression",
    operation,
    left,
    right,
  }),
);

$.Sequence = Type(
  () => Match(Token("("), List($.Expression), Token(")")),
  (_, value) => ({
    type: "Sequence",
    sequence: value,
  }),
);

$.Expression = Type(
  () =>
    Either(
      $.NumericLiteral,
      $.Identifier,
      $.Sequence,
      // $.UnaryExpression,
      $.Operation,
      // $.LogicalExpression,
      $.BinaryExpression,
    ),
  (node) => node,
);

$.NumericLiteral = Type(
  () => Token(/[0-9]+/),
  (x) => ({ type: "NumericLiteral", value: x }),
);

$.Identifier = Type(
  () => Token(/[a-zA-Z]+[a-zA-Z0-9]*/),
  (x) => ({ type: "Identifier", id: x }),
);

// $.LogicalExpression = Type(() => Operator(({ Operator, Operand }) => Match(
//   Operator(Token("&&", "||")),
//   Operand($.Expression),
//   Operand($.Expression)
// ), () => {

// }))

// $.UnaryExpression = Type(() => Match(
//   Token("+", "-"),
//   $.Expression
// ), (operation, expression) => ({
//   type: "UnaryExpression",
//   operation,
//   expression
// }))

export const parser = (globalThis.parser = initGrammar($));
