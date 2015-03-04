var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var watchify = require('watchify');
var util = require('gulp-util');
var pipe = require('multipipe');
var gulpif = require('gulp-if');
var gulp = require('gulp');

var config = require('../config');
var env = require('../util/env');

gulp.task('js', function() {
    var bundler = browserify(config.js.src, {
        debug: env.debug,
        entry: true
    });

    function bundle() {
        return bundler.bundle()
            .on('error', util.log.bind(util, 'Browserify Error'))
            .pipe(source(config.js.name))
            .pipe(buffer())
            .pipe(gulpif(env.debug,
                pipe(
                    sourcemaps.init({loadMaps: true}),
                    sourcemaps.write()
                ),
                uglify())
            )
            .pipe(gulp.dest(config.js.dist));
    }

    if (env.debug) {
        bundler = watchify(bundler);
        bundler.on('update', bundle);
        bundler.on('time', function(time) {
            util.log('App rebundled in ' + time + ' ms');
        });
    }

    return bundle();
});
