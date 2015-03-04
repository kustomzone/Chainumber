var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var gulpif = require('gulp-if');
var less = require('gulp-less');
var gulp = require('gulp');

var config = require('../config');
var env = require('../util/env');

gulp.task('less', function() {
    return gulp.src(config.less.src)
        .pipe(gulpif(env.debug, sourcemaps.init()))
        .pipe(concat(config.less.name))
        .pipe(less())
        .pipe(gulpif(env.debug, sourcemaps.write('./')))
        .pipe(gulp.dest(config.less.dist));
});
