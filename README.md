<div align="center">
    <img width="160" height="216" src="img/clocks.png" alt="Clocks">
</div>

# dependency-time-machine

Tool to automatically update dependencies one-by-one in the chronological order. Most dependencies are compatible with other packages
from the similar or pastime. This tool helps to find the latest compatible version of the dependencies and update them.

This tool is intend to simulate the typical updating workflow as it was done regularly.

## Installation
Run with npx to find the next recommended dependency to update:
```shell
npx dependency-time-machine --update --install
```

or install globally:
```shell
# npm
npm install -g dependency-time-machine

# yarn
yarn global add dependency-time-machine

# pnpm
pnpm add -g dependency-time-machine
```

## Usage
Basic usage to find the next recommended dependency to update:
```shell
npx dependency-time-machine --update --install
```

Automatically update dependencies one-by-one running tests after each update. Tests are run with `npm test` command:
```shell
npx dependency-time-machine --update --install --auto
```

You can specify custom install and test commands:
```shell
npx dependency-time-machine --update --install --auto --install-script "yarn install" --test-script "yarn test"
```

Get timeline of the updates in JSON format:
```shell
npx dependency-time-machine --timeline
```

To exclude some dependencies from update, use `--exclude` option:
```shell
npx dependency-time-machine --update --install --exclude react,react-dom
```

or use `--exclude-file` option to exclude dependencies from file:
```shell
npx dependency-time-machine --update --install --exclude-file exclude.txt
```

## Requirements
- Node.js >= 14

## Options
```shell
Usage: dependency-time-machine [options]

Tool to automatically update dependencies one-by-one in the time order

Options:
  -p, --packageFile <file>         Path to package.json file (default: "package.json")
  -u, --update                     Update package.json file with new versions
  -is, --install-script <command>  Install with script (default: "npm install")
  -ts, --test-script <command>     Test command (default: "npm test")
  -i, --install                    Install with script
  -t, --timeline                   Print timeline
  -a, --auto                       Run in auto mode
  -c, --cache                      Cache resolved dependencies
  -cf, --cache-file <file>         Cache file (default: "./.dependency-time-machine/cache.json")
  -e, --exclude <dependency>       Exclude dependency from update, separated by comma
  -x, --exclude-file <file>        Exclude dependencies from file (default: "")
  -h, --help                       display help for command
```

## License
MIT