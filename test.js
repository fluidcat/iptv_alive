const CHECK_URL = [
  "https://gitdl.cn/https://raw.githubusercontent.com/dxawi/0/main/tvlive.txt",
  "https://gitdl.cn/https://raw.githubusercontent.com/qist/tvbox/master/list.txt",
  "https://gitee.com/xxy002/zhiboyuan/raw/master/zby.txt",
  "http://kv.zwc365.com/tvlive"
];

// const PROXY_ENV = "http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890";
const PROXY_ENV = "";
const fetch = require("node-fetch");
var exec = require("child_process").exec;


async function execmd(cmd) {
  // console.log(cmd);
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


//execmd('printf --111 "' + '"' + " >live.txt");

execmd('printf --222 "' + '"' + " >>live.txt");
