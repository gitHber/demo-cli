// 创建demo 项目的代码
const program = require("commander");

program
  .version("1.0.0")
  .usage("<command> [项目名称]")
  .command("init", "创建新项目")
  .parse(process.argv);
