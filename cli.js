#!/usr/bin/env node
const argv = require("yargs")
  .option("repo", {
    describe: "GitHub repository, eg Microsoft/vscode",
  })
  .option("tag", {
    describe: "Tag to show merged PRs relative to, eg 1.1.3",
  })
  .option("format", {
    describe: "Output format. Can be 'json' or 'markdown'.",
    default: "json",
  })
  .demandOption(["repo", "tag"]).argv;

const ora = require("ora");
const prsMergedSince = require("./index");

const spinner = ora("Loading data from GitHub API, please wait...").start();

prsMergedSince({
  repo: argv.repo,
  tag: argv.tag,
  githubApiToken: process.env.GITHUB_API_TOKEN,
}).then(
  (prs) => {
    spinner.stop();

    if (argv.format === "markdown") {
      const markdownLines = prs.map((pr) => {
        console.log(
          `#### ${pr.title} ([#${pr.number}](${pr.html_url}) by [@${
            pr.user.login
          }](${pr.user.html_url}))\n`
        );
      });
      return markdownLines.join("\n");
    } else {
      console.log(JSON.stringify(prs, null, 2));
    }
  },
  (err) => {
    spinner.stop();
    console.error(err);
    process.exit(1);
  }
);
