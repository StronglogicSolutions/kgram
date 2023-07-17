
const fs = require('fs')
const pino = require('pino')
const transport = require('pino/lib/transport')

const streams = [
  {level: 'info',  stream: fs.createWriteStream(`/tmp/kgram.kiq.log`, {})},
  {level: 'error', stream: fs.createWriteStream(`/tmp/kgram_err.kiq.log`, {})}
]

let level = process.env.LOGLEVEL
if (!level)
  level = 'trace'

const transport_options = {
  targets: [
  {
    level,
    target: 'pino/file',
    options: {
      destination: '/tmp/kgram.kiq.log',
      path: `/tmp/kgram.kiq-${process.pid}.log`
    }
  },
  {
    level,
    target: 'pino/file',
    options: {}
  }]
}

const config = { level }

if (process.env.type !== 'PRODUCTION')
{
  transport_options.targets[1].target              = 'pino-pretty'
  transport_options.targets[1].options.colorize    = true
  transport_options.targets[1].options.destination = 1
}

config.transport = transport_options;//pino.transport(transport_options)

const logger = pino(config, streams)

module.exports    = logger
module.exports.lg = module.exports.logger