module.exports = function (grunt) {
    // load all grunt tasks matching the `grunt-*` pattern
    require('load-grunt-tasks')(grunt);

    var files = ['src/*.js'];

    grunt.initConfig({
        jshint: {
            files: files,
            options: {
                jshintrc: './.jshintrc'
            }
        },
        jscs: {
            files: {
                src: files
            },
            options: {
                config: '.jscsrc',
                esnext: true
            }
        },
        babel: {
            dist: {
                files: {
                    'dist/emotion.js': 'src/emotion.js',
                    'dist/face.js': 'src/face.js',
                    'dist/oxford.js': 'src/oxford.js',
                    'dist/video.js': 'src/video.js',
                    'dist/vision.js': 'src/vision.js',
                }
            }
        },
        clean: ['./test/output/*']
    });

    grunt.registerTask('compile', 'babel');
    grunt.registerTask('test', ['clean', 'jshint', 'jscs']);
    grunt.registerTask('default', ['test', 'compile']);
};
