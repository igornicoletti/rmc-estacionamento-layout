'use strict';

const utils = require('./utils');

module.exports = (ast, options = {}) => {
  const stringify = (node, parent = {}, level = 0) => {
    if (level > 100) throw new RangeError('Brace AST nesting exceeds 100 levels');
    const invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
    const invalidNode = node.invalid === true && options.escapeInvalid === true;
    let output = '';

    if (node.value) {
      if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
        return '\\' + node.value;
      }
      return node.value;
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes) {
      for (const child of node.nodes) {
        output += stringify(child, {}, level + 1);
      }
    }
    return output;
  };

  return stringify(ast);
};
