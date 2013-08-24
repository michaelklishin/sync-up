#!/usr/bin/env node

var cmd = require("commander"),
    fs  = require("fs"),
    u   = require("util"),
    _   = require("underscore"),
    p   = require("path"),
    spawn = require("child_process").spawn;

cmd
.version("1.0.0")
.parse(process.argv);

function isExistingDirectory(path) {
  if(fs.existsSync(path)) {
    var s = fs.statSync(path);
    return s.isDirectory();
  } else {
    return false;
  }
}

function announceRoot(path) {
  if(isExistingDirectory(path)) {
    u.puts(u.format("Will update repositories in %s", path));
    return true;
  } else {
    u.puts(u.format("Path %s does not exist!", path));
    return false;
  }
}

function detectVCS(repoPath) {
  var dotGit = p.join(repoPath, ".git");
  var dotHg  = p.join(repoPath, ".hg");

  if(isExistingDirectory(dotGit)) {
    return "git";
  }

  if(isExistingDirectory(dotHg)) {
    return "hg";
  }

  return null;
}

function spawnUpdateProcess(vcs, repoPath) {
  var args;
  switch(vcs) {
    case "git":
      args = ["pull"];
      break;
    case "hg":
      args = ["fetch"];
      break;
  }

  return spawn(vcs, args, {cwd: repoPath, env: process.env});
}

function update(repoPath) {
  var rt   = detectVCS(repoPath);
  if(rt === null) {
    return null;
  }

  var proc = spawnUpdateProcess(rt, repoPath);

  proc.stderr.on('data', function (data) {
    console.log('stderr (' + repoPath + "): " + data);
  });

  proc.on('close', function (code) {
    u.puts(u.format("Updated %s, exit code: %d", repoPath, code));
  });

  proc.on('error', function (err) {
    u.puts(u.format("Repo path: %s, error: %s", repoPath, err));
  });

  return proc;
}

function run(path) {
  if(!announceRoot(path)){
    process.exit(1);
  }
  var files = fs.readdirSync(path);
  var paths = _.map(files, function(s){ return p.join(path, s); });

  _.each(_.filter(paths, isExistingDirectory), function(repoPath) {
    update(repoPath);
  });
}

run(fs.realpathSync(process.argv[2]));
