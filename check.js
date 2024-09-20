const CHECK_URL = [
  "https://gitdl.cn/https://raw.githubusercontent.com/dxawi/0/main/tvlive.txt",
  "https://gitdl.cn/https://raw.githubusercontent.com/qist/tvbox/master/list.txt",
  "https://gitee.com/xxy002/zhiboyuan/raw/master/zby.txt",
  "http://kv.zwc365.com/tvlive"
];

// const PROXY_ENV = "http_proxy=http://127.0.0.1:7890 https_proxy=http://127.0.0.1:7890";
const PROXY_ENV = "";
const fetch = require("node-fetch");
const fs = require('fs');
const os = require('os');

var exec = require("child_process").exec;
var enter = os.type() == 'Windows_NT'?'\\n':'\n';
var channelTxt = './live.txt';
var channelM3u = './live.m3u';

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

function debug(run){
//	run();
}

async function fetchResponse(url) {
	let fetchStart = new Date().getTime();
	try {
		return await fetch(url, {
		  method: "GET",
		  headers: {"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0"},
		  responseType: "stream",
		  timeout: 2000,
		});
	} catch (e) {
		throw e;
	} finally {
		debug(()=>console.log('响应时间'+ ((new Date().getTime())-fetchStart+'').padStart(6,' ')+'ms, '+url));
	}
}
async function verifyurl(url) {
  try {
	if(url.endsWith("flv")){
		return false;
	}
    var res = await fetchResponse(url);
	if (res.status != 200){
//		console.log("响应错误:"+res.status+", "+url)
		return false;
	} else if (url.includes('.m3u8') || res.headers.get('content-type') == 'application/vnd.apple.mpegurl'){
		let tsPrefix = url.replace(url.split('/').pop(),'')
		let tsTxt = await res.text();
		// 判断是否m3u文件
		if(!tsTxt.startsWith('#EXTM3U')) {
			return false;
		}
		let ts_list = tsTxt.split("\n")
			.filter(e=>e.length>0&&!e.startsWith('#'))
			.map(e=>e.startsWith('http')?e:tsPrefix+e.trim());
		let speed = await checkSpeed(ts_list)
		if(speed == 0) {
			console.log('无响应：'+url+'\nts:'+ts_list.join('\n')+'\nm3u8:\n'+tsTxt);
			return false;
		} else {
			return speed;
		}
/*	} else if(res.headers.get('content-type') == 'video/x-flv') {
		let speed = await checkSpeed([url])
*/	} else {
//		console.log("headers:"+JSON.stringify(res.headers))
	}
    return true;
  } catch (e) {
//    console.log(e);
    return false;
  }
}

async function checkSpeed(urls) {
	let chunkSize = 0;
	let startTime = new Date().getTime();
	for(var index in urls){
		// 太多个ts
		if(index >= 1) {
			break;
		}
		let url = urls[index];
		
		let response = await fetchResponse(url);
		if (response.status != 200){
			chunkSize=0;
			break;
		}
		chunkSize+=parseInt(response.headers.get('content-length'));
	}
	/*
	let waitHandler = new Promise((resolve) => {
		setTimeout(async()=>{

			resolve();
		}, 12000);
	});

	await waitHandler;
	*/
	let costSecond = ((new Date().getTime()) - startTime)/1000;
	if(chunkSize <= 0) {
		return 0;
	}
	return chunkSize/costSecond/1024/1024;
}

async function getPlain(url) {
  try {
    var res = await fetch(url, {
      method: "GET",
      headers: {"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0"},
      timeout: 3000,
    });
    return await res.text();
  } catch (e) {
    return "";
  }
}

async function geturlcontent(url) {
  try {
//    var res1 = await execmd(PROXY_ENV + " " + 'curl -s -L "' + url + '"');
	var res = await getPlain(url);
//	console.log(res);
    return res;
  } catch (e) {
    console.log(e);
    return "";
  }
}
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
async function pushgit() {
  console.log("exec over");
  var gitstatu = await execmd("git add .");
  if (gitstatu[0]) {
    console.log("git 提交出错：", gitstatu);
    return;
  }
  var gitstatu = await execmd('git commit -m "' + "自动提交: "+(new Date()).Format('yyyy-MM-dd HH:mm:ss')+ '"');
  if (gitstatu[0] && !gitstatu[2].includes('publish your local commit')) {
    console.log("git 提交出错：", gitstatu);
    return;
  }
  var gitstatu = await execmd("git push origin master");
  if (gitstatu[0]) {
    console.log("git 提交出错：", gitstatu);
    return;
  }
}

function convertToM3U(txt) {
  const txtInput = txt;
  const lines = txtInput.split("\n");
  let m3uOutput = '#EXTM3U x-tvg-url="https://live.fanmingming.com/e.xml"\n';
  let currentGroup = null;
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine !== "") {
      if (trimmedLine.includes("#genre#")) {
        currentGroup = trimmedLine.replace(/,#genre#/, "").trim();
      } else {
        const [originalChannelName, channelLink] = trimmedLine
          .split(",")
          .map((item) => item.trim());
        const processedChannelName = originalChannelName.replace(
          /(CCTV|CETV)-(\d+).*/,
          "$1$2"
        );
        m3uOutput += `#EXTINF:-1 tvg-name="${processedChannelName}" tvg-logo="https://live.fanmingming.com/tv/${processedChannelName}.png"`;
        if (currentGroup) {
          m3uOutput += ` group-title="${currentGroup}"`;
        }
        m3uOutput += `,${originalChannelName}\n${channelLink}\n`;
      }
    }
  }
  return m3uOutput;
}

async function checkallurl(data) {
  var listsplit = data.split("\n");
  let ret = "";
  await listsplit.reduce(async (memo, ise) => {
    await memo;
    if (!ise || ise == "") {
      return 0;
    }

    var isesplit = ise.trim().split(",");
    if (isesplit.length >= 2) {
      if (isesplit[1].trim().indexOf("http") == 0) {
		let stime = new Date().getTime()
		let speed = await verifyurl(isesplit[1].trim());
		debug(()=>console.log('校验时间'+((new Date().getTime())-stime+'').padStart(6,' ')+'ms'+(speed>0?', 速度:'+speed+'M/s':'')));
        if (speed) {
          console.log("添加:", ise);
          ret += "\n" + ise;
        } else {
          console.log("排除:", ise);
        }
		debug(()=>console.log('\n\n'));
        return;
      }
    }
    ret += "\n" + ise;
  }, "");

  return ret;
}

function regroup(channels) {
  var globalArr = channels.split("\n");
  let ret = "";
  var groupCount = 0;
  var vGroup = 'other';
  var channelGroups = {vGroup:[]};
  var groups = ['央视频道','卫视频道','地方频道','港澳频道','国外频道','其他','电影','电视剧','历年春晚','直播中国','IPV6频道'];
  var tvChannelGroups = {};
  
  groups.forEach(g=>tvChannelGroups[g]=[])
  
  globalArr.forEach((line) => {
	  line = line.trim();
	  if(line.trim().length == 0){
		  return;
	  }
	  // 虚拟组名
	  if(line.includes("#genre#")) {
		  groupCount++;
		  vGroup = (groupCount+'').padStart(10,0)+'_'+line.split(',')[0];
		  channelGroups[vGroup] = channelGroups[vGroup]?channelGroups[vGroup]:[];
	  } else {
		  // 统一cctv名称
		  if(line.startsWith('CCTV') && cctvRegx.test(line)) {
			  // 找到一行的频道名称
			  let nameStr = cctvRegx.exec(line)[0];
			  let realName = cctvMap[nameStr.substr(0, nameStr.length-1).trim()];
			  line = line.replace(nameStr, realName);
		  }
		  channelGroups[vGroup].push(line);
	  }
  });

  for(let group in channelGroups) {
	  // 某些组直接归类：
	  if(/CCTV|央视|体育类/.test(group) && !group.includes('CCTV-Live')) {
		  tvChannelGroups['央视频道'].push(...channelGroups[group])
	  }
	  else if(/卫视|综合/.test(group)) {
		 tvChannelGroups['卫视频道'].push(...channelGroups[group])
	  }
	  else if(/地方/.test(group)) {
		  tvChannelGroups['地方频道'].push(...channelGroups[group])
	  }
	  else if(/轮播|电影/.test(group)) {
		  tvChannelGroups['电影'].push(...channelGroups[group])
	  }
	  else if(/电视剧/.test(group)) {
		  tvChannelGroups['电视剧'].push(...channelGroups[group])
	  }
	  else if(/IPV6/.test(group)) {
		  tvChannelGroups['IPV6频道'].push(...channelGroups[group])
	  }
	  else if(/直播中国/.test(group)) {
		  tvChannelGroups['直播中国'].push(...channelGroups[group])
	  }
	  else if(/世界|海外/.test(group)) {
		  tvChannelGroups['国外频道'].push(...channelGroups[group])
	  }
	  else if(/春晚/.test(group)) {
		  tvChannelGroups['历年春晚'].push(...channelGroups[group])
	  }
	  else if(/港澳台|海外/.test(group)) {
		  tvChannelGroups['港澳频道'].push(...channelGroups[group])
	  } else {
		for(let index in channelGroups[group]) {
			let channel = channelGroups[group][index]
			if(/CCTV/.test(channel)) {
				tvChannelGroups['央视频道'].push(channel)
			}
			else if(/卫视/.test(channel)) {
				tvChannelGroups['卫视频道'].push(channel)
			} else {
				tvChannelGroups['其他'].push(channel)
			}
		}
	  }
  }
  groups.forEach(group=>{
	  ret += group+',#genre#\n';
	  for(channel in tvChannelGroups[group]) {
		  ret += tvChannelGroups[group][channel]+'\n'
	  }
  });
  return ret;
}

async function loadexturl() {
  fs.writeFile(channelTxt, '', { flag: 'w+' }, err => {});
  fs.writeFile(channelM3u, '', { flag: 'w+' }, err => {});

  let ret = "";
  await CHECK_URL.reduce(async (memo, url) => {
    await memo;
    if (!url || url == "") {
      return 0;
    }

    var content = await geturlcontent(url);
    if (content) {
		ret += await checkallurl(content);
    }
  }, "");

  ret = regroup(ret);
  
  // 获取全部可用链接后，统一写入
  fs.writeFile(channelTxt, ret.trim(), { flag: 'w+' }, err => {});

  let m3u_txt = convertToM3U(ret);
  // 写入 m3u 地址
  fs.writeFile(channelM3u, m3u_txt, {flag: 'w+'}, err => {});

  // push到 github
  await pushgit();
  console.log("状态:", "over");
  process.exit(0);
}

console.log("开始测试live地址并保存");
loadexturl();

// pushgit();

let cctvRegx = /^CCTV[1-9][+0-9]?\s*,/
let cctvMap = {
    'CCTV1':"CCTV-1 综合,",
    'CCTV2':"CCTV-2 财经,",
    'CCTV3':"CCTV-3 综艺,",
    'CCTV4':"CCTV-4 中文国际,",
    'CCTV5':"CCTV-5 体育,",
    'CCTV5+':"CCTV-5+ 体育赛事,",
    'CCTV6':"CCTV-6 电影,",
    'CCTV7':"CCTV-7 国防军事,",
    'CCTV8':"CCTV-8 电视剧,",
    'CCTV9':"CCTV-9 纪录,",
    'CCTV10':"CCTV-10 科教,",
    'CCTV11':"CCTV-11 戏曲,",
    'CCTV12':"CCTV-12 社会与法,",
    'CCTV13':"CCTV-13 新闻,",
    'CCTV14':"CCTV-14 少儿,",
    'CCTV15':"CCTV-15 音乐,",
    'CCTV16':"CCTV-16 奥林匹克,",
    'CCTV17':"CCTV-17 农业农村,"
}
