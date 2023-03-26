
const pino = require('pino')

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      customLevels: 'err:99,info:1,debug:83,warn:212,trace:50',
    }
  },
  level: 'trace'
})

module.exports = logger