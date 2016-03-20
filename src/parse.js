(function(){
"use strict";

// Called once the XMLHttpRequest finishes, this function processes the header, then moves along
// The data argument should be of type Uint8Array, otherwise, expect bad things to happen
THREE.BlendLoader.prototype.parse = function(inData) {
  var responseView = new Uint8Array(inData);

  this.parseHeader(responseView);
};

THREE.BlendLoader.prototype.parseHeader = function(responseView) {
  if (this.verbose) console.log("Checking to see if the .blend is gzipped");

  self.compressed = !checkHeader(responseView);

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
  } else {
    this.data = responseView;
    this.valid = true; // We know this is valid because of the compression check above
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
};

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
})();
