var BlendLoader = {
  load: function(URL) {
    var xhttp = new XMLHttpRequest()
    xhttp.open("GET", URL, true);
    xhttp.responseType = "arraybuffer";

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        BlendLoader.parseReturnData(xhttp.response);
      } else {
        console.log(".blend loader XHTTP status: " + xhttp.readyState + ", " + xhttp.status);
      }
    }

    xhttp.send();
  },

  parseReturnData: function(response) {
    window.responseView = new Uint8Array(response);

    console.log("Checking to see if the .blend is gzipped");

    var isCompressed = !BlendLoader.checkHeader(responseView);

    if (isCompressed) {
      console.log(".blend is compressed, now decompressing");

      try {
        var gunzip = new Zlib.Gunzip(responseView);
        window.data = gunzip.decompress();
      } catch (err) {
        console.warn("Supplied URL is either malformed or is not a .blend file");
        console.error(err);
        return false;
      }

      var isActuallyBlend = BlendLoader.checkHeader(data);

      if (isActuallyBlend) {
        console.log(".blend file successfully decompressed");
      } else {
        console.warn("Supplied URL was gzipped, but is not a .blend file");
        return false;
      }
    } else {
      window.data = responseView;

      console.log(".blend is not compressed, continuing");
    }
  }

  // Returns true if the header is a valid .blend header, false otherwise
  checkHeader: function(data) {
    return data[0] == 66 &&
           data[1] == 76 &&
           data[2] == 69 &&
           data[3] == 78 &&
           data[4] == 68 &&
           data[5] == 69 &&
           data[6] == 82;
  }
}
