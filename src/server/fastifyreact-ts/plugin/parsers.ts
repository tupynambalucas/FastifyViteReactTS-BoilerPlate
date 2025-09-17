import * as acorn from 'acorn'
import * as walk from 'acorn-walk'

export function parseStateKeys (code: string): string[] {
  const ast = acorn.parse(code, { sourceType: 'module', ecmaVersion: 2020 })

  let objectKeys: string[] = []

  walk.simple(ast, {
    ExportNamedDeclaration(node) {
        const declaration = (node as acorn.ExportNamedDeclaration).declaration
        // Add a check to ensure declaration is not null/undefined
        if (declaration) {
            if (declaration.type === 'FunctionDeclaration') {
            for (const subNode of declaration.body.body) {
                if (subNode.type === 'ReturnStatement' && subNode.argument?.type === 'ObjectExpression') {
                objectKeys = extractObjectKeys(subNode.argument)
                }
            }
            } else if (declaration.type === 'VariableDeclaration') {
            for (const subNode of declaration.declarations) {
                if (
                subNode.type === 'VariableDeclarator' &&
                subNode.init?.type === 'ArrowFunctionExpression' &&
                subNode.init.body.type === 'ObjectExpression'
                ) {
                objectKeys = extractObjectKeys(subNode.init.body)
                }
            }
            }
        }
    }
  })

  return objectKeys
}

function extractObjectKeys(node: acorn.ObjectExpression): string[] {
  const keys: string[] = []
  for (const prop of node.properties) {
    if (prop.type === 'Property') {
        const key = prop.key
        if (key.type === 'Identifier') {
            keys.push(key.name)
        }
    }
  }
  return keys
}