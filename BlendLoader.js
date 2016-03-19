/**
 * @author Carl Albrecht / http://thesynapse.github.io/
 */

(function(){

THREE.BlendLoader = function() {

}

THREE.BlendLoader.prototype = new THREE.Loader();
THREE.BlendLoader.prototype.constructor = THREE.BlendLoader;

THREE.BlendLoader.prototype.load = function(url, onLoad, onProgress, onError) {
  // Get the .blend from the supplied URL
  var xhttp = new XMLHttpRequest()
  xhttp.open("GET", url, true);
  xhttp.responseType = "arraybuffer";

  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      parseReturnData(xhttp.response);
    } else {
      console.warn(".blend loader XHTTP status: " + xhttp.readyState + ", " + xhttp.status);
    }
  }

  xhttp.send();

  // Called once the XMLHttpRequest finishes doing its thing
  function parseReturnData(response) {
    window.responseView = new Uint8Array(response);

    console.log("Checking to see if the .blend is gzipped");

    var isCompressed = !checkHeader(responseView);

    if (isCompressed) {
      console.log(".blend is compressed, now decompressing");

      try {
        console.time(".blend decompression");
        var gunzip = new Zlib.Gunzip(responseView);
        window.data = gunzip.decompress();
      } catch (err) {
        console.warn("Supplied URL is either malformed or is not a .blend file");
        console.timeEnd(".blend decompression");
        console.error(err);
        return false;
      }

      var isActuallyBlend = checkHeader(data);

      if (isActuallyBlend) {
        console.log(".blend file successfully decompressed");
        console.timeEnd(".blend decompression");
      } else {
        console.warn("Supplied URL was gzipped, but is not a .blend file");
        console.timeEnd(".blend decompression");
        return false;
      }
    } else {
      window.data = responseView;

      console.log(".blend is not compressed, continuing");
    }
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

})();
