module.exports = {
    all: {
        files: [
            { expand: true, src: ['javascript.json'], dest: 'dist' },
            { expand: true, cwd: 'src/config/locales/', src: ['**'], dest: 'dist/config/locales/' },
            { expand: true, cwd: 'src/images/', src: ['**'], dest: 'dist/images/', },
            { expand: true, cwd: 'src/downloads/', src: ['**'], dest: 'dist/downloads/' },
            { expand: true, cwd: 'src/flash/', src: ['**'], dest: 'dist/flash/' },
            { expand: true, cwd: 'src/templates/', src: ['**'], dest: 'dist/templates/' },
            { expand: true, cwd: 'src/css/external/jquery-ui-custom-theme/images/', src: ['**'], dest: 'dist/css/images' },
            { expand: true, cwd: 'src/css/external/jquery-ui-custom-theme/', src: ['*.css'], dest: 'dist/css/' },
            { expand: true, cwd: 'src/css/fonts/', src: ['**'], dest: 'dist/css/fonts' },
            { expand: true, cwd: 'src/javascript/', src: ['**'], dest: 'dist/dev/javascript/' }
        ]
    }
};