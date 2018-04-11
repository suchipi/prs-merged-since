module.exports = async function prsMergedSince({
  repo: repoAndOwner,
  tag: inputTag,
  githubApiToken,
}) {
  const octokit = require("@octokit/rest")(
    githubApiToken
      ? {
          headers: {
            Authorization: `Bearer ${githubApiToken}`,
          },
        }
      : undefined
  );

  const paginate = (method) => async (input) => {
    let data = [];

    let response = await method(Object.assign({ per_page: 100 }, input));
    data = data.concat(response.data);

    while (octokit.hasNextPage(response)) {
      response = await octokit.getNextPage(response);
      data = data.concat(response.data);
    }

    return data;
  };

  const [owner, repo] = repoAndOwner.split("/");

  const tags = await paginate(octokit.repos.getTags)({ owner, repo });
  const targetTag = tags.find((tag) => tag.name === inputTag);
  if (!targetTag) {
    throw new Error(
      `Could not find tag '${inputTag}' in repo '${repoAndOwner}'`
    );
  }

  const { data: commit } = await octokit.repos.getCommit({
    owner,
    repo,
    sha: targetTag.commit.sha,
  });

  const commitDate = new Date(commit.commit.committer.date);

  const prs = await paginate(octokit.pullRequests.getAll)({
    owner,
    repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
  });

  const prsMergedBefore = prs.filter(
    (pr) => pr.merged_at != null && new Date(pr.merged_at) > commitDate
  );

  return prsMergedBefore;
};
