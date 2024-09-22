#!/usr/local/bin/node

const process = require("child_process")
var exec = process.exec;

Date.prototype.Format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1,
    'd+': this.getDate(),
    'H+': this.getHours(),
    'm+': this.getMinutes(),
    's+': this.getSeconds(),
    'S+': this.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(String(o[k]).length)));
    }
  }
  return fmt;
};

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

async function pushgit() {
  console.log("exec over");
  var gitstatu = await execmd("git add .");
  if (gitstatu[0]) {
    console.log("git 提交出错：", gitstatu);
    return;
  }
  var gitstatu = await execmd('git commit -m "' + "自动提交: "+(new Date()).Format('yyyy-MM-dd HH:mm:ss')+ '"');
  if (gitstatu[0] && !gitstatu[1].includes('publish your local commit')) {
    console.log("git 提交出错：", gitstatu);
    return;
  }
  var gitstatu = await execmd("git push origin master");
  if (gitstatu[0]) {
    console.log("git 提交出错：", gitstatu);
    return;
  }
}

pushgit();
