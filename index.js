'use strict';

const BaseStorage = require("ghost-storage-base");
const Promise = require("bluebird");
const request = require("request");
const azure = require('azure-storage');
const url = require('url');
const sharp = require('sharp');
const fs = require('fs');
const format = require('./lib/format');
const sizes = require('./lib/sizes');
const resize = require('./lib/resize')
const FileService = require('./fileService');

var options = {};

//AzureStorageAdapter config
class AzureStorageAdapter extends BaseStorage {
  constructor(config) {
    super();

    options = config || {};
    options.connectionString = options.connectionString || process.env.AZURE_STORAGE_CONNECTION_STRING;
    options.container = options.container || 'content';
    options.useHttps = options.useHttps == 'true';
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

    let config = {
        contentSettings: { 
        contentType: image.type, 
        cacheControl: 'public, max-age=2592000' 
        } 
    }

    // Appends the dated folder if enabled
    if (options.useDatedFolder) {
      let date = new Date();
      var blobName = "images" + "/" + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + date.getHours() + date.getMinutes() + "_" + image.name;
    }
    else {
      var blobName = "images" + "/" + image.name;
    }

    // set webp variables
    const imageName = image.name.replace(/\.[^/.]+$/, "")
    const tmpFileFormat = "/tmp/" + imageName + "_formatted" + ".webp";
    const blobNameFormat = "images/optimized/" + imageName + ".webp";
    // create a container if it doesn't exist

    // upload unmodified image
    // format image for modified
      // upload modified image
    // resize image
      // upload resized image

    return new Promise(function (resolve, reject) {
      // upload unmodified
      fileService.createContainer(options.container)
        .then(() => {
          // got the container, create the blob
          //unmodified upload
          fileService.createBlob(blobName, config);
          
          //formatted image
          format(image.path, tmpFileFormat)

          fileService.createBlob(blobNameFormat, config)
            .then(() => {
              //return url to ghost
              const urlValue = fileService.getBlob(blobNameFormat);

              if (!options.cdnUrl) {
                console.log('CDN not specified, urlValue is: ' + urlValue);
                resolve(urlValue);
              }

              var parsedUrl = url.parse(urlValue, true, true);
              var protocol = (options.useHttps ? "https" : "http") + "://";
              var cdnUrl = protocol + options.cdnUrl + parsedUrl.path
              console.log('CDN is specified, urlValue is: ' + cdnUrl);
              resolve(cdnUrl);
            });
          
          //resize image
          const tmpFileResize = "/tmp/" + imageName + "-w" + sizes.x + ".webp";
          const blobNameResize = "images/sizes/" + sizes.x + "/" + imageName + ".webp"
          
          resize(image.path, tmpFileResize)
          fileService.createBlob(blobNameResize, config)

        })
      })
      .catch(
        console.log(error)
      )
  }

  serve() {
    return function customServe(req, res, next) {
      next();
    }
  }

  delete() {
  
  }

  read(options) {
    return new Promise(function (resolve, reject) {
      var requestSettings = {
        method: 'GET',
        url: options.path,
        encoding: null
      };

      request(requestSettings, function (error, response, body) {
        // Use body as a binary Buffer
        if (error)
          return reject(new Error("Cannot download image" + " " + options.path));
        else
          resolve(body);
      });
    })
  }
}

module.exports = AzureStorageAdapter;
