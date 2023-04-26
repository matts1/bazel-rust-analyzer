# bazel-rust-analyzer README

## Features

* Automatically generate rust-project.json and configures automatic linting with bazel.

## Requirements

Currently requires using a [custom](https://github.com/matts1/rules_rust/tree/alchemy_v2) rules_rust. Hopefully will soon be able to be pushed into upstream rules_rust.

Add the following to your bazelrc:
```
build --@rules_rust//:output_diagnostics=true --output_groups=+rust_lib_rustc_output,+rust_metadata_rustc_output
```

## Extension Settings
* `bazel-rust-analyzer.genRustProjectCommand`: Custom command to generate a rust project
* `bazel-rust-analyzer.autoGenRustProjectCommand`: Whether to automatically generate a rust project when a new `.rs` file is opened (default: `false`).

## Usage
* Control shift P > "Generate a rust-project.json for all open files" to tell rust-analyzer to configure a watcher to pay attention to all `.rs` files currently open in bazel.
* When a bazel target including any rust files that were open at the time you invoked the previous command is built:
  * If the build fails, the errors should be analyzed and highlighted in the editor.
  * If the build succeeds, rust-analyzer should be able to analyze your target for file types and analyze your dependencies.

## Known Issues

None so far

## Release Notes

### 0.0.1

Initial release of bazel-rust-analyzer
