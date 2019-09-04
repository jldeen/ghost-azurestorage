const sharp = require('sharp')

module.exports = function format(path, tmpFileFormat) {
  let transform = sharp(path)
  return transform.toFormat('webp').toBuffer()
}
