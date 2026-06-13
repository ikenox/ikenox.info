---
title: 'Finding the action name of "that feature I always use in IntelliJ" with IdeaVim'
createdAt: '2019-06-11'
updatedDate: '2019-06-11'
---

## IdeaVim actions

In IdeaVim, by writing settings in `~/.ideavimrc` you can assign any IntelliJ feature (action) to a key mapping.
Here is an example of such a setting.

```vim
nnoremap gd :action GotoDeclaration<CR>
```

This is a key mapping that says, "when you type `gd` in normal mode, run the action called `GotoDeclaration`."
Here, `GotoDeclaration` is the IntelliJ feature that jumps to the definition of a function or constant, and by default it's assigned to `ctrl+B` (or `cmd+B` on Mac).

In this way, IdeaVim lets you assign any IntelliJ feature to a key mapping.

## How to find the action name of "that feature I always use in IntelliJ"

So, how do you find the action name of "that feature I always use in IntelliJ"?

In IdeaVim, the `:actionlist string` command lets you search for action names that partially match a given string. And
**starting from IdeaVim v0.51.2, in addition to partial matching on the action name, you can now also search by partial match on the shortcut key currently assigned to that action.**

This made it dramatically easier to find the action name you're looking for.
(
Before this, you had no way to search other than by partial match on the action name—even though the action name was exactly what you didn't know—so all you could do was try plausible-sounding words and repeat until you hit the right one.)

### Examples

When searching with `:actionlist <M-I>`:

```
--- Actions ---
ImplementMethods                                   <M-I>
MethodHierarchy.ImplementMethodAction              <M-I>
```

When searching with `:actionlist <M-S-`:

```
--- Actions ---
$Redo                                              <M-S-Z> <A-S-BS>
ActivateVersionControlToolWindow                   <M-9> <M-S-9>
ChangeTypeSignature                                <M-S-F6>
CloseActiveTab                                     <M-S-F4>
CollapseAllRegions                                 <M-S-m> <M-S-->
CollapseBlock                                      <M-S-.>
...
```
