const { createLogger, format, transports } = require('winston');

const isProd = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: isProd ? 'warn' : 'debug',
  format: isProd
    ? format.combine(format.timestamp(), format.json())
    : format.combine(format.colorize(), format.simple()),
  transports: [new transports.Console()],
});

module.exports = logger;
