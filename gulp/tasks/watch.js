var runSequence = require('run-sequence');
var gulp = require('gulp');

var config = require('../config');
var env = require('../util/env');

gulp.task('watch', function(cb) {
    gulp.watch(config.less.src, ['less']);

    env.debug = true;

    runSequence('build', cb);
});
