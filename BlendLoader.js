var BlendLoader = {
  load: function(URL) {
    var xhttp = new XMLHttpRequest()
    xhttp.open("GET", URL, true);
    xhttp.responseType = "arraybuffer";

    xhttp.onreadystatechange = function() {
      if (xhttp.readyState == 4 && xhttp.status == 200) {
        var response = xhttp.response;
        var responseView = new Uint8Array(response);

        console.log("Now decompressing gzipped .blend");

        var gunzip = new Zlib.Gunzip(responseView);
        window.data = gunzip.decompress();

        console.log(".blend file successfully loaded and decompressed");
      } else {
        console.log(".blend loader XHTTP status: " + xhttp.readyState + ", " + xhttp.status);
      }
    }

    xhttp.send();
  }
}
