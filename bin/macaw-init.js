const program = require("commander");
const path = require("path");
const fs = require("fs");
const glob = require("glob");
const inquirer = require("inquirer");
const download = require("../lib/download");

program.usage("<project-name>").parse(process.argv);

// 根据输入获取项目名称
let projectName = program.args[0];

if (!projectName) {
  program.help();
  return;
}

const list = glob.sync("*");

let next = undefined;
let rootName = path.basename(process.cwd());

if (list.length) {
  // 如果当前目录不为空
  if (
    // 当前目录下有没有同名目录
    list.filter(name => {
      const fileName = path.resolve(process.cwd(), path.join(".", name));
      const isDir = fs.statSync(fileName).isDirectory();
      return name === projectName && isDir;
    }).length !== 0
  ) {
    console.log(`项目${projectName}已经存在`);
    return;
  }
  next = Promise.resolve(projectName);
} else if (rootName === projectName) {
  next = inquirer
    .prompt([
      {
        name: "buildInCurrent",
        message:
          "当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？",
        type: "confirm",
        default: true
      }
    ])
    .then(answer => {
      return Promise.resolve(answer.buildInCurrent ? "." : projectName);
    });
} else {
  next = Promise.resolve(projectName);
}

next && go();

function go() {
  next.then(projectRoot => {
    if (projectRoot !== ".") {
      fs.mkdirSync(projectRoot);
    }
    return download(projectRoot)
      .then(target => {
        return {
          projectRoot,
          downloadTemp: target
        };
      })
      .catch(err => console.log(err));
  });
}
