jira_instance_url
=================

| Date | Depreciate Version |
| ---- | ------------------ |
| 2/24/24 | 1.1 |

# Introduction

This is in regards to the setting variable `jira_instance_url` which represented the Jira instance for a user. Originally written with one Jira instance in mind, this was sutable, but with the upgrade to 1.1, in order to support multiple jira instances easily, it was opted to change the storage object from a single string variable to an array. Additionally it was no longer just a string but an object of `JiraInstanceUrl` which allowed us to have more information if desired. For version 1.1 it included other items such as a label/title for the url and if it was the default url.

# The Issue

The main issue is that using a string array is fine, but how do we upgrade users without losing their Jira instance.

# The Fix

The solution that I decided upon is a piece of code that would move the `jira_instance_url` variable and put it into the new array with default settings. This would make it simple and seamless for users to upgrade without having to enter in their existing data.
