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
                    'dist/face.js': 'src/face.js',
                    'dist/vision.js': 'src/vision.js',
                    'dist/oxford.js': 'src/oxford.js',
                }
            }
        }
    });

    grunt.registerTask('compile', 'babel');
    grunt.registerTask('test', ['jshint', 'jscs']);
    grunt.registerTask('default', ['test', 'compile']);
};
