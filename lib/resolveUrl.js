const url = require("url");
const getUrl = {
	url(options, urlValue) {
		if (!options.cdnUrl) {
			console.log('CDN not specified, urlValue is: ' + urlValue);
			return urlValue;
		} else {
			var parsedUrl = url.parse(urlValue, true, true);
			var protocol = (options.useHttps ? 'https' : 'http') + '://';
			var cdnUrl = protocol + options.cdnUrl + parsedUrl.path;
			console.log('CDN is specified, urlValue is: ' + cdnUrl);
			return cdnUrl;
		}
	}
};
module.exports = getUrl;
