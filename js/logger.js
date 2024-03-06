
const fs = require('fs')
const pino = require('pino')
const transport = require('pino/lib/transport')


let level = process.env.LOGLEVEL
if (!level)
level = 'trace'

const target  = 'pino/file'
const path    = `/tmp/kgram.kiq-${process.pid}.log`
const streams = [ { level,  stream: fs.createWriteStream(path, {}) } ]
const transport_options = {
  targets: [
  {
    level,
    target,
    options: { destination: path }
  },
  {
    level,
    target,
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

config.transport = transport_options;

const logger = pino(config, streams)

module.exports    = logger
module.exports.lg = module.exports.logger