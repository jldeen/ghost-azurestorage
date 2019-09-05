const fs = require('fs')
const sharp = require('sharp')
const Promise = require('bluebird');
const sizes = require('./sizes')


module.exports = function resize(path, tmpFileResize){
  
  let transform = sharp(path)

  Promise.map(sizes, function(size) {
    
    return transform.resize( size.x ).webp().toBuffer().then( data => {
        fs.writeFileSync(tmpFileResize, data);
        
        console.log('Writing ' + tmpFileResize + ' to local store')
    })
        .catch( err => {
            console.log(err);
        })
  })
}
