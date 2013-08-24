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

function update(repoPath) {
  var git = spawn("git", ["pull"], {cwd: repoPath, env: process.env});

  git.stderr.on('data', function (data) {
    console.log('stderr (' + repoPath + "): " + data);
  });

  git.on('close', function (code) {
    u.puts(u.format("Updated %s, exit code: %d", repoPath, code));
  });
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
