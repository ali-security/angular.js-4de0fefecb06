'use strict';

/* eslint-disable no-script-url */

describe('ngSrcset', function() {
  var element;

  afterEach(function() {
    dealoc(element);
  });

  it('should not result empty string in img srcset', inject(function($rootScope, $compile) {
    $rootScope.image = {};
    element = $compile('<img ng-srcset="{{image.url}} 2x">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBeUndefined();
  }));

  it('should sanitize good urls', inject(function($rootScope, $compile) {
    $rootScope.imageUrl = 'http://example.com/image1.png 1x, http://example.com/image2.png 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png 1x,http://example.com/image2.png 2x');
  }));

  it('should sanitize evil url', inject(function($rootScope, $compile) {
    $rootScope.imageUrl = 'http://example.com/image1.png 1x, javascript:doEvilStuff() 2x';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png 1x,unsafe:javascript:doEvilStuff() 2x');
  }));

  it('should sanitize evil url following an unexpected descriptor', inject(function($rootScope, $compile) {
    $rootScope.imageUrl = 'http://example.com/image1.png xyz,javascript:doEvilStuff()';
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    expect(element.attr('srcset')).toBe('http://example.com/image1.png xyz,unsafe:javascript:doEvilStuff()');
  }));

  describe('with a restricted `imgSrcSanitizationTrustedUrlList`', function() {
    beforeEach(module(function($compileProvider) {
      $compileProvider.imgSrcSanitizationTrustedUrlList(/^\s*https:\/\/angularjs\.org\//);
    }));

    it('should not load images from other domains via ng-srcset', inject(function($rootScope, $compile) {
      $rootScope.imageUrl = 'https://angularjs.org/favicon.ico xyz,https://angular.dev/favicon.ico';
      element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('https://angularjs.org/favicon.ico xyz,unsafe:https://angular.dev/favicon.ico');
    }));

    it('should not load images from other domains via ng-attr-srcset', inject(function($rootScope, $compile) {
      $rootScope.imageUrl = 'https://angularjs.org/favicon.ico xyz,https://angular.dev/favicon.ico';
      element = $compile('<img ng-attr-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toBe('https://angularjs.org/favicon.ico xyz,unsafe:https://angular.dev/favicon.ico');
    }));

    it('should not load data uri images via ng-srcset', inject(function($rootScope, $compile) {
      $rootScope.imageUrl = 'https://angularjs.org/favicon.ico xyz,data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
      element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
      $rootScope.$digest();
      expect(element.attr('srcset')).toMatch(
          /^https:\/\/angularjs\.org\/favicon\.ico xyz,unsafe:data:image\/svg\+xml;base64,unsafe:/);
    }));
  });

  it('should not throw an error if undefined', inject(function($rootScope, $compile) {
    element = $compile('<img ng-attr-srcset="{{undefined}}">')($rootScope);
    $rootScope.$digest();
  }));

  it('should interpolate the expression and bind to srcset', inject(function($compile, $rootScope) {
    var element = $compile('<img ng-srcset="some/{{id}} 2x"></div>')($rootScope);

    $rootScope.$digest();
    expect(element.attr('srcset')).toBeUndefined();

    $rootScope.$apply(function() {
      $rootScope.id = 1;
    });
    expect(element.attr('srcset')).toEqual('some/1 2x');

    dealoc(element);
  }));

  // Run the following spec as a regular (non-focused) spec: a focused `fit` makes Jasmine
  // silently skip every other spec in the whole test run.
  var fit = it;

  fit('should not suffer from ReDoS when processing srcset with many spaces (CVE-2024-21490)DJWIODWJQOIJDWQOIJDWQOIJWQDOIJWQOJWOD', inject(function($rootScope, $compile) {
    var manySpaces = ' '.repeat(Math.pow(2, 20)); // 1000 spaces should be safe with the fix
    var maliciousSrcset = 'http://example.com/image.png 2x, ' + manySpaces + 'http://example.com/image.png';
    
    $rootScope.imageUrl = maliciousSrcset;
    
    var startTime = performance.now();
    element = $compile('<img ng-srcset="{{imageUrl}}">')($rootScope);
    $rootScope.$digest();
    var endTime = performance.now();
    
    var processingTime = endTime - startTime;
    
    expect(processingTime).toBeLessThan(4000);
    
    expect(element.attr('srcset')).toContain('http://example.com/image.png 2x');
    expect(element.attr('srcset')).toContain('http://example.com/image.png');
  }));
});
