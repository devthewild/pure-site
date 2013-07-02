var fs = require('fs');
var path = require('path');
var child = require('child_process');
var app = require('./app');
var dst = process.argv[2] || '../pure-site-html';
var request = require('request');
var pages = app.locals.pages;
var prefix = process.argv.length > 3 ? process.argv[3] : 'pure-site';

if( prefix && prefix.indexOf('/') !== prefix.length-1 ) 
  prefix = prefix + '/';

/**
 * create server to get rendered page.
 */
var http = require('http');
var server = http.createServer(app).listen(app.locals.settings.port, function () {
});

/**
 * from node-mkdirp
 * @sa https://github.com/substack/node-mkdirp  
 */
function mkdir(p) {
    p = path.resolve(p);

    try {
        fs.mkdirSync(p, '0755');
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                mkdir(path.dirname(p));
                mkdir(p);
                break;
            default:
                var stat;
                try { stat = fs.statSync(p); }
                catch (err1) { throw err0; }

                if (!stat.isDirectory()) throw err0;
                break;
        }
    }
};

if( !fs.existsSync(dst) )
  mkdir(dst);

// for debugging
pages = { 
  home: '/',
  base: '/base/',
  grids: '/grids/',
  forms: '/forms/',
  buttons: '/buttons/',
  tables: '/tables/',
  menus: '/menus/',
  customize: '/customize/',
  extend: '/extend/',
  layouts: '/layouts/',
  updates: '/updates/',
  layoutsGallery: '/layouts/gallery/',
  layoutsMarketing: '/layouts/marketing/',
  layoutsEmail: '/layouts/email/' };

var regexp = {};
var file = {};
for( var name in pages ) {
  var link = pages[name];
  if( link === '/' )
    file[name] = link + 'index.html';
  else
    file[name] = link.substring(0, link.length-1) + '.html';
  regexp[name] = new RegExp('"' + link + '"', 'g');
}

var host = 'http://localhost:' + app.locals.settings.port;
var timeout = null;
for( var name in pages ) {
  (function(name) {
    request(host + pages[name], function(err, res, body) {
      for( var n in pages )
        body = body.replace(regexp[n], '"' + file[n] + '"');
      body.replace( /"\//g, '"/' + prefix);

      var splitted = pages[name].split('/');
      if( splitted.length > 3 ) {
        splitted.pop(); splitted.pop();
        mkdir(dst + splitted.join('/'));
      }
      fs.writeFileSync(dst + file[name], body);
      console.log( 'Completed to write ' + (dst + file[name]) + ' ' + (body.length/8) + 'bytes');
			if(timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			timeout = setTimeout( function(){ server.close(); }, 1000 );
    });
  })(name);
}

var src = './public';
(function cp(dir) {
  var files = fs.readdirSync(src+dir);
  for( var i=0 ; i<files.length ; i++ ) {
    var file = files[i];
    if( !file.indexOf('.') ) continue;
    if( fs.statSync(src+dir+file).isDirectory() ) {
      if( !fs.existsSync(dst+'/'+dir+file) )
        fs.mkdirSync(dst+'/'+dir+file, '0755');
      cp(dir+file+'/');
    } else {
      var buff = fs.readFileSync(src+dir+file);
      fs.writeFileSync(dst+'/'+dir+file, buff);
      console.log('Completed to copy ' + src+dir+file);
    }
  }
})('/');
