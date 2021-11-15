const CracoLessPlugin = require('craco-less');

module.exports = {
    plugins: [
        {
            plugin: CracoLessPlugin,
            options: {
                lessLoaderOptions: {
                    lessOptions: {
                        modifyVars: {
                            //'@primary-color': '#F50057',
                            //'@primary-color': '#00BFA6',
                            '@primary-color': '#F9A826',
                            '@layout-header-height': '50px',
                        },
                        javascriptEnabled: true,
                    },
                },
            },
        },
    ],
};
