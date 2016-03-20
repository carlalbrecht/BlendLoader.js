/**
 * @author Carl Albrecht / http://thesynapse.github.io/
 */

(function(){
"use strict"

THREE.BlendLoader = function(manager, verbose) {
  this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
  this.verbose = (verbose !== undefined) ? verbose : false;
  this.data = 0;
  this.pointerSize = 64; // Default to 64 bit pointer size, because who uses 32 bit anyway?
  this.endianness = 0;   // 0 for little endian, 1 for big endian
  this.version = "";     // Represents the version of Blender the file was made in
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
}

// Called once the XMLHttpRequest finishes, this function processes the header, then moves along
// The data argument should be of type Uint8Array, otherwise, expect bad things to happen
THREE.BlendLoader.prototype.parse = function(inData) {
  var responseView = new Uint8Array(inData);

  if (this.verbose) console.log("Checking to see if the .blend is gzipped");

  var isCompressed = !checkHeader(responseView);

  if (isCompressed) {
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

    var isActuallyBlend = checkHeader(this.data);

    if (isActuallyBlend) {
      if (this.verbose) console.log(".blend file successfully decompressed and validated");
      if (this.verbose) console.timeEnd(".blend decompression time");
    } else {
      console.error("Supplied URL was gzipped, but is not a .blend file");
      if (this.verbose) console.timeEnd(".blend decompression time");
      return false;
    }
  } else {
    this.data = responseView;
    if (this.verbose) console.log(".blend is not compressed, continuing");
  }

  if (this.data[7] == 0x5F) {
    this.pointerSize = 32; // 32 bit pointers are in use in this file
    if (this.verbose) console.log("Using 32-bit pointers");
  } else {
    this.pointerSize = 64; // Just in case I accidentally change the default...
    if (this.verbose) console.log("Using 64-bit pointers");
  }

  if (this.data[8] == 0x56) {
    this.endianness = 1;   // This file is big endian
    if (this.verbose) console.log("Values are big-endian");
  } else {
    this.endianness = 0;   // justincase
    if (this.verbose) console.log("Values are little-endian");
  }

  this.version = String.fromCharCode(this.data[9]) + "." + String.fromCharCode(this.data[10]) + "." + String.fromCharCode(this.data[11]);
  if (this.verbose) console.log("This .blend file was created in Blender " + this.version);

  // Returns true if the first 7 bytes of the supplied data spell BLENDER
  function checkHeader(data) {
    return data[0] == 0x42 &&
           data[1] == 0x4C &&
           data[2] == 0x45 &&
           data[3] == 0x4E &&
           data[4] == 0x44 &&
           data[5] == 0x45 &&
           data[6] == 0x52;
  }
}

// I dont actually know what this is used for, but I will put it here just to conform
THREE.BlendLoader.prototype.setPath = function(value) {
  this.path = value;
}
})();
