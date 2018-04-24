var gulp = require("gulp");
var msbuild = require("gulp-msbuild");
var debug = require("gulp-debug");
var foreach = require("gulp-foreach");
var rename = require("gulp-rename");
var newer = require("gulp-newer");
var util = require("gulp-util");
var runSequence = require("run-sequence");
var nugetRestore = require("gulp-nuget-restore");
var fs = require("fs");
var yargs = require("yargs").argv;
var unicorn = require("./scripts/unicorn.js");
var path = require("path");
var rimrafDir = require("rimraf");
var rimraf = require("gulp-rimraf");
var xmlpoke = require("xmlpoke");
var dataFolder = path.resolve("./Deploy/Website/App_Data");
var config;
if (fs.existsSync("./gulp-config.js.user")) {
    config = require("./gulp-config.js.user")();
} else {
    config = require("./gulp-config.js")();
}

module.exports.config = config;

gulp.task("default",
    function (callback) {
        config.runCleanBuilds = true;
        return runSequence(
            "Copy-Sitecore-License",
            "Copy-Sitecore-Lib",
            "Nuget-Restore",
            "Publish-All-Projects",
            "Apply-Xml-Transform",
            "Sync-Unicorn",
            "Publish-Transforms",
            callback);
    });

gulp.task("deploy",
    function (callback) {
        config.runCleanBuilds = true;
        return runSequence(
            "Copy-Sitecore-License",
            "Copy-Sitecore-Lib",
            "Nuget-Restore",
            "Publish-All-Projects",
            "Apply-Xml-Transform",
            "Publish-Transforms",
            callback);
    });

/*****************************
  Initial setup
*****************************/
gulp.task("Copy-Sitecore-License",
    function () {
        console.log("Copying Sitecore License file");
        return gulp.src(config.licensePath).pipe(gulp.dest("./lib"));
    });

gulp.task("Copy-Sitecore-Lib",
    function () {
        console.log("Copying Sitecore Libraries");

        fs.statSync(config.sitecoreLibraries);

        var files = config.sitecoreLibraries + "/**/*";

        return gulp.src(files).pipe(gulp.dest("./lib/Sitecore"));
    });

gulp.task("Nuget-Restore",
    function (callback) {
        var solution = "./" + config.solutionName + ".sln";
        return gulp.src(solution).pipe(nugetRestore());
    });


gulp.task("Publish-All-Projects",
    function (callback) {
        return runSequence(
            "Build-Solution",
            "Publish-Foundation-Projects",
            "Publish-Feature-Projects",
            "Publish-Project-Projects",
            callback);
    });

gulp.task("Apply-Xml-Transform",
    function () {
        var layerPathFilters = [
            "./src/Foundation/**/*.xdt", "./src/Feature/**/*.xdt", "./src/Project/**/*.xdt",
            "!./src/**/obj/**/*.xdt", "!./src/**/bin/**/*.xdt"
        ];
        return gulp.src(layerPathFilters)
            .pipe(foreach(function (stream, file) {
                var fileToTransform = file.path.replace(/.+code\\(.+)\.xdt/, "$1");
                util.log("Applying configuration transform: " + file.path);
                return gulp.src("./scripts/applytransform.targets")
                    .pipe(msbuild({
                        targets: ["ApplyTransform"],
                        configuration: config.buildConfiguration,
                        logCommand: false,
                        verbosity: config.buildVerbosity,
                        stdout: true,
                        errorOnFail: true,
                        maxcpucount: config.buildMaxCpuCount,
                        nodeReuse: false,
                        toolsVersion: config.buildToolsVersion,
                        properties: {
                            Platform: config.buildPlatform,
                            WebConfigToTransform: config.websiteRoot,
                            TransformFile: file.path,
                            FileToTransform: fileToTransform
                        }
                    }));
            }));
    });

gulp.task("Sync-Unicorn",
    function (callback) {
        var options = {};
        options.siteHostName = config.siteUrl;
        options.authenticationConfigFile = config.websiteRoot + "/App_config/Include/Unicorn.SharedSecret.config";

        unicorn(function () { return callback() }, options);
    });


gulp.task("Publish-Transforms",
    function () {
        return gulp.src("./src/**/code/**/*.xdt")
            .pipe(gulp.dest(config.websiteRoot + "/temp/transforms"));
    });

/*****************************
  Copy assemblies to all local projects
*****************************/
gulp.task("Copy-Local-Assemblies",
    function () {
        console.log("Copying site assemblies to all local projects");
        var files = config.sitecoreLibraries + "/**/*";

        var root = "./src";
        var projects = root + "/**/code/bin";
        return gulp.src(projects, { base: root })
            .pipe(foreach(function (stream, file) {
                console.log("copying to " + file.path);
                gulp.src(files)
                    .pipe(gulp.dest(file.path));
                return stream;
            }));
    });

/*****************************
  Publish
  @param {stream} stream is the published stream
  @param {dest} dest is the destination of publishing files
  @return {stream} to build project
*****************************/
var publishStream = function (stream, dest) {
    var targets = ["Build"];

    return stream
        .pipe(debug({ title: "Building project:" }))
        .pipe(msbuild({
            targets: targets,
            configuration: config.buildConfiguration,
            logCommand: false,
            verbosity: config.buildVerbosity,
            stdout: true,
            errorOnFail: true,
            maxcpucount: config.buildMaxCpuCount,
            nodeReuse: false,
            toolsVersion: config.buildToolsVersion,
            properties: {
                Platform: config.publishPlatform,
                DeployOnBuild: "true",
                DeployDefaultTarget: "WebPublish",
                WebPublishMethod: "FileSystem",
                BuildProjectReferences: "false",
                DeleteExistingFiles: "false",
                publishUrl: dest
            }
        }));
};
var publishProject = function (location, dest) {
    dest = dest || config.websiteRoot;

    console.log("publish to " + dest + " folder");
    return gulp.src(["./src/" + location + "/code/*.csproj"])
        .pipe(foreach(function (stream, file) {
            return publishStream(stream, dest);
        }));
};
var publishProjects = function (location, dest) {
    dest = dest || config.websiteRoot;

    console.log("publish to " + dest + " folder");
    return gulp.src([location + "/**/code/*.csproj"])
        .pipe(foreach(function (stream, file) {
            return publishStream(stream, dest);
        }));
};

gulp.task("Build-Solution",
    function () {
        var targets = ["Build"];
        if (config.runCleanBuilds) {
            targets = ["Clean", "Build"];
        }

        var solution = "./" + config.solutionName + ".sln";
        return gulp.src(solution)
            .pipe(msbuild({
                targets: targets,
                configuration: config.buildConfiguration,
                logCommand: false,
                verbosity: config.buildVerbosity,
                stdout: true,
                errorOnFail: true,
                maxcpucount: config.buildMaxCpuCount,
                nodeReuse: false,
                toolsVersion: config.buildToolsVersion,
                properties: {
                    Platform: config.buildPlatform
                }
            }));
    });

gulp.task("Publish-Foundation-Projects",
    function () {
        return publishProjects("./src/Foundation");
    });

gulp.task("Publish-Feature-Projects",
    function () {
        return publishProjects("./src/Feature");
    });

gulp.task("Publish-Project-Projects",
    function () {
        return publishProjects("./src/Project");
    });

gulp.task("Publish-Project",
    function () {
        if (yargs && yargs.m && typeof (yargs.m) === "string") {
            return publishProject(yargs.m);
        } else {
            throw "\n\n------\n USAGE: -m Layer/Module \n------\n\n";
        }
    });

gulp.task("Publish-Assemblies",
    function () {
        var root = "./src";
        var binFiles = root + "/**/code/**/bin/Sitecore.{Feature,Foundation,Habitat}.*.{dll,pdb}";
        var destination = config.websiteRoot + "/bin/";
        return gulp.src(binFiles, { base: root })
            .pipe(rename({ dirname: "" }))
            .pipe(newer(destination))
            .pipe(debug({ title: "Copying " }))
            .pipe(gulp.dest(destination));
    });

gulp.task("Publish-All-Views",
    function () {
        var root = "./src";
        var roots = [root + "/**/Views", "!" + root + "/**/obj/**/Views"];
        var files = "/**/*.cshtml";
        var destination = config.websiteRoot + "\\Views";
        return gulp.src(roots, { base: root }).pipe(
            foreach(function (stream, file) {
                console.log("Publishing from " + file.path);
                gulp.src(file.path + files, { base: file.path })
                    .pipe(newer(destination))
                    .pipe(debug({ title: "Copying " }))
                    .pipe(gulp.dest(destination));
                return stream;
            })
        );
    });

gulp.task("Publish-All-Configs",
    function () {
        var root = "./src";
        var roots = [root + "/**/App_Config", "!" + root + "/**/tests/App_Config", "!" + root + "/**/obj/**/App_Config"];
        var files = "/**/*.config";
        var destination = config.websiteRoot + "\\App_Config";
        return gulp.src(roots, { base: root }).pipe(
            foreach(function (stream, file) {
                console.log("Publishing from " + file.path);
                gulp.src(file.path + files, { base: file.path })
                    .pipe(newer(destination))
                    .pipe(debug({ title: "Copying " }))
                    .pipe(gulp.dest(destination));
                return stream;
            })
        );
    });

/*****************************
 Watchers
*****************************/
gulp.task("Auto-Publish-Css",
    function () {
        var root = "./src";
        var roots = [root + "/**/styles", "!" + root + "/**/obj/**/styles"];
        var files = "/**/*.css";
        var destination = config.websiteRoot + "\\styles";
        gulp.src(roots, { base: root }).pipe(
            foreach(function (stream, rootFolder) {
                gulp.watch(rootFolder.path + files,
                    function (event) {
                        if (event.type === "changed") {
                            console.log("publish this file " + event.path);
                            gulp.src(event.path, { base: rootFolder.path }).pipe(gulp.dest(destination));
                        }
                        console.log("published " + event.path);
                    });
                return stream;
            })
        );
    });

gulp.task("Auto-Publish-Views",
    function () {
        var root = "./src";
        var roots = [root + "/**/Views", "!" + root + "/**/obj/**/Views"];
        var files = "/**/*.cshtml";
        var destination = config.websiteRoot + "\\Views";
        return gulp.src(roots, { base: root }).pipe(
            foreach(function (stream, rootFolder) {
                gulp.watch(rootFolder.path + files,
                    function (event) {
                        if (event.type === "changed") {
                            console.log("publish this file " + event.path);
                            gulp.src(event.path, { base: rootFolder.path }).pipe(gulp.dest(destination));
                        }
                        console.log("published " + event.path);
                    });
                return stream;
            })
        );
    });

gulp.task("Auto-Publish-Assemblies",
    function () {
        var root = "./src";
        var roots = [root + "/**/code/**/bin"];
        var files = "/**/Sitecore.{Feature,Foundation,Habitat}.*.{dll,pdb}";;
        var destination = config.websiteRoot + "/bin/";
        gulp.src(roots, { base: root }).pipe(
            foreach(function (stream, rootFolder) {
                gulp.watch(rootFolder.path + files,
                    function (event) {
                        if (event.type === "changed") {
                            console.log("publish this file " + event.path);
                            gulp.src(event.path, { base: rootFolder.path }).pipe(gulp.dest(destination));
                        }
                        console.log("published " + event.path);
                    });
                return stream;
            })
        );
    });

/*****************************
 Package
*****************************/
var websiteRootBackup = config.websiteRoot;
var packageXmlPath = config.packagePath + "\\" + config.solutionName + ".xml";

/* create base package configuration */
gulp.task("Package-Create-Package-Xml",
    function (callback) {
        return gulp.src(config.packageXmlBasePath).pipe(rename(config.solutionName + ".xml")).pipe(gulp.dest(config.packagePath));
    });


/* publish files to temp location */
gulp.task("Package-Publish",
    function (callback) {
        config.websiteRoot = path.resolve("./temp");
        config.buildConfiguration = "Release";
        fs.mkdirSync(config.websiteRoot);
        runSequence(
            "Build-Solution",
            "Publish-Foundation-Projects",
            "Publish-Feature-Projects",
            "Publish-Project-Projects",
            "Publish-Transforms",
            callback);
    });

/* Remove unwanted files */
gulp.task("Package-Prepare-Package-Files",
    function (callback) {
        var excludeList = [
            config.websiteRoot + "\\bin\\{Sitecore,Lucene,Newtonsoft,System,Microsoft.Web.Infrastructure}*dll",
            config.websiteRoot + "\\compilerconfig.json.defaults",
            config.websiteRoot + "\\packages.config",
            config.websiteRoot + "\\App_Config\\Include\\{Feature,Foundation,Project}\\*Serialization.config",
            config.websiteRoot + "\\App_Config\\Include\\{Feature,Foundation,Project}\\z.*DevSettings.config",
            "!" + config.websiteRoot + "\\bin\\Sitecore.Support*dll",
            "!" + config.websiteRoot + "\\bin\\Sitecore.{Feature,Foundation,Habitat,Demo,Common}*dll"
        ];
        console.log(excludeList);

        return gulp.src(excludeList, { read: false }).pipe(rimraf({ force: true }));
    });

/* Add files to package definition */
gulp.task("Package-Enumerate-Files",
    function () {
        var packageFiles = [];
        config.websiteRoot = websiteRootBackup;

        return gulp.src(path.resolve("./temp") + "/**/*.*", { base: "temp", read: false })
            .pipe(foreach(function (stream, file) {
                var item = "/" + file.relative.replace(/\\/g, "/");
                console.log("Added to the package:" + item);
                packageFiles.push(item);
                return stream;
            })).pipe(util.buffer(function () {
                xmlpoke(packageXmlPath,
                    function (xml) {
                        for (var idx in packageFiles) {
                            xml.add("project/Sources/xfiles/Entries/x-item", packageFiles[idx]);
                        }
                    });
            }));
    });

/* Add items to package definition */
gulp.task("Package-Enumerate-Items",
    function () {
        var itemPaths = [];
        var allowedPatterns = [
            "./src/**/serialization/**/*.yml",
            "!./src/**/serialization/Roles/**/*.yml",
            "!./src/**/serialization/Users/**/*.yml"
        ];
        return gulp.src(allowedPatterns)
            .pipe(foreach(function (stream, file) {
                console.log(file);
                var itemPath = unicorn.getFullItemPath(file);
                itemPaths.push(itemPath);
                return stream;
            })).pipe(util.buffer(function () {
                xmlpoke(packageXmlPath,
                    function (xml) {
                        for (var idx in itemPaths) {
                            xml.add("project/Sources/xitems/Entries/x-item", itemPaths[idx]);
                        }
                    });
            }));
    });

/* Add users to package definition */
gulp.task("Package-Enumerate-Users",
    function () {
        var users = [];

        return gulp.src("./src/**/serialization/Users/**/*.yml")
            .pipe(foreach(function (stream, file) {
                console.log(file);
                var fileContent = file.contents.toString();
                var userName = unicorn.getUserPath(file);
                users.push(userName);
                return stream;
            })).pipe(util.buffer(function () {
                xmlpoke(packageXmlPath,
                    function (xml) {
                        for (var idx in users) {
                            xml.add("project/Sources/accounts/Entries/x-item", users[idx]);
                        }
                    });
            }));
    });

/* Add roles to package definition */
gulp.task("Package-Enumerate-Roles",
    function () {
        var roles = [];

        return gulp.src("./src/**/serialization/Roles/**/*.yml")
            .pipe(foreach(function (stream, file) {
                console.log(file);
                var fileContent = file.contents.toString();
                var roleName = unicorn.getRolePath(file);
                roles.push(roleName);
                return stream;
            })).pipe(util.buffer(function () {
                xmlpoke(packageXmlPath,
                    function (xml) {
                        for (var idx in roles) {
                            xml.add("project/Sources/accounts/Entries/x-item", roles[idx]);
                        }
                    });
            }));
    });

/* Remove temp files */
gulp.task("Package-Clean",
    function (callback) {
        rimrafDir.sync(path.resolve("./temp"));
        callback();
    });

/* Main task, generate package.xml */

gulp.task("Package-Publish", function (callback) {
    config.websiteRoot = path.resolve("./Deploy/Website");
    config.buildConfiguration = "Release";
    fs.mkdirSync(config.websiteRoot);
    runSequence(
        "Build-Solution",
        "Publish-Foundation-Projects",
        "Publish-Feature-Projects",
        "Publish-Project-Projects", callback);
});

gulp.task("Package-Prepare-Package-Files", function (callback) {
    var excludeList = [
        config.websiteRoot + "\\bin\\{Sitecore,Lucene,Newtonsoft,System,Microsoft.Web.Infrastructure}*dll",
        config.websiteRoot + "\\bin\\*.pdb",
        config.websiteRoot + "\\compilerconfig.json.defaults",
        config.websiteRoot + "\\packages.config",
        config.websiteRoot + "\\App_Data\\*",
        config.websiteRoot + "\\bin\\{Sitecore.Foundation.Installer}*",
        config.websiteRoot + "\\App_Config\\Include\\Foundation\\Foundation.Installer.config",
        config.websiteRoot + "\\README.md",
        config.websiteRoot + "\\bin\\HtmlAgilityPack*dll",
        config.websiteRoot + "\\bin\\ICSharpCode.SharpZipLib*dll",
        config.websiteRoot + "\\bin\\Microsoft.Extensions.DependencyInjection*dll",
        config.websiteRoot + "\\bin\\MongoDB.Driver*dll",
        config.websiteRoot + "\\bin\\Microsoft.Web.XmlTransform*dll",
        config.websiteRoot + "\\App_Config\\Include\\{Feature,Foundation,Project}\\z.*DevSettings.config",
        "!" + config.websiteRoot + "\\bin\\Sitecore.Support*dll",
        "!" + config.websiteRoot + "\\bin\\Sitecore.{Feature,Foundation,Habitat,Demo,Common}*dll"
    ];
    console.log(excludeList);

    return gulp.src(excludeList, { read: false }).pipe(rimraf({ force: true }));
});


gulp.task("Package-Copy-Items", function () {
    return gulp.src("./src/**/serialization/**/*.yml")
        .pipe(gulp.dest('./Deploy/Website/App_Data/unicorn/'));
});

gulp.task("Package-Copy-Users", function () {
    return gulp.src("./src/**/users/**/*.user")
        .pipe(gulp.dest('./Deploy/Website/App_Data/unicorn/'));
});

gulp.task("Package-Copy-Roles", function () {
    return gulp.src("./src/**/roles/**/*.role")
        .pipe(gulp.dest('./Deploy/Website/App_Data/unicorn/'));
});

gulp.task("Package-Clean", function (callback) {
    rimrafDir.sync(path.resolve("./Deploy/Website"));
    rimrafDir.sync(path.resolve("./Deploy/Website/App_Data/unicorn"));
    callback();
});

gulp.task("Package-Apply-Xml-Transform", function () {
    var layerPathFilters = ["./src/Foundation/**/*.cm.transform", "./src/Feature/**/*.cm.transform", "./src/Project/**/*.cm.transform", "!./src/**/obj/**/*.cm.transform", "!./src/**/bin/**/*.cm.transform"];
    return gulp.src(layerPathFilters)
        .pipe(foreach(function (stream, file) {
            var fileToTransform = file.path.replace(/.+code\\(.+)\.cm.transform/, "$1");
            util.log("Applying configuration transform: " + file.path);
            return gulp.src("./scripts/applytransform.targets")
                .pipe(msbuild({
                    targets: ["ApplyTransform"],
                    configuration: "Release",
                    logCommand: false,
                    verbosity: "minimal",
                    stdout: true,
                    errorOnFail: true,
                    maxcpucount: 0,
                    toolsVersion: config.buildToolsVersion,
                    properties: {
                        Platform: config.buildPlatform,
                        WebConfigToTransform: config.websiteRoot,
                        TransformFile: file.path,
                        FileToTransform: fileToTransform
                    }
                }));
        }));
});

gulp.task("Publish-For-Deployment-Package", function (callback) {
    runSequence(
        "Package-Clean",
        "Package-Publish",
        "Package-Prepare-Package-Files",
        "Package-Copy-Items",
        "Package-Copy-Users",
        "Package-Copy-Roles",
        "Package-Apply-Xml-Transform",
        "Package-Prepare-Items-For-Unicorn",
        callback);
});

gulp.task("Package-Prepare-Items-For-Unicorn", function () {
    return gulp.src("./src/**/serialization/**/*.yml")
        .pipe(gulp.dest(dataFolder + "/Unicorn/"));
});