#!/usr/bin/env node

var exec = require("child_process").exec;


async function execmd(cmd) {
  var over = false;
  var waitcall = null;
  var _err,
    _stdout,
    _stderr = null;
  exec(cmd, async function (err, stdout, stderr) {
    _err = err;
    _stdout = stdout;
    _stderr = stderr;
    if (!over) {
      over = true;
      if (waitcall) {
        waitcall();
        waitcall = null;
      }
    }
  });
  if (!over) {
    await new Promise((r) => {
      waitcall = r;
    });
  }
  return [_err, _stdout, _stderr];
}

execmd('touch /root/iptv_alive/liveTest.txt')

process.exit(0);
