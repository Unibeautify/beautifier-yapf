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
  name: "YAPF",
  package: pkg,
  options: {
    Python: {
      indent_width: "indent_size",
      use_tabs: [["indent_style"], options => options.indent_style === "tab"],
    },
  },
  dependencies: [
    {
      type: DependencyType.Executable,
      name: "YAPF",
      program: "yapf",
      parseVersion: [/yapf (\d+\.\d+\.\d+)/],
    },
  ],
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
    options,
    beautifierConfig,
  }: BeautifierBeautifyData) {
    const yapf = dependencies.get<ExecutableDependency>("YAPF");
    const style =
      beautifierConfig && beautifierConfig.filePath
        ? `${beautifierConfig.filePath}`
        : stringifyOptions(options);
    const config = style ? `--style=${style}` : "";
    return tmpFile({ postfix: ".py" }).then(filePath => {
      const basePath: string = os.tmpdir();
      const args = relativizePaths([config, "--in-place", filePath], basePath);
      return writeFile(filePath, text).then(() =>
        yapf
          .run({
            args,
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
      );
    });
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

function stringifyOptions(
  options: BeautifierBeautifyData["options"]
): string | undefined {
  const ops: string[] = Object.keys(options)
    .map(optionKey => {
      const value = options[optionKey];
      if (value === undefined) {
        return;
      }
      return `${optionKey}: ${value}`;
    })
    .filter(Boolean) as any;
  if (ops.length > 0) {
    return `{${ops.join(", ")}}`;
  }
  return undefined;
}

export default beautifier;
