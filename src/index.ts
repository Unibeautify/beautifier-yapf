import {
  Beautifier,
  Language,
  BeautifierBeautifyData,
  DependencyType,
  ExecutableDependency,
} from "unibeautify";
import * as readPkgUp from "read-pkg-up";
import * as tmp from "tmp";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const { pkg } = readPkgUp.sync({ cwd: __dirname });

export const beautifier: Beautifier = {
  name: "yapf",
  package: pkg,
  options: {
    Python: true,
  },
  dependencies: [
    {
      type: DependencyType.Executable,
      name: "yapf",
      program: "yapf",
      parseVersion: [/yapf (\d+\.\d+\.\d+)/],
    },
  ],
  // TODO
  resolveConfig: ({ filePath, projectPath }) => {
    const configFiles: string[] = [".style.yapf", "setup.cfg"];
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
  beautify({
    text,
    dependencies,
    filePath,
    beautifierConfig,
  }: BeautifierBeautifyData) {
    const yapf = dependencies.get<ExecutableDependency>("yapf");
    const basePath: string = os.tmpdir();
    return tmpFile({ postfix: ".py" }).then(filePath =>
      writeFile(filePath, text).then(() =>
        yapf
          .run({
            args: relativizePaths(
              ["--in-place", filePath],
              basePath
            ),
            options: {
              cwd: basePath,
            },
          })
          .then(({ exitCode, stderr }) => {
            if (exitCode) {
              return Promise.reject(stderr);
            }
            return readFile(filePath);
          })
      )
    );
  },
};

function findFile({
  finishPath = "/",
  startPath = finishPath,
  fileNames,
}: {
  startPath: string | undefined;
  finishPath: string | undefined;
  fileNames: string[];
}): Promise<string> {
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

function doesFileExist(filePath: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.access(filePath, fs.constants.R_OK, error => resolve(!error));
  });
}

function tmpFile(options: tmp.Options): Promise<string> {
  return new Promise<string>((resolve, reject) =>
    tmp.file(
      {
        prefix: "unibeautify-",
        ...options,
      },
      (err, path, fd) => {
        if (err) {
          return reject(err);
        }
        return resolve(path);
      }
    )
  );
}

function writeFile(filePath: string, contents: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, contents, error => {
      if (error) {
        return reject(error);
      }
      return resolve();
    });
  });
}

function readFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (error, data) => {
      if (error) {
        return reject(error);
      }
      return resolve(data.toString());
    });
  });
}

function relativizePaths(args: string[], basePath: string): string[] {
  return args.map(arg => {
    const isTmpFile =
      typeof arg === "string" &&
      !arg.includes(":") &&
      path.isAbsolute(arg) &&
      path.dirname(arg).startsWith(basePath);
    if (isTmpFile) {
      return path.relative(basePath, arg);
    }
    return arg;
  });
}

export default beautifier;
