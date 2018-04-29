"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@babel/core");
var t = require("@babel/types");
var lodash_1 = require("lodash");
var fileHeader = "\n// @flow\nimport stringifyQs from 'qs/lib/stringify';\n\nfunction enrichPathWithQueryStringParams(path, queryStringParams) {\n  const qs = stringifyQs(queryStringParams);\n\n  if (qs) {\n    return `${ path }?${ qs }`;\n  }\n\n  return path;\n}\n";
function generateAnnotatedFile(routes) {
    var nodes = [];
    routes.forEach(function (route) {
        var pathParamNames = (route.pathMask.match(/\:[A-Za-z_]+/g) || [])
            // cleanup
            .map(function (name) { return name.replace(/^:/, ''); });
        // this might include querystring parameter names
        var allParamNames = lodash_1.uniq(pathParamNames.concat(Object.keys(route.paramPatterns)));
        var areParamsOptional = pathParamNames.length === 0;
        var patterns = route.paramPatterns || {};
        var defaults = route.defaultParams || {};
        var typeNode = t.exportNamedDeclaration(t.typeAlias(t.identifier(route.typeAliasName), null, t.objectTypeAnnotation(allParamNames.map(function (paramName) {
            if (paramName in patterns) {
                var pattern = patterns[paramName];
                if (pattern.includes('|')) {
                    var unionValues = pattern.split('|');
                    return t.objectTypeProperty(t.identifier(paramName), t.unionTypeAnnotation(unionValues.map(function (value) { return t.stringLiteralTypeAnnotation(value); })));
                }
            }
            return t.objectTypeProperty(t.identifier(paramName), t.unionTypeAnnotation([
                t.stringTypeAnnotation(),
                t.numberTypeAnnotation()
            ]));
        }))), []);
        // To be passed to react-router's <Route>
        var pathMaskNode = t.exportNamedDeclaration(t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier(route.name + '_PATH_MASK'), t.stringLiteral(route.pathMask))
        ]), []);
        var functionNode = t.exportNamedDeclaration(t.functionDeclaration(t.identifier(route.name), 
        // (params: ArticleShowParams)
        [(function () {
                // We use an IIFE (https://developer.mozilla.org/en-US/docs/Glossary/IIFE)
                // here because @babel/types builders haven't been updated yet to
                // support type annotations, so we have to manually assign these things
                var paramsNode = t.identifier('params');
                paramsNode.optional = areParamsOptional;
                paramsNode.typeAnnotation = t.typeAnnotation(t.genericTypeAnnotation(t.identifier(route.typeAliasName)));
                return paramsNode;
            })()], t.blockStatement(lodash_1.compact([
            // start of block statement
            areParamsOptional ?
                // If params are optional, just assign it to queryStringParams
                t.variableDeclaration('const', [
                    t.variableDeclarator(t.identifier('queryStringParams'), t.identifier('params'))
                ]) :
                // Otherwise do something like const { a, b, ...queryStringParams } = params;
                t.variableDeclaration('const', [
                    t.variableDeclarator(t.objectPattern(allParamNames.map(function (paramName) {
                        var key = t.identifier(paramName);
                        var value = paramName in defaults ?
                            t.assignmentPattern(key, t.stringLiteral(defaults[paramName])) :
                            t.identifier(paramName);
                        return t.objectProperty(key, value, /* computed */ false, /* shorthand */ true);
                    }).concat([
                        t.restElement(t.identifier('queryStringParams'))
                    ])), t.identifier('params'))
                ])
        ].concat((Object.keys(patterns).map(function (paramName) {
            var pattern = patterns[paramName];
            return t.ifStatement(
            // if (/\d+/.test(String(myParam)))
            t.callExpression(t.memberExpression(t.regExpLiteral(pattern), t.identifier('test')), [
                t.callExpression(t.identifier('String'), [
                    t.identifier(paramName)
                ])
            ]), 
            // throw new TypeError...
            t.blockStatement([
                t.throwStatement(t.newExpression(t.identifier('TypeError'), [
                    t.templateLiteral(
                    // quasis
                    [
                        t.templateElement({ raw: "Invalid param " + paramName + " passed to route " + route.name + ": a value matching " + pattern + " expected, but received " }),
                        t.templateElement({ raw: ' of type ' }),
                        t.templateElement({ raw: '' }, /* tail */ true)
                    ], 
                    // expressions
                    [
                        t.identifier(paramName),
                        t.unaryExpression('typeof', t.identifier(paramName))
                    ])
                ]))
            ]));
        })), [
            // end of regex checks
            t.returnStatement(t.callExpression(t.identifier('enrichPathWithQueryStringParams'), [
                t.templateLiteral(
                // quasis (the string literal bits)
                route.pathMask.split(/:[A-Za-z_]+/).map((function (value, index, parts) {
                    var isTail = index === parts.length - 1;
                    return t.templateElement({ raw: value }, isTail);
                })), 
                // expressions (the dynamic bits)
                (route.pathMask.match(/:[A-Za-z_]+/g) || []).map(function (value) {
                    var paramName = value.replace(/^:/, '');
                    return t.identifier(paramName);
                })),
                t.identifier('queryStringParams')
            ]))
            // end of block statement
        ])))), []);
        nodes.push(typeNode);
        nodes.push(pathMaskNode);
        nodes.push(functionNode);
    });
    var ast = t.program(nodes);
    var code = core_1.transformFromAstSync(ast).code;
    return fileHeader + "\n" + code;
}
exports.generateAnnotatedFile = generateAnnotatedFile;
