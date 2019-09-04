'use strict';

const BaseStorage = require("ghost-storage-base");
const Promise = require("bluebird");
const request = require("request");
const azure = require('azure-storage');
const url = require('url');
const sharp = require('sharp');
const fs = require('fs');
const format = require('./lib/format');
const resize = require('./lib/resize')
const sizes = require('./lib/sizes');

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
    var fileService = azure.createBlobService(options.connectionString);

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
    //basic upload
    return new Promise(function (resolve, reject) {
      fileService.createContainerIfNotExists(options.container, { publicAccessLevel: 'blob' }, function (error) {
        if (error)
          console.log(error);
        else {
          console.log('Created the container or already existed. Container:' + options.container);
            fileService.createBlockBlobFromLocalFile(options.container, blobName, image.path, config, 
            function (error) {
            if (error) {
              console.log(error);
              reject(error.message);
            }
            else {
              var urlValue = fileService.getUrl(options.container, blobName);

              console.log('Uploaded blob name: ' + blobName + ',' + ' local image filename is: ' + image.path);

              if (!options.cdnUrl) {
                resolve(urlValue);

                console.log('CDN not specified, urlValue is: ' + urlValue);
              }

              var parsedUrl = url.parse(urlValue, true, true);
              var protocol = (options.useHttps ? "https" : "http") + "://";

              var cdnUrl = protocol + options.cdnUrl + parsedUrl.path
              resolve(cdnUrl);

              console.log('CDN is specified, urlValue is: ' + cdnUrl);
            }
          });

          // set webp variables
          var imageName = image.name.replace(/\.[^/.]+$/, "")
          var tmpFileFormat = "/tmp/" + imageName + "_formatted" + ".webp";
          var blobNameFormat = "images/optimized/" + imageName + ".webp";

          // format image
          format(image.path, tmpFileFormat)
          // fileService.createBlockBlobFromLocalFile(options.container, blobNameFormat, tmpFileFormat, config, 
          //   function (error) {
          //     if (error) {
          //       console.log(error);
          //       reject(error.message);
          //     }
          //   })

          // resize images 300, 600, 900, 1300
          Promise.map(sizes, function(size){
            var tmpFileResize = "/tmp/" + imageName + "-w" + size.x + ".webp";
            resize(image.path, tmpFileResize)
          })
        }
      });
    });
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
