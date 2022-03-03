// 执行终端命令相关的代码
const hx = require("hbuilderx");

const { spawn } = require("child_process");

const outputChannel = hx.window.createOutputChannel("上传微信小程序");

const commandSpawn = (...args) => {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(...args);
      childProcess.stdout.on('data', data => {
      	data.toString().split('\n').forEach((item) => {
      		if(item == '') return
      		outputChannel.appendLine(item)
      	})
      })
      childProcess.stderr.on('data', data => {
      	data.toString().split('\n').forEach((item) => {
      		if(item == '') return
      		outputChannel.appendLine(item)
      	})
      })
      childProcess.on("close", () => {
        resolve();
      })
    })
}

module.exports = {
  commandSpawn,
	outputChannel
}