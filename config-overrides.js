module.exports = function override(config) {
    // Add rule to handle .cjs files
    config.module.rules.push({
        test: /\.cjs$/,
        type: 'javascript/auto',
    });

    return config;
};
