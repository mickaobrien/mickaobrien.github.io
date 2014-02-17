module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            dist: {
                src: [
                    'js/*.js'
                ],
                dest: 'production.js'
            }
        },
        uglify: {
            build: {
                src: 'production.js',
                dest: 'production.min.js'
            }
        },
        watch: {
            scripts: {
                files: ['js/*.js', 'index.html', 'jobs.css'],
                tasks: ['concat', 'uglify'],
                options: {
                    livereload: true,
                    spawn: false
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concat', 'uglify', 'watch']);
};
