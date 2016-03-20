BlendLoader.js
==============
Currently in development, BlendLoader.js aims to be as fully functional as possible a .blend loader for three.js, allowing complex models, or even entire scenes with complicated materials to be loaded instantly.

FWIW, Usage
-----------
Efforts are taken wherever possible to keep the BlendLoader interface consistent with other three.js model loader libraries.

#### HTML
```html
<script type="text/javascript" src="dependencies/gunzip.min.js"></script>
<script type="text/javascript" src="BlendLoader.js"></script>
```

#### Javascript
```javascript
var loader = new THREE.BlendLoader(manager, verbose);
loader.load(url, onLoad, onProgress, onError);
```
##### Constructor args
`manager` is a [THREE.LoadingManager](http://threejs.org/docs/#Reference/Loaders/LoadingManager), and can be left undefined to use `THREE.DefaultLoadingManager`. `verbose` is as you would expect, a boolean that, when true, prints detailed information about the loading process.

No arguments are required to instantiate `THREE.BlendLoader`, meaning that it is perfectly fine to do 
```javascript
var loader = new THREE.BlendLoader;
```

##### BlendLoader.load args
`url` is a relative URL pointing to the location of the .blend file. `onLoad` is a function, called when the file has finished loading and processing. `onProgress` is a function, called incrementally, providing the `XMLHttpRequest` instance with `.loaded` and `.total` bytes functions available. `onError` is a function that is called if the loader encounters an error at any stage of the loading process.

You only have to provide the URL parameter for `loader.load` to work properly. All other arguments are optional. You can then access raw data provided once the loader has finished processing the data (takes a few seconds, because Javascript really doesn't like working with heavyweight binary files sometimes) through the loader instance, providing that you don't start loading another file first.

#### Preemptive FAQ
##### What if I dont want to supply an argument, but I want to supply the argument after it?
See [this StackOverflow answer](http://stackoverflow.com/a/8356945) for details.
