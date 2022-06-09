const webpack = require("webpack");

module.exports = {
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    assert: require.resolve("assert"),
                    url: require.resolve("url"),
                    http: require.resolve("stream-http"),
                    stream: require.resolve("stream-browserify"),
                    crypto: require.resolve("crypto-browserify"),
                    https: require.resolve("https-browserify"),
                    os: require.resolve("os-browserify"),
                    buffer: require.resolve("buffer"),
                },
            },
            plugins: [
                new webpack.ProvidePlugin({
                    Buffer: ["buffer", "Buffer"],
                    process: "process/browser",
                }),
            ],
        },
    },
};