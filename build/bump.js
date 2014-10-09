module.exports = {
    options: {
        files: ['package.json', 'config.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json', 'config.json'],
        createTag: false,
        push: false
    }
};
