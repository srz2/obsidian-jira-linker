# Jira Linker

This is a [Obsidian](https://obsidian.md) plugin enables the ability to quickly add either:
 - A web based url for a Jira issue
 - A local based uri for a local folder for an issue

## Commands Available
1. **Link Jira issue**

This will link to a Jira instance a given Jira Issue

Note: The *Jira Instance URL* must be set

2. **Link Jira issue to info**

This will link to a local file for a given Jira Issue. If the path does not exist, it will be created

Note: The *Local Issue Path* must be set
Note: You can optionally change the "main" file. It defaults to "_Info"

## Demo

![demo gif](./documentation/demo.gif)

## How to use

- Configure needed settings:
  -  Your Jira Instance URL
  -  Your local directory which is the root of issues
  -  Optionally configure the default "main" file
- Highlight your Jira Issue in the editor and invoke the **Link Jira issue** or **Link Jira issue to info** command
  - Additionally, you can have nothing selected and have a modal ask you for the Jira Issue
- The text will be replaced with the appropriately linked Jira issue