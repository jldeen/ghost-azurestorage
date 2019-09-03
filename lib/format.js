const fs = require('fs')
const sharp = require('sharp')

module.exports = function format(path, tmpFileFormat) {
  let transform = sharp(path)
  transform = transform.toFormat('webp').toBuffer().then( data => {
    fs.writeFileSync(tmpFileFormat, data);
    console.log('Writing ' + tmpFileFormat + ' to local store')
  })
  .catch( err => {
    console.log(err);
  })
}
