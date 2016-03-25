module("Basic Tests");

test("Uncompressed .blend", function(assert) {
  var done = assert.async();
  var loader = new THREE.BlendLoader;
  
  loader.load("cubeUncompressed.blend", function(ldr){
    assert.ok(!loader.compressed, ".blend identified as uncompressed");
    assert.ok(typeof loader.data === "object", "Loader initialised data array");
    assert.ok(loader.data.length > 0, "Loader properly loaded data into array");
    assert.ok(loader.valid, "Loader successfully read the header fingerprint");
    assert.ok(typeof loader.fileBlocks === "object" && loader.fileBlocks.length > 0, "Loader read file blocks");
    done()
  });
});

test("Compressed .blend", function(assert) {
  var done = assert.async();
  var loader = new THREE.BlendLoader;

  loader.load("cubeCompressed.blend", function(ldr){
    assert.ok(loader.compressed, ".blend identified as compressed");
    assert.ok(typeof loader.data === "object", "Loader initialised data array");
    assert.ok(loader.data.length > 0, "Loader properly loaded data into array");
    assert.ok(loader.valid, "Loader successfully read the header fingerprint");
    assert.ok(typeof loader.fileBlocks === "object" && loader.fileBlocks.length > 0, "Loader read file blocks");
    done();
  });
});
