// Craco lets us override Create React App without ejecting 
// Needed to deal with this: https://github.com/kintz09/sass-loader-bug/commits/master
module.exports = {
  style: {
    sass: {
      loaderOptions: {
        // See https://github.com/webpack-contrib/sass-loader/issues/804
        webpackImporter: false,
        // Prefer Dart Sass ('sass') over 'node-sass' if both are installed
        implementation: require('sass'),
        // Telling Sass Loader where to find node_modules. Required on linux to compile successfully.
        sassOptions: {includePaths: ['node_modules'] }
      }
    }
  }
}
