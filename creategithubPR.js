// -----------------------------------------------------------------------
// Owner : Tanmay Varade
// -----------------------------------------------------------------------

const yaml = require('js-yaml'); // for converting yaml to json
const YAML = require('yaml'); // required for yaml-json conversion
const { Octokit } = require("@octokit/rest"); // module use for github
const doc = new YAML.Document();
const createPullRequest = require("octokit-create-pull-request"); // module use for creating PR
const token = "token"; // github token with full repo scope
const MyOctokit = Octokit.plugin(createPullRequest);
const octokit = new MyOctokit({
    auth: token,
});
const octokitt = new Octokit({ auth: token }); // authenticate with github
const release = "xxxxx" 
const organisation = "repo-owner(account-username)"
const repository = "some-github-repo"
const ccr = "CCR-1147"

// Map use for creating multiple PR we are going to iterate over this map
// this will create 3 PR
const environment = {"staging" : {"staging": "stging.yaml"},
                    // This will update multiple files in repository which is at location ./production1.yaml and ./prd.yaml
                     "production" : {"production1": "production1.yaml", "prd": "prd.yaml"},
                     "stable" : {"stable": "stable.yaml"}
};

// Async function because need some time to fetch file from github and for update as well.
async function createPR(owner, repo, env, rel, CCR) {
    // Iterating over this map
    for (const key in env) { 
        // Store updated file
        const files = {} 
        for (const key1 in env[key]) {  
            // Octokit function to fetch file or content of github repository
            const content = await octokitt.repos.getContent({
                owner: owner,
                repo: repo,
                path: env[key][key1]
            });
            // Below three lone converting fetch yaml data into json 
            const data = new Buffer.from(content.data.content, content.data.encoding).toString();
            const inputYML = data;
            var obj = yaml.load(inputYML, {encoding: 'utf-8'});
            obj.spec.branch = "release/"+rel
            // Convert yaml into json again
            doc.contents = obj;
            files[env[key][key1]] = doc.toString()
        } 
        // This is used for creating pull request with base branch = base and PR branch = head
        // Content to be updated is store in doc.toString() and it is in yaml format
        await octokit.createPullRequest({
            owner: owner,
            repo: repo,
            title: "feat(release-"+rel+"): "+key+" "+rel+" deployment",
            body: CCR,
            base: "master",
            head: "bump/"+rel,
            changes: {
            files: files,
            commit: "feat(release-"+rel+"): "+key+" "+rel+" deployment",
            },
        })
        // Print PR url and environment
        .then((pr) => console.log("Created PR for "+key+ "\nURL - "+ pr.data.html_url));
        break    
    } 
}

createPR(organisation, repository, environment, release, ccr)

