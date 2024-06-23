import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;
const parse = targetVersion.split('.')
const newTargetVersion = `${parse[0]}.${parse[1]}.${parseInt(parse[2]) + 1}`;

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = newTargetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t") + "\n");

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
versions[newTargetVersion] = versions[targetVersion];
delete versions[targetVersion];
writeFileSync("versions.json", JSON.stringify(versions, null, "\t") + "\n");

// update package.json with target version
let packages = JSON.parse(readFileSync("package.json", "utf8"));
packages.version = newTargetVersion;
writeFileSync("package.json", JSON.stringify(packages, null, "\t") + "\n");

// update package-lock.json with target version
let packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
packageLock.version = newTargetVersion;
packageLock["packages"][""].version = newTargetVersion
writeFileSync("package-lock.json", JSON.stringify(packageLock, null, "\t") + "\n");
