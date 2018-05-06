"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unibeautify_1 = require("unibeautify");
const readPkgUp = require("read-pkg-up");
const tmp = require("tmp");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { pkg } = readPkgUp.sync({ cwd: __dirname });
exports.beautifier = {
    name: "yapf",
    package: pkg,
    options: {
        Python: true,
    },
    dependencies: [
        {
            type: unibeautify_1.DependencyType.Executable,
            name: "yapf",
            program: "yapf",
            parseVersion: [/yapf (\d+\.\d+\.\d+)/],
        },
    ],
    // TODO
    resolveConfig: ({ filePath, projectPath }) => {
        const configFiles = [".style.yapf", "setup.cfg"];
        return findFile({
            finishPath: projectPath,
            startPath: filePath,
            fileNames: configFiles,
        })
            .then(configFile => ({ filePath: configFile }))
            .catch(err => {
            // tslint:disable-next-line no-console
            console.log(err);
            return Promise.resolve({});
        });
    },
    beautify({ text, dependencies, filePath, beautifierConfig, }) {
        const yapf = dependencies.get("yapf");
        const basePath = os.tmpdir();
        return tmpFile({ postfix: ".py" }).then(filePath => writeFile(filePath, text).then(() => yapf
            .run({
            args: relativizePaths(["--in-place", filePath], basePath),
            options: {
                cwd: basePath,
            },
        })
            .then(({ exitCode, stderr }) => {
            if (exitCode) {
                return Promise.reject(stderr);
            }
            return readFile(filePath);
        })));
    },
};
function findFile({ finishPath = "/", startPath = finishPath, fileNames, }) {
    const filePaths = fileNames.map(fileName => path.join(startPath, fileName));
    return Promise.all(filePaths.map(doesFileExist))
        .then(exists => filePaths.filter((filePath, index) => exists[index]))
        .then(foundFilePaths => {
        if (foundFilePaths.length > 0) {
            return foundFilePaths[0];
        }
        if (startPath === finishPath) {
            return Promise.reject("No config file found");
        }
        const parentDir = path.resolve(startPath, "../");
        return findFile({ startPath: parentDir, finishPath, fileNames });
    });
}
function doesFileExist(filePath) {
    return new Promise(resolve => {
        fs.access(filePath, fs.constants.R_OK, error => resolve(!error));
    });
}
function tmpFile(options) {
    return new Promise((resolve, reject) => tmp.file(Object.assign({ prefix: "unibeautify-" }, options), (err, path, fd) => {
        if (err) {
            return reject(err);
        }
        return resolve(path);
    }));
}
function writeFile(filePath, contents) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, contents, error => {
            if (error) {
                return reject(error);
            }
            return resolve();
        });
    });
}
function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (error, data) => {
            if (error) {
                return reject(error);
            }
            return resolve(data.toString());
        });
    });
}
function relativizePaths(args, basePath) {
    return args.map(arg => {
        const isTmpFile = typeof arg === "string" &&
            !arg.includes(":") &&
            path.isAbsolute(arg) &&
            path.dirname(arg).startsWith(basePath);
        if (isTmpFile) {
            return path.relative(basePath, arg);
        }
        return arg;
    });
}
exports.default = exports.beautifier;
//# sourceMappingURL=index.js.map