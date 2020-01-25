# Construct 3 Addon Authoring Commandline Utilities (`c3addon`)

This tool helps you to build and distribute your Construct 3 Addons.

> C3 Addon SDK Documentation: https://www.construct.net/br/make-games/manuals/addon-sdk

See [TODO](#todo) for ideas for this tool. Feel free to open issues to propose new ideas.

## Requirements

Node.js v8.0.0+

## Installation

```
npm install -g c3addon
```

## Commands

### `c3addon init`

Bootstrap an empty addon project.

### `c3addon serve`

Start an http server to test your addon on [Construct 3 Editor](https://editor.construct.net/).

### `c3addon pack`

Pack your addon into a `name.c3addon` file, ready to be uploaded to the addon
server.

### `c3addon docs`

Generate documentation based on your addon's `aces.json` + language files.

## TODO

- A `watch` command to watch and validate for ACEs and their language attributes. It's very annoying to refresh the editor and see error messages regarding missing language entries.
- Implement the `docs` command - to generate a user-friendly list of actions, conditions and expressions.
- On `init` command, use [inquirer](https://github.com/SBoudrias/Inquirer.js/) and ask the user for addon name, description, and all its basic properties.

## License

MIT
