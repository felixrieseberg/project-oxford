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
                    'dist/text.js': 'src/text.js',
                    'dist/video.js': 'src/video.js',
                    'dist/vision.js': 'src/vision.js',
                    'dist/weblm.js': 'src/weblm.js',
                }
            }
        },
        clean: ['./test/output/*'],
        jsdoc2md: {
	    oneOutputFile: {
		src: 'dist/*js',
		dest: 'api.md'
	    },
	    withOptions: {
	    }
	}
    });

    grunt.loadNpmTasks('grunt-jsdoc-to-markdown');
    grunt.registerTask('compile', 'babel');
    grunt.registerTask('test', ['clean', 'jshint', 'jscs']);
    grunt.registerTask('default', ['test', 'compile']);
    grunt.registerTask('doc','jsdoc2md');
};
