var gulp = require('gulp'),
    gutil = require('gulp-util'),
    sass = require('gulp-ruby-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    clean = require('gulp-clean'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    lr = require('tiny-lr'),
    server = lr(),
    jshint = require('gulp-jshint');

gulp.task('styles', function () {
return gulp.src('assets/styles/main.scss')
	.pipe(sass({ style: 'compressed' }))
	.pipe(autoprefixer('last 2 version', 'ie 8', 'ie 9'))
	.pipe(gulp.dest('dist/css/'))
	.pipe(rename({suffix: '.min'}))
	.pipe(minifycss())
	.pipe(gulp.dest('dist/css/'))
	.pipe(livereload(server))
	.pipe(notify({ message: 'styles task complete'}));
});

gulp.task('scripts', function() {
  return gulp.src('assets/scripts/*.js')
  	.pipe(jshint())
  	.pipe(jshint.reporter('default'))
    .pipe(gulp.dest('./dist/js'))
    .pipe(concat('main.js'))
    .pipe(gulp.dest('dist/js'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'))
    .pipe(livereload(server))
    .pipe(notify({ message: 'Scripts task complete' }));
});

gulp.task('images', function() {
  return gulp.src('assets/img/**/*')
    .pipe(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true }))
    .pipe(gulp.dest('dist/img'))
    .pipe(livereload(server))
    .pipe(notify({ message: 'Images task complete' }));
});

gulp.task('clean', function() {
	return gulp.src(['dist/css', 'dist/js', 'dist/img'], {read: false})
		.pipe(clean());
})

gulp.task('default', ['clean'], function(){
  gulp.start('styles', 'scripts', 'images');
});

gulp.task('watch', function() {

    server.listen(35729, function(err) {
        if (err) {
            return console.log(err)
        }

        gulp.watch('assets/styles/**/*.scss', ['styles']);
        gulp.watch('assets/scripts/**/*.js', ['scripts']);
        gulp.watch('assets/img/**/*', ['images']);

    });

});