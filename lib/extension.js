const hx = require("hbuilderx");

const { MiniCd } = require("./main.js");

//该方法将在插件激活的时候调用
function activate(context) {
	let disposable2 = hx.commands.registerCommand('xcf.mini.cd.submit', () => {
		new MiniCd();
	});
	let disposable = hx.commands.registerCommand('xcf.mini.cd.upload', () => {
		new MiniCd(true);
	});
	
	//订阅销毁钩子，插件禁用的时候，自动注销该command。
	context.subscriptions.push(disposable);
	context.subscriptions.push(disposable2);
}
//该方法将在插件禁用的时候调用（目前是在插件卸载的时候触发）
function deactivate() {

}

Date.prototype.format = function(fmt) { 
	var o = { 
		"M+" : this.getMonth()+1,
		"d+" : this.getDate(),
		"h+" : this.getHours(),
		"m+" : this.getMinutes(),
		"s+" : this.getSeconds(),
		"q+" : Math.floor((this.getMonth()+3)/3),
		"S"  : this.getMilliseconds()
	}; 
	if(/(y+)/.test(fmt)) {
		fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
	}
	for(var k in o) {
		if(new RegExp("("+ k +")").test(fmt)){
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
		}
	}
	return fmt; 
}

module.exports = {
	activate,
	deactivate
}
