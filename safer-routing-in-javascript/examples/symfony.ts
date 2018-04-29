import * as yaml from 'js-yaml';
import * as path from 'path';
import * as fs from 'fs';
import { generateAnnotatedFile } from '../';

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
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
    })
    .join('') + 'Params';
}

function symfonyPathToPathMask(path) {
  // /a/{param} => /a/:param
  return path.replace(/{[A-Za-z_]+}/g, (match) => {
    return ':' + match.replace(/^{/, '').replace(/}$/, '');
  });
}

const fileContents = fs.readFileSync(path.join(__dirname, './symfony_routes.yml'));
const document = yaml.safeLoad(fileContents);
const routes = [];

for (const routeName in document) {
  const route = document[routeName];

  routes.push({
    name: generateRouteName(routeName),
    typeAliasName: generateTypeAliasName(routeName),
    pathMask: symfonyPathToPathMask(route.path),
    paramPatterns: route.requirements,
    defaultParams: route.defaults,
  });
}

console.log(generateAnnotatedFile(routes));
