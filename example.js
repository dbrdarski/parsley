import {
  initGrammar,
  createGrammar,
  Type,
  List,
  Either,
  Match,
  Token,
  Maybe,
  log,
  // Operation, Operator, createOperator
} from "/src/parsley";

const $ = createGrammar();
const $$ = createGrammar();

$$(({ useRoot }) => useRoot($$.File));

// const Guard = createOperator("&&", 4, 1)
// const Default = createOperator("||", 3, 1)

$$.File = Type(
  () => $$.Program,
  (x) => ({ type: "File", program: x }),
);
$$.Program = Type(
  () => List($$.Statement),
  (x) => ({ type: "Program", body: x }),
);
// $$.Statement = Type(() => Either($$.UnaryExpression, $$.BinaryExpression), x => ({ type: "Statement", expression: x }))
$$.Statement = Type(
  () => Match($$.Expression, Maybe(Token(";"))),
  (expression) => ({ type: "Statement", expression }),
);
$$.Operation = Type(
  () =>
    Match(
      Token("+", "-", "=", "*", "/", "++"),
      Token("("),
      List(Match($$.Expression, Token(" "))),
      Token(")"),
    ),
  (operator, _, operands) => ({
    type: "Operation",
    operator,
    operands,
  }),
);
$$.BinaryExpression = Type(
  () =>
    Match(
      Token("++", "+", "-", "=", "*", "/"),
      $$.Expression,
      Token(" "),
      $$.Expression,
    ),
  (operation, left, _, right) => ({
    type: "BinaryExpression",
    operation,
    left,
    right,
  }),
);
$$.Sequence = Type(
  () => Match(Token("("), List($$.Expression), Token(")")),
  (_, value) => ({
    type: "Sequence",
    sequence: value,
  }),
);
$$.Expression = Type(
  () =>
    Either(
      $$.NumericLiteral,
      $$.Identifier,
      $$.Sequence,
      // $$.UnaryExpression,
      $$.Operation,
      // $$.LogicalExpression,
      $$.BinaryExpression,
    ),
  (node) => node,
);

$$.NumericLiteral = Type(
  () => Token(/[0-9]+/),
  (x) => ({ type: "NumericLiteral", value: x }),
);

$$.Identifier = Type(
  () => Token(/[a-zA-Z]+[a-zA-Z0-9]*/),
  (x) => ({ type: "Identifier", id: x }),
);

// $$.LogicalExpression = Type(() => Operator(({ Operator, Operand }) => Match(
//   Operator(Token("&&", "||")),
//   Operand($$.Expression),
//   Operand($$.Expression)
// ), () => {

// }))

// $$.UnaryExpression = Type(() => Match(
//   Token("+", "-"),
//   $$.Expression
// ), (operation, expression) => ({
//   type: "UnaryExpression",
//   operation,
//   expression
// }))

const parser = (globalThis.parser = initGrammar($$));

// 0: WHITESPACE // ignore
// 1: Token("\n")
// 2: EOF
// 3: Token(/[A-Za-z][A-Za-z0-9]*/) // Identifier
// 4: Token(/[0-9]+/) // NumericLiteral
// 5: Token(/(["'])(?:(?=(\\?))\2.)*?\1/) // StringLiteral
// 6: Token("`")
// //////////////
// 7: Token(/(?:(?=(\\?))\1.)*?(`|\${)/)
// 8: Token("+", "_", "*", "/", "**", "%")
// 9: Token("&&", "||")

$(({ useRoot }) => useRoot($.Body));

// [Body] -> [Expr, Expr(Binary), Expr(Conditional)] -> [Expr(Binary)]

$.Body = Type(
  () => List($.Statement),
  ($) => ({ body: $ }),
);

$.Statement = Type(
  () =>
    Either(Newline, Match($.Expr, Newline), Either(EOF, Match($.Expr, EOF))),
  ($) =>
    $.length === 2
      ? {
          expression: $[0],
        }
      : null,
);
const Newline = Token("\n");
$.Expr = Type(() =>
  Either(
    $.Identifier,
    $.Literal,
    $.BinaryExpr,
    $.ConditionalExpr,
    $.LogicalExpr,
  ),
);

$.Identifier = Type(
  () => Token(/[A-Za-z][A-Za-z0-9]*/),
  ($) => ({ id: $[0] }),
);

$.SLit = Type(() => $.StringLiteral);
$.SL = Type(() => $.SLit);

$.Literal = Type(() =>
  Either(
    $.NumericLiteral,
    $.StringLiteral,
    $.BooleanLiteral,
    $.StringTemplateLiteral,
  ),
);

const handleLiteral = ($) => ({ value: JSON.parse($[0]) });

$.NumericLiteral = Type(() => Token(/[0-9]+/), handleLiteral);
$.StringLiteral = Type(
  // () => Token(/(["'])(?:(?=(\\?))\2.)*?\1/),
  () => Token(/(["])(?:(?=(\\?))\2.)*?\1/),
  handleLiteral,
);
$.BooleanLiteral = Type(() => Token(/true|false/), handleLiteral);

$.StringTemplateLiteral = Type(
  () => Match(Token("`"), $.StringLiteralBody, Token("`")),
  ($) => $[1],
);

$.StringLiteralBody = Type(() =>
  List(Either($.TemplateElement, $.TemplateExpr)),
);

$.TemplateElement = Type(() => Token(/(?:(?=(\\?))\1.)*?(`|\${)/));

const matchBinary = ($) => ({
  left: $[0],
  operator: $[1],
  right: $[2],
});

$.BinaryExpr = Type(() => Match($.Expr, BinaryOperator, $.Expr), matchBinary);

const BinaryOperator = Token("+", "_", "*", "/", "**", "%");

$.LogicalExpr = Type(() => Match($.Expr, LogicalOperator, $.Expr), matchBinary);

const LogicalOperator = Token("&&", "||");
globalThis.AST = $$;
export default $;
