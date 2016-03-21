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

THREE.BlendLoader.prototype = new THREE.Loader();
THREE.BlendLoader.prototype.constructor = THREE.BlendLoader;

// Conventional function that serves as the general interface for loading .blend files
THREE.BlendLoader.prototype.load = function(url, onLoad, onProgress, onError) {
  var scope = this;

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
})();
