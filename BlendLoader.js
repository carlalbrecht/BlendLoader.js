/**
 * @author Carl Albrecht / http://thesynapse.github.io/
 */

(function(){

THREE.BlendLoader = function(manager) {
  this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
  this.data = 0;
}

THREE.BlendLoader.prototype = new THREE.Loader();
THREE.BlendLoader.prototype.constructor = THREE.BlendLoader;

// Conventional function that serves as the general interface for loading .blend files
THREE.BlendLoader.prototype.load = function(url, onLoad, onProgress, onError) {
  var scope = this;

  var loader = new THREE.XHRLoader(scope.manager);
  loader.setResponseType("arraybuffer");
  loader.setPath(this.path);
  loader.load(url, function(data) {
    var result = scope.parse(data)
    if (typeof onLoad == "function")
      onLoad(result);
  }, onProgress, onError);

  /*var xhttp = new XMLHttpRequest()
  xhttp.open("GET", url, true);
  xhttp.responseType = "arraybuffer";

  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      scope.parse(xhttp.response);
    } else if (xhttp.readyState == 4) {
      console.error(".blend loader XHTTP status: " + xhttp.readyState + ", " + xhttp.status);
      return false;
    }
  }

  xhttp.send();*/
}

// Called once the XMLHttpRequest finishes doing its thing
// The data argument should be of type Uint8Array, otherwise, expect bad things to happen
THREE.BlendLoader.prototype.parse = function(inData) {
  var responseView = new Uint8Array(inData);

  console.log("Checking to see if the .blend is gzipped");

  var isCompressed = !checkHeader(responseView);

  if (isCompressed) {
    console.log(".blend is compressed, now decompressing");

    try {
      console.time(".blend decompression");
      var gunzip = new Zlib.Gunzip(responseView);
      this.data = gunzip.decompress();
    } catch (err) {
      console.warn("Supplied URL is either malformed or is not a .blend file");
      console.timeEnd(".blend decompression");
      console.error(err);
      return false;
    }

    var isActuallyBlend = checkHeader(this.data);

    if (isActuallyBlend) {
      console.log(".blend file successfully decompressed and validated");
      console.timeEnd(".blend decompression");
    } else {
      console.warn("Supplied URL was gzipped, but is not a .blend file");
      console.timeEnd(".blend decompression");
      return false;
    }
  } else {
    this.data = responseView;
    console.log(".blend is not compressed, continuing");
  }

  // Returns true if the first 7 bytes of the supplied data spell BLENDER
  function checkHeader(data) {
    return data[0] == 66 &&
           data[1] == 76 &&
           data[2] == 69 &&
           data[3] == 78 &&
           data[4] == 68 &&
           data[5] == 69 &&
           data[6] == 82;
  }
}

// I dont actually know what this is used for, but I will put it here just to conform
THREE.BlendLoader.prototype.setPath = function(value) {
  this.path = value;
}
})();
