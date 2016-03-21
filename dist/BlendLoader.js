/*!
The MIT License (MIT)
Copyright (c) 2016 Carl Albrecht

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function(){
"use strict";

/*
 * This file simply serves as an entry point for most common functions, and
 * only really implements small functions that can't be categorised within
 * their own files.
 */

// Constructor, sets up a few instance variables for us
THREE.BlendLoader = function(manager, verbose) {
  this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
  this.verbose = (verbose !== undefined) ? verbose : false;
  this.data = 0;
  this.pointerSize = 64;   // Default to 64 bit pointer size, because who uses 32 bit anyway?
  this.endianness = 0;     // 0 for little endian, 1 for big endian
  this.version = "";       // Represents the version of Blender the file was made in
  this.compressed = false; // Is set to true if we encounter a compressed file
  this.valid = false;      // Set to true if the checkHeader function returns true
};

// We extend THREE classes wherever possible to make our lives easier
THREE.BlendLoader.prototype = new THREE.Loader();
THREE.BlendLoader.prototype.constructor = THREE.BlendLoader;

// Conventional function that serves as the general interface for loading .blend files
THREE.BlendLoader.prototype.load = function(url, onLoad, onProgress, onError) {
  var scope = this;

  // THREE superclass that mostly handles function callbacks for us
  var loader = new THREE.XHRLoader(scope.manager);
  loader.setResponseType("arraybuffer");
  loader.setPath(this.path);

  loader.load(url, function(data) {
    var result = scope.parse(data);  // See parse.js

    if (typeof onLoad == "function")
      onLoad(result); // Call callback function if it exists
  }, onProgress, onError);
};

// I dont actually know what this is used for, but I will put it here just to conform
THREE.BlendLoader.prototype.setPath = function(value) {
  this.path = value;
};

// If we encountered an error while parsing, we shall clean up our variables,
// because these Uint8Arrays can use quite an amount of RAM.
THREE.BlendLoader.prototype.cleanup = function() {
  this.data = 0;
  this.pointerSize = 64;
  this.endianness = 0;
  this.version = "";
  this.compressed = false;
  this.valid = false;
};
})();
;/*
The MIT License (MIT)
Copyright (c) 2016 Carl Albrecht

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function(){
"use strict";

THREE.BlendLoader.constants = {
  header: {
    pointerSize32: 0x5F,
    pointerSize64: 0x2D,
    littleEndian: 0x76,
    bigEndian: 0x56,
    b: 0x42,
    l: 0x4C,
    e: 0x45,
    n: 0x4E,
    d: 0x44,
    r: 0x52
  }
};
})();;/*
The MIT License (MIT)
Copyright (c) 2016 Carl Albrecht

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
(function(){
"use strict";

// This function is called when the file is loaded to offload file parsing.
// The data argument should be of type Uint8Array, otherwise, expect bad things to happen
THREE.BlendLoader.prototype.parse = function(inData) {
  var responseView = new Uint8Array(inData);

  // Each of these parsing subprocesses return true if they sucessfully
  // Parsed their section, otherwise they return false.
  var success = this.parseHeader(responseView);
  if (!success) { this.cleanup(); return false; }
  
  success = this.parseSDNA(responseView);
  if (!success) { this.cleanup(); return false; }

  return true;
};

// Called by parse to verify the file and get file header information
THREE.BlendLoader.prototype.parseHeader = function(responseView) {
  if (this.verbose) console.log("Checking to see if the .blend is gzipped");

  self.compressed = !checkHeader(responseView);

  // If the file is compressed, we decompress it here
  if (self.compressed) {
    if (this.verbose) console.log(".blend is either invalid or compressed, attempting decompression");

    try {
      if (this.verbose) console.time(".blend decompression time");
      var gunzip = new Zlib.Gunzip(responseView);
      this.data = gunzip.decompress();
    } catch (err) {
      console.error("Supplied URL is either malformed or is not a .blend file");
      if (this.verbose) console.timeEnd(".blend decompression time");
      console.error(err);
      return false;
    }

    this.valid = checkHeader(this.data);

    if (this.valid) {
      if (this.verbose) console.log(".blend file successfully decompressed and validated");
      if (this.verbose) console.timeEnd(".blend decompression time");
    } else {
      console.error("Supplied URL was gzipped, but is not a .blend file");
      if (this.verbose) console.timeEnd(".blend decompression time");
      return false;
    }
  // If the file isn't compressed, we just carry on
  } else {
    this.data = responseView;
    this.valid = true; // We know this is valid because of the compression check above
    if (this.verbose) console.log(".blend is not compressed, continuing");
  }

  // Parse file pointer size
  if (this.data[7] == THREE.BlendLoader.constants.header.pointerSize32) {
    this.pointerSize = 32;
    if (this.verbose) console.log("Using 32-bit pointers");
  } else if (this.data[7] == THREE.BlendLoader.constants.header.pointerSize64) {
    this.pointerSize = 64;
    if (this.verbose) console.log("Using 64-bit pointers");
  } else {
    console.error("Parser encountered corrupt bit 7, terminating further parsing.");
    return false;
  }

  // Parse file endianness
  if (this.data[8] == THREE.BlendLoader.constants.header.bigEndian) {
    this.endianness = 1;
    if (this.verbose) console.log("Values are big-endian");
  } else if (this.data[8] == THREE.BlendLoader.constants.header.littleEndian) {
    this.endianness = 0;
    if (this.verbose) console.log("Values are little-endian");
  } else {
    console.error("Parser encountered corrupt bit 8, terminating further parsing.");
    return false;
  }

  // Obtain version of Blender the file was made in
  this.version = String.fromCharCode(this.data[9]) + "." + String.fromCharCode(this.data[10]) + "." + String.fromCharCode(this.data[11]);
  if (this.verbose) console.log("This .blend file was created in Blender " + this.version);

  return true;
};

// Called by parse to process the Structured DNA records
THREE.BlendLoader.prototype.parseSDNA = function(responseView) {
  return true;
};

// Returns true if the first 7 bytes of the supplied data spell BLENDER
function checkHeader(data) {
  return data[0] == THREE.BlendLoader.constants.header.b &&
         data[1] == THREE.BlendLoader.constants.header.l &&
         data[2] == THREE.BlendLoader.constants.header.e &&
         data[3] == THREE.BlendLoader.constants.header.n &&
         data[4] == THREE.BlendLoader.constants.header.d &&
         data[5] == THREE.BlendLoader.constants.header.e &&
         data[6] == THREE.BlendLoader.constants.header.r;
}
})();

//# sourceMappingURL=BlendLoader.js.map