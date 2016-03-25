/*
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
  
  success = this.readFileBlocks();
  if (!success) { this.cleanup(); return false; }

  success = this.parseSDNA(responseView);
  if (!success) { this.cleanup(); return false; }

  return true;
};

// Called by parse to verify the file and get file header information
THREE.BlendLoader.prototype.parseHeader = function(responseView) {
  if (this.verbose) console.log("Checking to see if the .blend is gzipped");

  this.compressed = !checkHeader(responseView);

  // If the file is compressed, we decompress it here
  if (this.compressed) {
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
  this.version = String.fromCharCode(this.data[9]) + "." + String.fromCharCode(this.data[10]) + String.fromCharCode(this.data[11]);
  if (this.verbose) console.log("This .blend file was created in Blender " + this.version);

  // Fake us "moving the pointer around" as we read, because lazyness
  this.filePointer = 12;

  return true;
};

// Called by parse to read in all of the file blocks into separate objects
THREE.BlendLoader.prototype.readFileBlocks = function() {
  while (this.filePointer < this.data.length) {
    // Obtain new header and fill out with specified block data
    var header = this.blockHeader();
    header.data = this.data.slice(this.filePointer, header.count * header.size);
    
    // Add the block to the list
    this.fileBlocks.push(header);
    
    // Increment file pointer to end of current block
    this.filePointer += header.count * header.size;
  }

  if (this.verbose) { console.log("Processed " + this.fileBlocks.length + " file blocks"); }

  return true;
};

// Called by parse to process the Structure DNA records
THREE.BlendLoader.prototype.parseSDNA = function() {
  return true;
};

// Reads the header of a file block to get the valuable info inside
THREE.BlendLoader.prototype.blockHeader = function() {
  return {
    code: this.bReadString(4),
    size: this.bReadUInt(this.endianness),
    oldAddress: this.bReadNumString(this.pointerSize / 8, this.endianness),
    SDNAIndex: this.bReadUInt(this.endianness),
    count: this.bReadUInt(this.endianness)
  };
};

// The following functions return the input bytes converted to a
// Javascript type with respect to endianness. They each take
// a clearly defined number of bytes as input.

THREE.BlendLoader.prototype.bReadUInt = function(endianness) {
  var oldPointer = this.filePointer;
  this.filePointer += 4;

  if (endianness) { // Big Endian
    return ((this.data[oldPointer] << 24) >>> 0) +
            (this.data[oldPointer + 1] << 16) +
            (this.data[oldPointer + 2] << 8) +
             this.data[oldPointer + 3];
  } else { // Little Endian
    return ((this.data[oldPointer + 3] << 24) >>> 0) +
            (this.data[oldPointer + 2] << 16) +
            (this.data[oldPointer + 1] << 8) +
             this.data[oldPointer];
  }
};

THREE.BlendLoader.prototype.bReadInt = function(b1, b2, b3, b4, endianness) {
  if (endianness) {
    return (b1 << 24) + (b2 << 16) + (b3 << 8) + b4; // Big endian
  } else {
    return (b4 << 24) + (b3 << 16) + (b2 << 8) + b1; // Little endian
  }
};

THREE.BlendLoader.prototype.bReadUShort = function(b1, b2, endianness) {
  if (endianness) {
    return (b1 << 8) + b2; // Big endian
  } else {
    return (b2 << 8) + b1; // Little endian
  }
};

// I really *really* feel like this function could be rewritten better.
THREE.BlendLoader.prototype.bReadShort = function(b1, b2, endianness) {
  var ret = 0;

  if (endianness) {
    ret = (b1 << 8) + b2; // Big endian
  } else {
    ret = (b2 << 8) + b1; // Little endian
  }

  // Calculate whether or not to make number negative
  var negative = ret >> 7;

  // Remove sign bit
  ret &= ~(1 << 15);

  // Make number negative as determined above
  if (negative) ret = -ret;

  return ret;
};

THREE.BlendLoader.prototype.bReadString = function(chars) {
  var _return = "";

  for (var i=0; i < chars; i++) {
    _return += String.fromCharCode(this.data[this.filePointer]);
    this.filePointer++;
  }

  return _return;
};

THREE.BlendLoader.prototype.bReadNumString = function(bytes, endianness) {
  var _return = "";

  if (endianness) {
    for (var i=0; i < bytes; i++) {
      _return += this.data[this.filePointer + i].toString(16);
    }
  } else {
    for (var j=bytes-1; j >= 0; j--) { // Have to use J to satisfy JSHint
      _return += this.data[this.filePointer + j].toString(16);
    }
  }

  this.filePointer += bytes;
  return _return;
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

// Returns the input number with its endianness flipped. i.e. little endian -> big endian
function switchEndian(val) {
    return ((val & 0xFF) << 24)
           | ((val & 0xFF00) << 8)
           | ((val >> 8) & 0xFF00)
           | ((val >> 24) & 0xFF);
}
})();
