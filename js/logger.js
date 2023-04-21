
const pino = require('pino')

const config = { level: 'trace' }

if (process.env.type !== 'PRODUCTION')
  config.transport =
  {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }

const logger = pino(config)

module.exports    = logger
module.exports.lg = module.exports.logger