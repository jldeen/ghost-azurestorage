"use strict";

const BaseStorage = require("ghost-storage-base");
const Promise = require("bluebird");
const request = require("request");
const url = require("url");
const date = require("./lib/getDate")
const format = require("./lib/format");
const sizes = require("./lib/sizes");
const resize = require("./lib/resize");
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
        cacheControl: "public, max-age=2592000"
      }
    };

    // remove original ext & set .webp format extension
    const imageName = image.name.replace(/\.[^/.]+$/, "");

    // Appends the dated folder if enabled
    if (options.useDatedFolder) {   
      var blobName ="images/original/" + date.useDate() + image.path;
      var blobNameFormat = "images/" + date.useDate() + imageName + ".webp";
    } 
    else {
      var blobName = "images/original/" + image.name;
      var blobNameFormat = "images/" + imageName + ".webp";
    }
    
    if (image.path.indexOf('_processed') < 0) {
      console.log("Image upload detected")
    } else {
      return new Promise(async (resolve, reject) => {
        // make sure the container exists
        await fileService.createContainer(options.container);
  
        // upload original image
        await fileService.createBlob(options.container, blobName, image.path, config);
  
        // resize images
        for (let size of sizes) {
          // const tmpImageName = image.path.replace(/\.[^/.]+$/, "")
          const tmpFileResize = "/tmp/" + imageName + "-w" + size.x + ".webp";
          
          if (options.useDatedFolder) {
            var blobNameResize = "images/size/" + sizes.x + "/" + date.useDate() + imageName + ".webp";
          } 
          else {
            var blobNameResize = "images/size/" + size.x + "/" + imageName + ".webp";
          }
          await resize(image.path, tmpFileResize);
  
          //upload resized images
          await fileService.createBlob(options.container, blobNameResize, tmpFileResize, config);
        }
  
        // set .webp format extension
        const tmpFileFormat = "/tmp/" + imageName + "_formatted" + ".webp";
        // change format of image to .webp
        await format(image.path, tmpFileFormat);
  
        // upload the optimized image
        await fileService.createBlob(options.container, blobNameFormat, tmpFileFormat, config);
  
        const urlValue = fileService.getBlob(blobNameFormat);
  
        if (!options.cdnUrl) {
          console.log("CDN not specified, urlValue is: " + urlValue);
          resolve(urlValue);
        }
        else {
          var parsedUrl = url.parse(urlValue, true, true);
          var protocol = (options.useHttps ? "https" : "http") + "://";
          var cdnUrl = protocol + options.cdnUrl + parsedUrl.path;
          console.log("CDN is specified, urlValue is: " + cdnUrl);
          resolve(cdnUrl);
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
