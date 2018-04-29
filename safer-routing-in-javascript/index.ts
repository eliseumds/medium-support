import { transformFromAstSync } from '@babel/core';
import * as t from '@babel/types';
import { compact, isEmpty, uniq } from 'lodash';

type Route = {
  name: string, // ARTICLE
  typeAliasName: string, // ArticleParams
  pathMask: string, // /article/:slug
  paramPatterns?: {
    [key: string]: string, // { language: 'en|pt' }
  },
  defaultParams?: Object, // { slug: 'two-koreas-peace }
};

const fileHeader = `
// @flow
import stringifyQs from 'qs/lib/stringify';

function enrichPathWithQueryStringParams(path, queryStringParams) {
  const qs = stringifyQs(queryStringParams);

  if (qs) {
    return \`\${ path }?\${ qs }\`;
  }

  return path;
}
`;

export function generateAnnotatedFile(routes: Array<Route>) {
  const nodes = [];

  routes.forEach(route => {
    const pathParamNames = (route.pathMask.match(/\:[A-Za-z_]+/g) || [])
      // cleanup
      .map(name => name.replace(/^:/, ''));
    // this might include querystring parameter names
    const allParamNames = uniq([...pathParamNames, ...Object.keys(route.paramPatterns)]);
    const areParamsOptional = pathParamNames.length === 0;
    const patterns = route.paramPatterns || {};
    const defaults = route.defaultParams || {};

    const typeNode = t.exportNamedDeclaration(
      t.typeAlias(
        t.identifier(route.typeAliasName),
        null,
        t.objectTypeAnnotation(
          allParamNames.map(paramName => {
            if (paramName in patterns) {
              const pattern = patterns[paramName];

              if (pattern.includes('|')) {
                const unionValues = pattern.split('|');

                return t.objectTypeProperty(
                  t.identifier(paramName),
                  t.unionTypeAnnotation(
                    unionValues.map(value => t.stringLiteralTypeAnnotation(value))
                  )
                );
              }
            }

            return t.objectTypeProperty(
              t.identifier(paramName),
              t.unionTypeAnnotation([
                t.stringTypeAnnotation(),
                t.numberTypeAnnotation()
              ])
            );
          })
        )
      ),
      []
    );

    // To be passed to react-router's <Route>
    const pathMaskNode = t.exportNamedDeclaration(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier(route.name + '_PATH_MASK'),
          t.stringLiteral(route.pathMask)
        )
      ]),
      []
    );

    const functionNode = t.exportNamedDeclaration(
      t.functionDeclaration(
        t.identifier(route.name),
        // (params: ArticleShowParams)
        [(() => {
          // We use an IIFE (https://developer.mozilla.org/en-US/docs/Glossary/IIFE)
          // here because @babel/types builders haven't been updated yet to
          // support type annotations, so we have to manually assign these things
          const paramsNode = t.identifier('params');
          paramsNode.optional = areParamsOptional;
          paramsNode.typeAnnotation = t.typeAnnotation(
            t.genericTypeAnnotation(t.identifier(route.typeAliasName))
          );

          return paramsNode;
        })()],
        t.blockStatement(compact([
          // start of block statement
          areParamsOptional ?
            // If params are optional, just assign it to queryStringParams
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier('queryStringParams'),
                t.identifier('params')
              )
            ]) :
            // Otherwise do something like const { a, b, ...queryStringParams } = params;
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.objectPattern([
                  ...allParamNames.map(paramName => {
                    const key = t.identifier(paramName);
                    const value = paramName in defaults ?
                      t.assignmentPattern(key, t.stringLiteral(defaults[paramName])) :
                      t.identifier(paramName);

                    return t.objectProperty(key, value, /* computed */ false, /* shorthand */ true);
                  }),
                  t.restElement(t.identifier('queryStringParams'))
                ]),
                t.identifier('params')
              )
            ]),
            // start of regex checks
            ...(Object.keys(patterns).map(paramName => {
              const pattern = patterns[paramName];

              return t.ifStatement(
                // if (/\d+/.test(String(myParam)))
                t.callExpression(
                  t.memberExpression(
                    t.regExpLiteral(pattern),
                    t.identifier('test')
                  ),
                  [
                    t.callExpression(
                      t.identifier('String'),
                      [
                        t.identifier(paramName)
                      ]
                    )
                  ]
                ),
                // throw new TypeError...
                t.blockStatement([
                  t.throwStatement(
                    t.newExpression(
                      t.identifier('TypeError'),
                      [
                        t.templateLiteral(
                          // quasis
                          [
                            t.templateElement({ raw: `Invalid param ${paramName} passed to route ${route.name}: a value matching ${pattern} expected, but received `}),
                            t.templateElement({ raw: ' of type ' }),
                            t.templateElement({ raw: '' }, /* tail */ true)
                          ],
                          // expressions
                          [
                            t.identifier(paramName),
                            t.unaryExpression('typeof', t.identifier(paramName))
                          ]
                        )
                      ]
                    )
                  )
                ])
              );
            })),
            // end of regex checks
            t.returnStatement(
              t.callExpression(
                t.identifier('enrichPathWithQueryStringParams'),
                [
                  t.templateLiteral(
                    // quasis (the string literal bits)
                    route.pathMask.split(/:[A-Za-z_]+/).map(((value, index, parts) => {
                      const isTail = index === parts.length - 1;

                      return t.templateElement({ raw: value }, isTail)
                    })),
                    // expressions (the dynamic bits)
                    (route.pathMask.match(/:[A-Za-z_]+/g) || []).map(value => {
                      const paramName = value.replace(/^:/, '');

                      return t.identifier(paramName);
                    })
                  ),
                  t.identifier('queryStringParams')
                ]
              )
            )
          // end of block statement
        ]))
      ),
      []
    );

    nodes.push(typeNode);
    nodes.push(pathMaskNode);
    nodes.push(functionNode);
  });

  const ast = t.program(nodes);
  const { code } = transformFromAstSync(ast);

  return `${fileHeader}\n${code}`;
}
