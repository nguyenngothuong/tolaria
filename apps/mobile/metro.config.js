const path = require('node:path')
const { getDefaultConfig } = require('expo/metro-config')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')
const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'isomorphic-git') {
    return {
      filePath: path.resolve(workspaceRoot, 'node_modules/isomorphic-git/index.js'),
      type: 'sourceFile',
    }
  }

  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
