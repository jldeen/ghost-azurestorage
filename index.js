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
        }, 
        function (error) {
        if (error) {
            console.log(error);
            reject(error.message);
        }
      }
    }

    return new Promise(function (resolve, reject) {
      //create container if not exist
      fileService.createContainerIfNotExists(options.container, { publicAccessLevel: 'blob' }, function (error) {
        if (error)
          console.log(error);
        else {
          console.log('Created the container or already existed. Container: ' + options.container);
            Promise.map(sizes, function(size) {
              // remove extension, prep for webp format
              var imageName = image.name.replace(/\.[^/.]+$/, "")

               // Appends the dated folder if enabled
              if (options.useDatedFolder) {
                let date = new Date();

                var blobName = "images" + "/" + date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate() + date.getHours() + date.getMinutes() + "_" + imageName;
              }
              // dated folder set to false
              else {
                // var blobName = "images" + "/" + image.name;
                var blobName = "images" + "/size/" + 'w'+ size.x + "/" + imageName + ".webp";
              } 
                // console.log(image)

                //raw image
                var rawFile = image.path;
                var blobNameRaw = "images" + "/" + "raw" + "/" + image.name;;

                // console.log("Your raw image path is: " + rawFile)

                  // upload image
                  fileService.createBlockBlobFromLocalFile(options.container, blobNameRaw, rawFile, { 
                  contentSettings: { 
                  contentType: image.type, 
                  cacheControl: 'public, max-age=2592000' 
                  } 
              }, 
                  function (error) {
                  if (error) {
                      console.log(error);
                      reject(error.message);
                  }
                  else {
                    // upload successful, get upload url
                    var urlValue = fileService.getUrl(options.container, blobNameRaw);

                    console.log('Uploaded blob name: ' + blobNameRaw + ',' + ' local image path is: ' + image.path);

                    // no cdn, get azure storage url only
                    if (!options.cdnUrl) {
                    resolve(urlValue);

                    console.log('CDN not specified, urlValue is: ' + urlValue);
                    }

                    //cdn url, get cdn url
                    var parsedUrl = url.parse(urlValue, true, true);
                    var protocol = (options.useHttps ? "https" : "http") + "://";
                    var cdnUrl = protocol + options.cdnUrl + parsedUrl.path
                    resolve(cdnUrl);

                    console.log('CDN is specified, urlValue is: ' + cdnUrl);
                  }
                });
              }
          ); 
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

module.exports = options;
module.exports = AzureStorageAdapter;
