const fs = require('fs')
const sharp = require('sharp')
const Promise = require('bluebird');
const sizes = require('./sizes')

function resize () {
  Promise.map(sizes, function(size) {
    
    return transform.resize( size.x ).webp().toBuffer().then( data => {
        fs.writeFileSync(tmpFileResize, data);
        
        console.log('Writing ' + blobNameResize + ' to local store')
    })
        .catch( err => {
            console.log(err);
        })
  })
}

module.exports = resize;
