var gulp = require('gulp');
var babel = require('gulp-babel');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('babel', function() {
  return gulp.src('./src/magic2.es6')
    .pipe(babel())
    .pipe(gulp.dest('./'))
});

gulp.task('uglify', ['babel'], function() {
  return gulp.src('./magic2.js')
    .pipe(uglify())
    .pipe(rename('./magic2-min.js'))
    .pipe(gulp.dest('.'));
});

gulp.task('watch', function() {
  gulp.watch('./src/magic2.es6', ['babel']);
  gulp.watch('./magic2.js', ['uglify']);
});

gulp.task('default', ['babel', 'uglify', 'watch']);
