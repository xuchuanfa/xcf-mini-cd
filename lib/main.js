const hx = require("hbuilderx");
const path = require("path");
const fs = require("fs");
const os = require("os");

const stripJsonComments = require('./utils/stripJsonComments.js')

const { commandSpawn, outputChannel } = require("./utils/terminal.js");

async function windowSubmit() {
	let webviewDialog = hx.window.createWebViewDialog({
	    modal: true,
	    title: "上传微信小程序",
	    dialogButtons: [
	      "确定", "取消"
	    ],
	    size: {
	      width: 400,
	      height: 280
	    }
	}, {
	    enableScripts: true
	});
	
	const desc = `在 ${new Date().format("yyyy-MM-dd hh:mm:ss")} 提交上传`;
	let version = this.version;
	
	let webview = webviewDialog.webView;
	webview.html = `
	    <html>
			<style>
			.con-input {
       flex: 1;
       height: 28px;
       line-height: 28px;
       background-color: #FFFFFF;
       background-image: none;
       border-radius: 4px;
       border: 1px solid #DCDFE6;
       color: #606266;
       display: inline-block;
       box-sizing: border-box;
       font-size: 14px;
       outline: none;
       padding: 0 15px;
       font-size: 13px;
      }
		  .filed {
			  display: flex;
			  align-items: center;
				margin-bottom: 10px;
		   }
		  .filed .filed-title {
				font-size: 14px;
			  width: 70px;
		  }
			</style>
			<body>
			  <div>
					<div class="filed">
					 <span class="filed-title">版本号</span>
					 <input type="text" id="version" value="${version}" placeholder="${version}" class="con-input" />
					</div>
					<div class="filed">
					 <span class="filed-title">项目备注</span>
					 <input type="text" id="desc" value="" placeholder="${desc}" class="con-input" />
					</div>
				</div>
			</body>
	    <script>
	    function initReceive() {
	        hbuilderx.onDidReceiveMessage((msg)=>{
	            if(msg.type == 'DialogButtonEvent'){
	                let button = msg.button;
	                if(button == '确定'){
										 let version = document.querySelector("#version");
										 let desc = document.querySelector("#desc");
	                    //TODO 处理表单提交
											hbuilderx.postMessage({
											    command: 'confirm',
													version: version.value,
													desc: desc.value
											});
	                }else if(button == '取消'){
	                    //TODO 处理取消逻辑
	                        hbuilderx.postMessage({
	                        command: 'cancel'
	                    });
	                }
	            }
	        });
	    }
	    window.addEventListener("hbuilderxReady", initReceive);
	    </script>
	    </html>
	`;
	
	webview.onDidReceiveMessage((msg) => {
			webviewDialog.close();
	    if (msg.command == 'confirm') {
					this.version = msg.version;
					this.desc = msg.version
					this.upload();
	    }
	});
	webviewDialog.show();
}

class MiniCd {
	constructor(falg) {
	 this.isFalg = falg;
	 this.init();
	}
	
	async init() {
		this.outputChannel = outputChannel;
		const editor = await hx.window.getActiveTextEditor();
		this.currentPath = editor.document.workspaceFolder.uri.fsPath;
		this.windowSubmit = windowSubmit.bind(this);
		this.desc = "";
		this.isCli = this.booleanCli();
		this.version = this.getVersion();
		if(this.isFalg) {
			this.upload();
		} else {
			this.windowSubmit();
		}
	}
	
	async upload() {
		if (!this.getAppid()) {
			hx.window.showErrorMessage('请先在manifest.json中设置AppID！',['确定']);
			return
		}
		this.outputChannel.show();
		this.outputChannel.appendLine(`正在打包中请耐心等待`);
		
		if(this.isCli) {
			await this.cliCompile();
		} else {
			await this.uniCompile();
		}
		
		const project = path.join(this.currentPath, this.isCli ? "dist/build/mp-weixin" : "unpackage/dist/build/mp-weixin");
		const version = this.version;
		const desc = this.desc || `在 ${new Date().format("yyyy-MM-dd hh:mm:ss")} 提交上传`;
		
		const wxRoot = this.getUtilPath();
		if(!wxRoot) {
			 hx.window.showErrorMessage('您未设置微信开发者工具路径，请前往设置->运行配置 进行设置', ['确定']);
			 return
		}
		
		this.outputChannel.appendLine(`正在上传：当前提交版本: ${version}`);
		
		await commandSpawn(path.join(wxRoot, "cli.bat"), [
		  "upload",
		  "--project",
		  project,
		  "-v",
		  version,
		  "-d",
		  desc,
		]);
		
		this.outputChannel.appendLine(`√上传成功 温馨提示: 如第一次上传需登录微信后台进行设置为体验版`);
		
	}
	
	async cliCompile() {
	  const command = process.platform === "win32" ? "npm.cmd" : "npm";
	
	  await commandSpawn(command, ["run", "build:mp-weixin"], {
			cwd: this.currentPath
		});
	}
	
	async uniCompile() {
		const hxRoot = path.resolve(process.execPath, "../..");
		const myEnv = process.env;
		
		Object.assign(myEnv, {
		  NODE_ENV: "production",
		  UNI_INPUT_DIR: this.currentPath,
		  UNI_OUTPUT_DIR: path.join(this.currentPath, "unpackage/dist/build/mp-weixin"),
		  UNI_PLATFORM: "mp-weixin",
		});
		
		await commandSpawn(path.join(hxRoot, "node/node"), [
		    "--max-old-space-size=2048",
		    path.join(hxRoot, "uniapp-cli/bin/uniapp-cli.js"),
		  ],
			{
			 cwd: path.join(hxRoot, "uniapp-cli"),
			 env: myEnv,
		  }
		);
	}
	
	booleanCli() {
		const cfgPath = path.join(
		  this.currentPath,
		  "package.json"
		);
		if(!fs.existsSync(cfgPath)) {
			return false
		}
		const cfgData = fs
		  .readFileSync(cfgPath, {
		    encoding: "utf-8",
		  })
    const cfg = JSON.parse(stripJsonComments(cfgData))
		const isCli = cfg.scripts ? !!cfg.scripts["build:mp-weixin"] : false
		return isCli
	}
	
	getVersion() {
		const cfgPath = path.join(this.currentPath, this.isCli ? 'src/manifest.json': 'manifest.json')
		const cfgData = fs.readFileSync(cfgPath, {
			encoding: 'utf-8',
		})
    
		const cfg = JSON.parse(stripJsonComments(cfgData))
		const version = cfg['versionName']
		
		return version
	}
	
	getAppid() {
		const cfgPath = path.join(this.currentPath, this.isCli ? 'src/manifest.json': 'manifest.json')
		const cfgData = fs.readFileSync(cfgPath, {
			encoding: 'utf-8',
		})
		const cfg = JSON.parse(stripJsonComments(cfgData))
		let appid = cfg['mp-weixin']['appid']
		return appid
	}
	
	getUtilPath() {
		const home = os.homedir();
		const cfgPath = path.join(
		  home,
		  "/AppData/Roaming/HBuilder X/user/settings.json"
		);
		const cfgData = fs
		  .readFileSync(cfgPath, {
		    encoding: "utf-8",
		  })
		const cfg = JSON.parse(stripJsonComments(cfgData))
		const wxRoot = cfg["weApp.devTools.path"];
		return wxRoot
	}
	
}

module.exports = {
	MiniCd
}