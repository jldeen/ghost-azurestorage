const azure = require('azure-storage');

class FileService {
  constructor(options, image) {
    //create azure storage blob connection
    this.fileService = azure.createBlobService(options.connectionString);
    this.image = image.path;
    this.containerName = options.container
  }

  createContainer(containerName) {
    return new Promise((resolve, reject) => {
      fileService.createContainerIfNotExists(containerName, { publicAccessLevel: 'blob' }, error => {
        if (error) {
          console.log(error);
          reject(error);
        }
        else {
          this.containerName = containerName;
          console.log(`Created the container or already existed. Container: ${containerName}`);
          resolve(containerName);
        }
      });
    });
  }

  createBlob(containerName, blobName, image, config) {
    return new Promise((resolve, reject) => {
      fileService.createBlockBlobFromLocalFile(containerName, blobName, image.path, config, 
        function (error) {
          if (error) {
            console.log(error);
            reject(error.message);
          }
          else {
            console.log('Uploaded blob name: ' + blobName + ',' + ' local image filename is: ' + this.image.path);
            resolve(blobName);
          }
      });
    });
  }
  
  getBlob(blobName) {
    return fileService.getUrl(this.containerName, blobName);
  }
}

module.exports = FileService;
