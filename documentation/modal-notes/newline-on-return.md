New Line Insertion
==================

# Introduction

This came from [Issue #3](https://github.com/srz2/obsidian-jira-linker/issues/3) where a user asked for control if a new line is made when adding a Jira link. I never explicitly allowed manipulation for new lines but this but it was something I did notice as an annoyance during usage.

If you used the button "Add Link" in the `JiraIssueInputModal`, the text would be replaced as expected. But using the 'Return' key as a submission for the modal, a new line would be added.

# Investigation

What I found is that this is javascript's "default behavior" for form submission. Similar to submitting a `<form>` tag in html, where the page would reload, when pressing the return key, this would add the newline character after submission.

# The Fix

In order to fix this, I simply had to invoke the `preventDefaults()` method on the **keydown** event. Since the user suggested to have control over this, I made a *setting* to control if this invocation is done. By default, the normal behavior is preserved and the method is not called. But if a user changes the toggle for the new setting of **New Line Insertion** to *false*, they will be able to prevent the new line from being added.
