#!/usr/bin/env node

const program = require("commander");
const path = require("path");
const fs = require("fs");
const glob = require("glob");
const inquirer = require("inquirer");
const download = require("../lib/download");
const latestVersion = require("latest-version");
const generator = require("../lib/generator"); // 模板插入
const chalk = require("chalk");
const logSymbols = require("log-symbols");
const ora = require("ora");

program.usage("<project-name>").parse(process.argv);

// 根据输入获取项目名称
let projectName = program.args[0];

if (!projectName) {
  // 相当于 --help选项
  program.help();
  return;
}

const list = glob.sync("*"); // 遍历当前目录

let next = undefined;
// 当前目录名称
let rootName = path.basename(process.cwd());

if (list.length) {
  // 如果当前目录不为空
  if (
    // 当前目录下有没有同名目录
    list.filter(name => {
      const fileName = path.resolve(process.cwd(), name);
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
// 下载处理函数
function go() {
  next
    .then(projectRoot => {
      console.log(chalk.white("\n Start generating... \n"));
      if (projectRoot !== ".") {
        fs.mkdirSync(projectRoot);
      }
      return download(projectRoot).then(target => {
        return {
          name: projectRoot,
          root: projectRoot,
          downloadTemp: target
        };
      });
    })
    .then(context => {
      return inquirer
        .prompt([
          {
            name: "projectName",
            message: "项目的名称",
            default: context.name
          },
          {
            name: "projectVersion",
            message: "项目的版本号",
            default: "1.0.0"
          },
          {
            name: "projectDescription",
            message: "项目的简介",
            default: `A project named ${context.name}`
          }
        ])
        .then(answers => {
          return latestVersion("macaw-ui")
            .then(version => {
              answers.supportUiVersion = version;
              return {
                ...context,
                metadata: {
                  ...answers
                }
              };
            })
            .catch(err => {
              return Promise.reject(err);
            });
        });
    })
    .then(context => {
      const spinner = ora(
        `Creating project in ${path.resolve(process.cwd(), context.root)}`
      );
      console.log('xx')
      spinner.start();
      return generator(context.metadata, context.downloadTemp)
        .then(res => {
          spinner.succeed();
          console.log(chalk.green("\n Generation completed!"));
        })
        .catch(err => {
          spinner.fail();
          return Promise.reject(err);
        });
    })
    .then(context => {
      console.log(logSymbols.success, chalk.green("创建成功:)"));
    })
    .catch(err => {
      console.error(logSymbols.error, chalk.red("创建失败"));
    });
}
