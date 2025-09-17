import  fp from 'fastify-plugin'

const loggerConfig = (server) => {
    if (process.argv.includes('--dev')) {
        console.log('Running on Dev mode')
        return {
            logger: {
                transport: {
                    target: '@fastify/one-line-logger',
                }
            }
        }
    } else {
        return {logger: false}
    }
}

export const logger = fp(loggerConfig)