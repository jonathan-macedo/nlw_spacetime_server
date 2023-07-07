import { randomUUID } from 'node:crypto'
import { extname, resolve } from 'node:path'
import { FastifyInstance } from 'fastify'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream'
import { promisify } from 'node:util'

const pump = promisify(pipeline)

export async function uploandRoutes(app: FastifyInstance) {
  app.post('/uploand', async (request, reply) => {
    const uploand = await request.file({
      limits: {
        fieldSize: 5_242_880,
      },
    })

    if (!uploand) {
      return reply.status(400).send()
    }

    const mimeTypeRegex = /^(image|video)\/[a-zA-Z]^/
    const isValidFileFormat = mimeTypeRegex.test(uploand.mimetype)

    if (!isValidFileFormat) {
      return reply.status(400).send()
    }
    const fileId = randomUUID()
    const extension = extname(uploand.filename)

    const fileName = fileId.concat(extension)

    const writeStream = createWriteStream(
      resolve(__dirname, '../../uploads/', fileName),
    )

    const fullUrl = request.protocol.concat('://').concat(request.hostname)
    const fileUrl = new URL(`/uploads/${fileName}`, fullUrl).toString()

    await pump(uploand.file, writeStream)

    return { fileUrl }
  })
}
