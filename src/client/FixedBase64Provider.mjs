const base64 = function (formio){
return {
    title: 'OmniTool Base64',
    name: 'b64-fixed-storage-provider',

    uploadFile(file, fileName) {
      const reader = new FileReader();
  
      return new Promise((resolve, reject) => {
        reader.onload = (event) => {
        
          const url = event.target.result;
          resolve({
            storage: 'b64-fixed-storage-provider',
        
            name: fileName,
            url: url,
            size: file.size,
            type: file.type,
          });
        };
  
        reader.onerror = (e) => {
          console.error(e)
          return reject(this);
        };
  
        reader.readAsDataURL(file);
      });
    },
    downloadFile(file) {
      // Return the original as there is nothing to do.
      return Promise.resolve(file);
    }
  }
}
  
  base64.title = 'Omnitool Base64';
  export default base64;