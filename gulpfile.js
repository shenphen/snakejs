var gulp = require('gulp');
var browserSync = require('browser-sync');
var jshint = require('gulp-jshint');

gulp.task('snake-js', function(){
	gulp.src('snake.js')
	.pipe(jshint())
	.pipe(jshint.reporter('jshint-stylish'))
	.pipe(browserSync.reload({
		stream: true
	}))
})

gulp.task('browserSync', function(){
	browserSync({
		server: {
			baseDir:'./',
		},
		port: 6666

	})
})

gulp.task('watch', ['browserSync', 'snake-js'], function(){
	gulp.watch('snake.js', ['snake-js']);
	gulp.watch(['index.html', 'styles.css'], browserSync.reload);
})

