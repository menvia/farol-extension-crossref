# Farol Extension for Lahar

## Install

### Using NPM

- To install, run:
  `npm install farol-extension-registration-custom`

- To update, run:
  `npm update farol-extension-registration-custom`

## Develop

### NPM

Use `npm link` in the API project repository inside the extensions folder in order to store the link name and path in NPM.

On the project used to develop the library you can run `npm link farol-extension-registration-custom` and it will start using the development version from your API.

## Publish

In order to release a new version you shall follow the steps bellow:

1. Make the desired changes;
2. Update CHANGELOG.md file;
3. Commit your changes;
4. Run the commands below:

- Run

```
  npm version patch
  FAROL_SDK_VERSION=$(npx -c 'echo "$npm_package_version"')
  git commit -am"${FAROL_SDK_VERSION}"
  git tag ${FAROL_SDK_VERSION}
  git push && git push --tags
```
