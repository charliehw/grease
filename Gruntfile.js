/* global module */
module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({

		banner: '/*! grease.js - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			' * Author: charliehw;' +
			' Licensed MIT */\n',

		concat: {
			options: {
				banner: '<%= banner %>',
				stripBanners: true
			},
			dist: {
				src: ['lib/<%= pkg.name %>.js'],
				dest: 'dist/<%= pkg.name %>.js'
			}
		},

		uglify: {
			options: {
				banner: '<%= banner %>'
			},
			dist: {
				src: 'grease.js',
				dest: 'grease.min.js'
			}
		},

		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				unused: true,
				boss: true,
				eqnull: true,
				browser: true,
				globals: {}
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			grease: {
				src: ['grease.js']
			},
			tests: {
				src: 'tests/*.js'
			}
		},

		qunit: {
			all: ['tests/*.html']
		},

		clean: ['doc'],

		jsdoc: {
			dist: {
				src: ['grease.js'],
				options: {
					destination: 'doc'
				}
			}
		}

	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-qunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-jsdoc');

	// Default task.
	grunt.registerTask('default', ['jshint', 'qunit', 'uglify', 'clean', 'jsdoc']);
	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('docs', ['clean', 'jsdoc']);
	grunt.registerTask('dist', ['uglify']);

};
