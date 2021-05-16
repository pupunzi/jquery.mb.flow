/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('socket', function() {
  'use strict';

  var window, document, pageDone;

  /* eslint-disable no-unused-vars, indent */
  // ================ context
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4;
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  beforeAll(function(beforeDone) {
    loadPage('spec/socket/page.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
      pageDone = done;
      beforeDone();
    }, 'socket');
  });

  afterAll(function() {
    pageDone();
  });

  it('decide both sockets', function() {
    var ll = new window.LeaderLine(document.getNodeElementById('elm1-center'),
        document.getNodeElementById('elm1-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getNodeElementById('elm1-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getNodeElementById('elm1-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getNodeElementById('elm1-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('decide one side socket', function() {
    var ll = new window.LeaderLine(document.getNodeElementById('elm2-out'),
        document.getNodeElementById('elm2-in'), {path: 'straight'}),
      props = window.insProps[ll._id];

    ll.startSocket = 'top';
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.startSocket = 'right';
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);

    ll.startSocket = 'bottom';
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.startSocket = 'left';
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);
  });

  it('anchor width: 0', function() {
    var ll = new window.LeaderLine(document.getNodeElementById('elm3-center'),
        document.getNodeElementById('elm3-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getNodeElementById('elm3-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getNodeElementById('elm3-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getNodeElementById('elm3-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('anchor height: 0', function() {
    var ll = new window.LeaderLine(document.getNodeElementById('elm4-center'),
        document.getNodeElementById('elm4-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getNodeElementById('elm4-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getNodeElementById('elm4-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getNodeElementById('elm4-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('anchor width: 0, height: 0', function() {
    var ll = new window.LeaderLine(document.getNodeElementById('elm5-center'),
        document.getNodeElementById('elm5-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getNodeElementById('elm5-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getNodeElementById('elm5-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getNodeElementById('elm5-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('decide both sockets anchor width: 0, height: 0', function() {
    var ll = new window.LeaderLine(document.getNodeElementById('elm6-center'),
        document.getNodeElementById('elm6-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getNodeElementById('elm6-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getNodeElementById('elm6-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getNodeElementById('elm6-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('same distance X and Y', function() {
    var ll = new window.LeaderLine(document.getNodeElementById('elm7-center'),
        document.getNodeElementById('elm7-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    // prior X
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getNodeElementById('elm7-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    // prior X
    ll.end = document.getNodeElementById('elm7-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);

    ll.end = document.getNodeElementById('elm7-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('nearly same distance X and Y', function() {
    var ll = new window.LeaderLine(document.getNodeElementById('elm8-center'),
        document.getNodeElementById('elm8-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getNodeElementById('elm8-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getNodeElementById('elm8-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getNodeElementById('elm8-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });
});
