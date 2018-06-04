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
  .option("references", {
    describe: "Extract link references when format is markdown",
    type: "boolean",
    default: false,
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
      const userLinks = {};
      const prLinks = {};

      for (const pr of prs) {
        const login = `@${pr.user.login}`;
        const prRef = `#${pr.number}`;

        if (argv.references) {
          userLinks[login] = pr.user.html_url;
          prLinks[prRef] = pr.html_url;
          console.log(`#### ${pr.title} ([${prRef}] by [${login}])`);
        } else {
          console.log(
            `#### ${pr.title} ([${prRef}](${pr.html_url}) by [${login}](${
              pr.user.html_url
            }))`
          );
        }
      }

      if (argv.references) {
        console.log();
        for (const login of Object.keys(userLinks)) {
          console.log(`[${login}]: ${userLinks[login]}`);
        }
        for (const pr of Object.keys(prLinks)) {
          console.log(`[${pr}]: ${prLinks[pr]}`);
        }
      }
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
