var BlendLoader = {
  load: function(URL) {
    var xhttp = new XMLHttpRequest()
    xhttp.open("GET", URL, true);
    xhttp.responseType = "arraybuffer";

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        var response = xhttp.response;
        window.responseView = new Uint8Array(response);

        console.log("Checking to see if the .blend is gzipped");

        var isCompressed = !BlendLoader.checkHeader(responseView);

        if (isCompressed) {
          console.log(".blend is compressed, now decompressing");

          var gunzip = new Zlib.Gunzip(responseView);
          window.data = gunzip.decompress();

          console.log(".blend file successfully decompressed");
        } else {
          window.data = responseView;
          
          console.log(".blend is not compressed, continuing");
        }
      } else {
        console.log(".blend loader XHTTP status: " + xhttp.readyState + ", " + xhttp.status);
      }
    }

    xhttp.send();
  },

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
