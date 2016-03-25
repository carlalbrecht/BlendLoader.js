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

// Wrap each fix in a separate self-calling function to eliminate problems with globals

// Add support for TypedArray.prototype.slice in older-than-latest chrome builds
(function(){
"use strict";

var variants = ["Int8Array", "Uint8Array", "Uint8ClampedArray",
                "Int16Array", "Uint16Array", "Int32Array",
                "Uint32Array", "Float32Array", "Float64Array"];

for (var i=0; i<variants.length; i++) {
  doVariant(variants[i]); // Darn jshint tellin me not to create functions inside a loop, I'll show it.
}

function doVariant(variant) {
  if (typeof window[variant].prototype.slice !== "function") {
    window[variant].prototype.slice = function(begin, end) {
      // Handle unspecified end argument
      end = (typeof end !== "undefined") ? end : this.length;

      var i, cloned = [], size, len = this.length;

      // Handle negative value for begin
      var start = begin || 0;
      start = (start >= 0) ? start : Math.max(0, len + start);

      // Handle negative value for end
      var upTo = (typeof end == "number") ? Math.min(end, len) : len;
      if (end < 0) upTo = len + end;

      // Actual expected size of the slice
      size = upTo - start;

      // Process the slicing
      if (size > 0) {
        cloned = new this.constructor(size);
        if (this.charAt) {
          for (i = 0; i < size; i++) {
            cloned[i] = this.charAt(start + i);
          }
        } else {
          for (i = 0; i < size; i++) {
            cloned[i] = this[start + i];
          }
        }
      }

      return cloned;
    };
  }
}
})();