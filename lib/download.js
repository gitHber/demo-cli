const download = require("download-git-repo");
const path = require("path");

module.exports = function(target) {
  target = path.join(target || ".", ".download-temp");
  return new Promise((res, rej) => {
    download(
      "direct:https://github.com/gitHber/webpack-frame.git#master",
      target,
      { clone: true },
      err => {
        if (err) {
          rej(err);
        } else {
          // 下载的模板存放在 .download-temp 临时路径，下载完返回promise，后续处理
          res(target);
        }
      }
    );
  });
};
