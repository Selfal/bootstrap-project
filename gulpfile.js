"use strict";

// Плагины в сборке, заюзать npm install, чтобы скачать все зависимости
var gulp = require('gulp'),
    sass = require('gulp-sass'),
    rigger = require('gulp-rigger'),
    uglify = require('gulp-uglify'),
    plumber = require('gulp-plumber'),
    webserver = require('browser-sync').create(),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    cleanCSS = require('gulp-clean-css'),
    cache = require('gulp-cache'),
    rigger = require('gulp-rigger'),
    rimraf = require('gulp-rimraf'),
    rename = require('gulp-rename'),
    svgSprite = require('gulp-svg-sprite'),
    svgmin = require('gulp-svgmin'),
    cheerio = require('gulp-cheerio'),
    replace = require('gulp-replace'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant');


// Пути к основным директориям
var path = {
    build: {    //Путь к сборке
        html: 'assets/build/',
        js: 'assets/build/js/',
        css: 'assets/build/css/',
        img: 'assets/build/img/',
        fonts: 'assets/build/fonts/',
        svg: 'assets/build/sprite/'
    },
    src: {  // Путь к исходникам
        html: 'assets/src/*.html',
        js: 'assets/src/js/main.js',
        style: 'assets/src/style/main.scss',
        img: 'assets/src/img/**/*.*',
        fonts: 'assets/src/fonts/**/*.*',
        svg: 'assets/src/svg/**/*.svg'
    },
    watch: {    // Отслеживание
        html: 'assets/src/**/*.html',
        js: 'assets/src/js/**/*.js',
        css: 'assets/src/**/*.scss',
        img: 'assets/src/img/**/*.*',
        fonts: 'assets/src/fonts/**/*.*',
        svg: 'assets/src/svg/**/*.svg'
    },
    clean: './assets/build/*'   // Путь для пересборки
};

// Конфигурация сервера
var config = {
    server: {
        baseDir: './assets/build'
    },
    notify: false,
    port: 3000,
    open: true
};


// ЗАДАЧИ

// Веб-сервер
gulp.task('webserver', function (done) {
    webserver.init(config);
    done();
});

// Сборка HTML
gulp.task('html:build', function (done) {
    gulp.src(path.src.html) // Выборка HTML
        .pipe(plumber()) // Слежение за ошибками
        .pipe(rigger()) // ctrl+c ctrl+v
        .pipe(gulp.dest(path.build.html)) // Пуш в build
        webserver.reload(); // Перезагрузка сервера
    done();
});

// Сборка CSS
gulp.task('css:build', function (done) {
    gulp.src(path.src.style) // Получение scss
        .pipe(plumber()) // Слежение за ошибками
        .pipe(sourcemaps.init()) // Sourcemap
        .pipe(sass()) // scss to css
        .pipe(autoprefixer({ // Автопрефиксер
            overrideBrowserslist: ['last 2 versions']
        }))
        .pipe(gulp.dest(path.build.css))    // Запись цельного css
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(cleanCSS()) // .min.css
        .pipe(sourcemaps.write('./')) // запись Sourcemap
        .pipe(gulp.dest(path.build.css)) // Запись в build
        webserver.reload(); // Перезагрузка сервера
    done();
});

// Сборка JS
gulp.task('js:build', function (done) {
    gulp.src(path.src.js) // Поиск основного файла
        .pipe(rigger()) // Прогоним через rigger
        .pipe(sourcemaps.init()) // Создание sourcemap
        .pipe(uglify()) // Сжатие js
        .pipe(sourcemaps.write()) // Запись sourcemap
        .pipe(gulp.dest(path.build.js)) // Пуш в build
        webserver.reload(); // Перезагрузка сервера
    done();
});

// Обработка SVG
gulp.task('svg:build', function (done) {
    gulp.src(path.src.svg)
        // Минифицирование SVG
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        // Чистка от мусора
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
                $('[stroke]').removeAttr('stroke');
                $('[style]').removeAttr('style');
            },
            parserOptions: { xmlMode: true }
        }))
        // Фикс бага
        .pipe(replace('&gt;', '>'))
        // Сборка спрайта
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: "../sprite.svg",
                    render: {
                        scss: {
                            dest: './assets/src/style/_sprite.scss',
                            template: "./assets/src/style/_sprite_template.scss"
                        }
                    }
                }
            }
        }))
        .pipe(gulp.dest(path.build.svg));
    done();
});

// Сжатие изображений
gulp.task('img:build', function (done) {
    gulp.src(path.src.img) // Путь к картинкам
        .pipe(imagemin({ // Обработка при помощи pngquant
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img)) // Пуш в сборку
    done();
});

// Пуш шрифтов
gulp.task('fonts:build', function (done) {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
    done();
});

// Очистка кэша
gulp.task('cache:clear', function (done) {
    cache.clearAll();
    done();
});

// Удаление каталога build (пусть останется, если надо подчистить кучу картинок из сборки)
gulp.task('clean:build', function () {
    return gulp.src(path.clean, {
            read: false
        })
        .pipe(rimraf());
});


// Сборка
gulp.task('build',
    gulp.series('clean:build',
        gulp.parallel(
            'html:build',
            'css:build',
            'js:build',
            'svg:build',
            'fonts:build',
            'img:build',
        )
    )
);

// Запуск задач при изменении файлов
gulp.task('watch', function () {
    gulp.watch(path.watch.html, gulp.series('cache:clear', 'html:build'));
    gulp.watch(path.watch.css, gulp.series('cache:clear', 'css:build'));
    gulp.watch(path.watch.js, gulp.series('cache:clear', 'js:build'));
    gulp.watch(path.watch.svg, gulp.series('cache:clear', 'svg:build'));
    gulp.watch(path.watch.fonts, gulp.series('cache:clear', 'fonts:build'));
    gulp.watch(path.watch.img, gulp.series('cache:clear', 'img:build'));
});

// Задача по умолчанию
gulp.task('default', gulp.series(
    'build',
    gulp.parallel('webserver', 'watch')
));