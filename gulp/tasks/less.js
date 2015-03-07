var autoprefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var minifyCSS = require('gulp-minify-css');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var less = require('gulp-less');
var gulp = require('gulp');

var config = require('../config');
var env = require('../util/env');

gulp.task('less', function() {
    return gulp.src(config.less.src)
        .pipe(gulpif(env.debug, sourcemaps.init()))
        .pipe(less())
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(concat(config.less.name))
        .pipe(gulpif(env.debug, sourcemaps.write()))
        .pipe(gulpif(!env.debug, minifyCSS()))
        .pipe(gulp.dest(config.less.dist));
});
