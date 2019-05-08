module.exports = function (grunt) {

    grunt.initConfig({
    	pkg: grunt.file.readJSON('package.json'),
            'sass': {
                production: {
                    files: {               
                        "html-build/assets/styles.css": "html-dev/styles.scss"
                    }
                }
            },
            'babel': {
                target: {
                    files: {
                        "html-build/assets/scripts.js": ["html-dev/scripts-dev.js"]
                    }
                }
            },
            'watch': {
                sass: {
                    files: ["html-dev/styles.scss"],
                    tasks: ["sass"],
                    options: {
                        spawn: false,
                        livereload: true
                    }
                },
                js: {
                    files: ["html-dev/scripts-dev.js"],
                    tasks: ["babel"],
                    options: {
                        spawn: false,
                        livereload: false
                    }
                }
            },
            'browserSync': {
                dev: {
                    files: {
                        src : [
                            'html-dev/*.js',
                            'html-dev/*.scss'
                        ]
                    },
                    options: {
                        watchTask: true,
                        server: ["html-build/", "html-build/assets/"]
                    }
                }
            }
  	});

    // Load Plugins
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browser-sync');

    // Register Tasks
    grunt.registerTask('default', ['browserSync', 'watch']);
};
