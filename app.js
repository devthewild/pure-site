var combo   = require('combohandler'),
    express = require('express'),
    exphbs  = require('express3-handlebars'),
    path    = require('path'),
    state   = require('express-state'),

    config     = require('./config'),
    hbs        = require('./lib/hbs'),
    middleware = require('./lib/middleware'),
    routes     = require('./lib/routes'),

    app = express();

// -- Config -------------------------------------------------------------------

app.set('name', 'Pure');
app.set('env', config.env);
app.set('port', config.port);
app.enable('strict routing');

app.engine(hbs.extname, hbs.engine);
app.set('view engine', hbs.extname);
app.set('views', config.dirs.views);

app.expose(config.yui.config, 'YUI_config');

app.locals({
    site          : 'Pure',
    copyright_year: '2013',

    version     : config.version,
    pure_version: config.pure.version,
    yui_version : config.yui.version,

    nav  : [],
    pages: {},

    isDevelopment: config.isDevelopment,
    isProduction : config.isProduction,
    isPureLocal  : !!config.pure.local,

    min: config.isProduction ? '-min' : '',

    modules  : config.pure.modules,
    filesizes: config.pure.filesizes,

    ga     : config.isProduction && config.ga,
    typekit: config.typekit
});

// -- Middleware ---------------------------------------------------------------

if (config.isDevelopment) {
    app.use(express.logger('tiny'));
}

app.use(express.compress());
app.use(express.favicon(path.join(config.dirs.pub, 'favicon.ico')));
app.use(app.router);
app.use(middleware.slash);

if (config.pure.local) {
    console.log('Serving Pure from:', config.pure.local);
    app.use('/css/pure/', express.static(config.pure.local));
}

app.use(express.static(config.dirs.pub));
app.use(middleware.notfound);

if (config.isDevelopment) {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack     : true
    }));
} else {
    app.use(middleware.error);
}

// -- Routes -------------------------------------------------------------------

function routePage(id, path, label, callbacks) {
    if (typeof label !== 'string') {
        callbacks = label;
        label     = null;
    }

    var navItem;

    app.get(path, callbacks);

    app.locals.pages[id] = path;

    if (label) {
        navItem = {id: id, url: path, label: label};

        if (id === 'customize') {
            navItem.divider = true;
        }

        app.locals.nav.push(navItem);
    }
}

routePage('home',      '/',                        routes.render('home'));
routePage('base',      '/base/',      '기초',      routes.render('base'));
routePage('grids',     '/grids/',     '그리드',     routes.render('grids'));
routePage('forms',     '/forms/',     '폼',     routes.render('forms'));
routePage('buttons',   '/buttons/',   '버튼',   routes.render('buttons'));
routePage('tables',    '/tables/',    '테이블',    routes.render('tables'));
routePage('menus',     '/menus/',     '메뉴',     routes.render('menus'));
routePage('customize', '/customize/', '커스텀하기', routes.render('customize'));
routePage('extend',    '/extend/',    '확장하기',    routes.render('extend'));
routePage('layouts',   '/layouts/',   '레이아웃들',   routes.render('layouts'));
routePage('updates',   '/updates/',   '업데이트',   routes.render('updates'));

routePage('layoutsGallery',   '/layouts/gallery/',   routes.render('layouts/gallery', 'blank'));
routePage('layoutsMarketing', '/layouts/marketing/', routes.render('layouts/marketing', 'blank'));
routePage('layoutsEmail',     '/layouts/email/',     routes.render('layouts/email', 'blank'));
routePage('layoutsBlog',      '/layouts/blog/',      routes.render('layouts/blog', 'blank'));

app.get('/combo/:version', [
    combo.combine({rootPath: config.dirs.pub}),
    combo.respond
]);

// -- Exports ------------------------------------------------------------------
module.exports = app;
