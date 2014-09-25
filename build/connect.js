module.exports = function(grunt) {
    return {
        github: {
            options: {
                hostname: '127.0.0.1',
                port: 443,
                protocol: 'https',
                base: 'dist',
                keepalive: true
            }
        },
        dev: {
            options: {
                hostname: '*',
                port: 443,
                protocol: 'https',
                base: 'dist',
                keepalive: true,
                key: grunt.file.read('src/certificates/key/devbin.io.key').toString(),
                cert: grunt.file.read('src/certificates/crt/devbin.io.crt').toString()
            }
        }
    }
};
