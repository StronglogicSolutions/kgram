
const pino = require('pino')

let default_target  = 'pino/file'
let default_options = { colorize: false }
let level           = process.env.LOGLEVEL
if (!level)
  level = 'trace'

const transport_options = {
  targets: [
  {
    target: 'pino/file',
    options: {
      destination: '/tmp/kgram.kiq.log',
      path: `/tmp/kgram.kiq-${process.pid}.log`
    }
  }]
}

const config = { level }

if (process.env.type !== 'PRODUCTION')
  transport_options.targets.push(
    {
      target: 'pino-pretty',
      options: { colorize: true }
    })

config.transport = pino.transport(transport_options)

const logger = pino({}, config.transport)

module.exports    = logger
module.exports.lg = module.exports.logger