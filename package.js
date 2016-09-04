Package.describe({
  name: 'kristjanhall:ddpsniffer',
  summary: 'Client side DDP sniffer with listener hooks and filters',
  version: '0.1.0',
  git: 'https://github.com/kristjanhall/meteor-ddpsniffer'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.0.1');

  const packages = [
    'ecmascript',
  ];

  api.use(packages);
  api.imply(packages);

  api.mainModule('ddpsniffer.js', 'client');
  api.export('DDPSniffer', 'client');

});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('kristjanhall:sniffer');
  api.mainModule('sniffer-tests.js');
});
