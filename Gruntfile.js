module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({

		banner: '/*! grease.js - ' +
			'<%= grunt.template.today("yyyy-mm-dd") %>\n' +
			' * Author: charliehw;' +
			' Licensed MIT */\n',

		concat: {
			options: {
				stripBanners: false
			},
			dist: {
				src: [
					'src/intro.js',

					'src/core/shape.js',
					'src/core/group.js',
					'src/core/scene.js',

					'src/shapes/rectangle.js',
					'src/shapes/arc.js',
					'src/shapes/circle.js',
					'src/shapes/line.js',
					'src/shapes/image.js',
					'src/shapes/sprite.js',
					'src/shapes/text.js',

					'src/materials/material.js',
					'src/materials/gradient.js',

					'src/events/listener.js',
					'src/events/event.js',

					'src/view/framebuffer.js',
					'src/view/canvas.js',

					'src/util/easing.js',
					'src/util/utils.js',

					'src/outro.js'
				],
				dest: 'dist/grease.js'
			},
			full: {
				src: [
					'lib/underscore.js',
					'dist/grease.js'
				],
				dest: 'dist/grease-full.js'
			}
		},

		uglify: {
			options: {
				banner: '<%= banner %>'
			},
			dist: {
				src: 'dist/grease.js',
				dest: 'dist/grease.min.js'
			},
			full: {
				src: 'dist/grease-full.js',
				dest: 'dist/grease-full.min.js'
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
				globals: {
					'define': false,
					'require': false,
					'exports': false,
					'module': false,
					'ok': false,
					'test': false,
					'grease': true,
					'asyncTest': false,
					'expect': false,
					'start': false,
					'_': false,
					'root': false,
					'doc': false,
					'math': false,
					'date': false
				}
			},
			gruntfile: {
				src: 'Gruntfile.js'
			},
			grease: {
				src: 'src/*/*.js'
			},
			tests: {
				src: 'tests/*.js'
			}
		},

		qunit: {
			all: ['tests/*.html']
		},

		clean: {
			doc: 'doc', 
			dist: 'dist'
		},

		jsdoc: {
			dist: {
				src: ['dist/grease.js'],
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
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-jsdoc');

	// Default task.
	grunt.registerTask('default', ['clean', 'jshint', 'concat', 'qunit', 'uglify', 'jsdoc']);
	grunt.registerTask('test', ['jshint', 'qunit']);
	grunt.registerTask('docs', ['clean:doc', 'jsdoc']);
	grunt.registerTask('dist', ['clean:dist', 'concat', 'uglify']);

};
