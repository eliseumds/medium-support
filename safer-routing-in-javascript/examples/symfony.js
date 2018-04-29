"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var yaml = require("js-yaml");
var path = require("path");
var fs = require("fs");
var _1 = require("../");
function generateRouteName(str) {
    // underscorize + uppercase
    // from https://github.com/epeli/underscore.string/blob/master/underscored.js
    return str
        .trim()
        .replace(/([a-z\d])([A-Z]+)/g, '$1_$2')
        .replace(/[-\s]+/g, '_')
        .toUpperCase();
}
function generateTypeAliasName(str) {
    // PascalCase + append "Params"
    // from https://gist.github.com/jacks0n/e0bfb71a48c64fbbd71e5c6e956b17d7
    return str
        .match(/[a-z]+/gi)
        .map(function (word) {
        return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
    })
        .join('') + 'Params';
}
function symfonyPathToPathMask(path) {
    // /a/{param} => /a/:param
    return path.replace(/{[A-Za-z_]+}/g, function (match) {
        return ':' + match.replace(/^{/, '').replace(/}$/, '');
    });
}
var fileContents = fs.readFileSync(path.join(__dirname, './symfony_routes.yml'));
var document = yaml.safeLoad(fileContents);
var routes = [];
for (var routeName in document) {
    var route = document[routeName];
    routes.push({
        name: generateRouteName(routeName),
        typeAliasName: generateTypeAliasName(routeName),
        pathMask: symfonyPathToPathMask(route.path),
        paramPatterns: route.requirements,
        defaultParams: route.defaults,
    });
}
console.log(_1.generateAnnotatedFile(routes));
