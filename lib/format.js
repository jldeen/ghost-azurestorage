const fs = require('fs')
const sharp = require('sharp')

module.exports = function format(path, tmpFileFormat) {
  return new Promise((resolve, reject) => {
    let transform = sharp(path)
    transform.toFormat('webp').toBuffer().then(data => {
      fs.writeFileSync(tmpFileFormat, data);
      console.log('Writing ' + tmpFileFormat + ' to local store');
      resolve(tmpFileFormat);
    })
    .catch( err => {
      console.log(err);
      reject(err);
    });
  });
}
