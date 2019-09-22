const download = require("download-git-repo");
const ora = require("ora");
const path = require("path");

module.exports = function(target) {
  target = path.join(target || ".", ".download-temp");
  return new Promise((res, rej) => {
    const url = "direct:https://github.com/gitHber/webpack-frame.git#master";
    const spinner = ora(`Downloading...`);
    spinner.start();
    download(url, target, { clone: true }, err => {
      if (err) {
        spinner.fail();
        rej(err);
      } else {
        spinner.succeed();
        // 下载的模板存放在 .download-temp 临时路径，下载完返回promise，后续处理
        res(target);
      }
    });
  });
};
