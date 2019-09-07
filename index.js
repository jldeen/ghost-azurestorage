"use strict";

const BaseStorage = require("ghost-storage-base");
const Promise = require("bluebird");
const request = require("request");
const date = require("./lib/getDate")
const sizes = require("./lib/sizes");
const resize = require("./lib/resize");
const getUrl = require("./lib/resolveUrl")
const FileService = require("./lib/fileService");

var options = {};

//AzureStorageAdapter config
class AzureStorageAdapter extends BaseStorage {
  constructor(config) {
    super();

    options = config || {};
    options.connectionString =
    options.connectionString || process.env.AZURE_STORAGE_CONNECTION_STRING;
    options.container = options.container || "content";
    options.useHttps = options.useHttps == "true";
    options.useDatedFolder = options.useDatedFolder || false;
    options.cacheControl = options.cacheControl || "2592000";
  }

  exists(filename) {
    console.log(filename);

    return request(filename)
      .then(res => res.statusCode === 200)
      .catch(() => false);
  }

  save(image) {
    //create azure storage blob connection
    var fileService = new FileService(options, image);

    // set image config
    let config = {
      contentSettings: {
        contentType: image.type,
        cacheControl: "public, max-age=" + options.cacheControl
      }
    };

    // remove original ext & set .webp format extension
    const imageName = image.name.replace(/\.[^/.]+$/, "");

    // Appends the dated folder if enabled
    if (options.useDatedFolder) {   
      var blobName ="images/" + date.useDate() + image.name;
    } 
    else {
      var blobName = "images/" + image.name;
    }
    
    if (image.path.indexOf('_processed') < 0) {
      console.log("Image upload detected")
    } else {
      return new Promise(async (resolve, reject) => {
        // make sure the container exists
        await fileService.createContainer(options.container);

        // upload original image
        await fileService.createBlob(options.container, blobName, image.path, config);

        // resolve/return url for/to Ghost
        const urlValue = fileService.getBlob(blobName);
        resolve(getUrl.url(options, urlValue));

        // resize images
        await resize(image.path, image.ext);

        // set vars for resize upload
        for (let size of sizes) {
          const tmpResizeName = image.path.replace(/\.[^/.]+$/, "");

          const tmpFileResize = `${tmpResizeName}-w${size.x}${image.ext}`;

          if (options.useDatedFolder) {
            var blobNameResize = "images/size/" + size.x + "/" + date.useDate() + imageName + image.ext;
          } 
          else {
            var blobNameResize = "images/size/" + size.x + "/" + imageName + image.ext;
          }

          //upload resized images
          await fileService.createBlob(options.container, blobNameResize, tmpFileResize, config);
        }
      });
    }
  }

  serve() {
    return function customServe(req, res, next) {
      next();
    };
  }

  delete() {}

  read(options) {
    return new Promise(function(resolve, reject) {
      var requestSettings = {
        method: "GET",
        url: options.path,
        encoding: null
      };

      request(requestSettings, function(error, response, body) {
        // Use body as a binary Buffer
        if (error)
          return reject(
            new Error("Cannot download image" + " " + options.path)
          );
        else resolve(body);
      });
    });
  }
}

module.exports = AzureStorageAdapter;
