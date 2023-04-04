
const pino = require('pino')

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  },
  level: 'trace'
})

module.exports    = logger
module.exports.lg = module.exports.logger