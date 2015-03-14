var gulp       = require('gulp');
var gutil      = require('gulp-util');
var browserify = require('gulp-browserify');
var connect    = require('gulp-connect');

gulp.task('js', function () {
  return gulp.src("js/main.js")
    .pipe(browserify().on('error', gutil.log))
    .pipe(gulp.dest('./public'));
});

gulp.task('sass', function () {
  return gulp.src('styles/*.scss')
    .pipe(sass())
    .pipe(gulp.dest('./public'));
});

gulp.task('default', function() {
  gulp.watch('js/*.js', ['js']);
  connect.server({
    root: 'public',
    port: 9929
  });
});