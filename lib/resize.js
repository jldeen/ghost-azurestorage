const fs = require('fs')
const sharp = require('sharp')
const Promise = require('bluebird');
const sizes = require('./sizes')

module.exports = function format(path, imageName, tmpFileResize){
  
  let transform = sharp(path)

  Promise.map(sizes, function(size) {

    const tmpFileResize = "/tmp/" + imageName + "-w" + sizes.x + ".webp";

    return transform.resize( size.x ).webp().toBuffer().then( data => {
        fs.writeFileSync(tmpFileResize, data);
        
        console.log('Writing ' + tmpFileResize + ' to local store')
    })
        .catch( err => {
            console.log(err);
        })
  })
}




// const fs = require('fs')
// const sharp = require('sharp')
// const Promise = require('bluebird');
// const sizes = require('./sizes')

// module.exports = function resize(path, tmpFileResize, thenData, consoleData) {
//   let transform = sharp(path)

//   Promise.map(sizes, function(size) {
//     return transform
//       .resize( size.x )
//       .webp()
//       .toBuffer()
//       .then( data => {
//         thenData
//         consoleData
//     })
//       .catch( err => {
//           console.log(err);
//       })
//   })
// }
