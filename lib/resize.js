const sharp = require('sharp');
const sizes = require('./sizes');

module.exports = function resize(path, ext) {
	const imageName = path.replace(/\.[^/.]+$/, '');
	const canTransformFileExtension = (ext) => ![ '.gif', '.svg', '.svgz', '.ico' ].includes(ext);

	if (!canTransformFileExtension(ext)) {
		console.log('Detected unsupported image type for resize: ' + ext);
		return false;
	} else {
		sizes.forEach((size) => {
			sharp(path).resize({ width: size.x }).toFile(`${imageName}-w${size.x}${ext}`);
    });
    console.log('Successfully completed image resize');
    return true
  }
};
