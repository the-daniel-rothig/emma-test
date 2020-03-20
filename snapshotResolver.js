module.exports = {
  resolveSnapshotPath: (testPath, snapshotExtension) =>
  testPath
  .replace(/.test.([tj]sx?)/, '.test' + snapshotExtension)
  .replace('build', '__snapshots__'),
  
  resolveTestPath: (snapshotFilePath, snapshotExtension) =>
  snapshotFilePath.replace(snapshotExtension, '.js').replace('__snapshots__', 'build'),
  
  testPathForConsistencyCheck: 'build/some.test.js',
  }