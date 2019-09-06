const fs = require("fs");
const sharp = require("sharp");
const sizes = require("./sizes");

module.exports = function resize(path, tmpFileResize) {
// const imageName = image.replace(/\.[^/.]+$/, "");
  sizes.forEach(size => {
    sharp(path)
      .resize(size.x)
      .toFormat('webp')
      .toFile(`${tmpFileResize}`);
      // .toFile(`${imageName}-w${size.x}.webp`);
  });

  console.log("Successfully completed image resize for: " + size.x);
}