---
title: IdeaVimで「IntelliJでいつも使ってるあの機能」のaction名を探し当てる
date: '2019-06-11'
updatedDate: '2019-06-11'
---

## IdeaVim の action

IdeaVim では、`~/.ideavimrc`に設定を記述することでキーマップに任意の IntelliJ の機能(action)を割り当てることができる。
以下に設定の記述例を示す。

```vim
nnoremap gd :action GotoDeclaration<CR>
```

これは、「ノーマルモードで`gd`を入力すると、`GotoDeclaration`という action を実行する」というキーマップの設定である。
ここで`GotoDeclaration`というのは、関数や定数の定義元にジャンプする IntelliJ の機能であり、デフォルトだと`ctrl+B`(Mac なら`cmd+B`)
に割り当てられている。

このように、IdeaVim では、任意の IntelliJ の機能をキーマップに割り当てることができるようになっている。

## 「IntelliJ でいつも使ってるあの機能」の action 名の見つけ方

では、「IntelliJ でいつも使ってるあの機能」の action 名を探し当てるにはどうしたらよいのか。

IdeaVim では`:actionlist 文字列` コマンドによって、文字列に部分一致する action 名の検索が可能になっている。そして、
**IdeaVim の v0.51.2 からは、action 名の部分一致のほか、現在その action に割り当てられているショートカットキー
の部分一致でも検索できるようになった。**

これにより、目的の action 名が飛躍的に見つけやすくなった。
(
それまでは、肝心の action 名がわからないのに action
名の部分一致で検索するしかなかったので、頑張ってそれっぽい単語で検索してみて当たるまで繰り返すということをやるしかなかった)

### 例

`:actionlist <M-I>` で検索した場合

```
--- Actions ---
ImplementMethods                                   <M-I>
MethodHierarchy.ImplementMethodAction              <M-I>
```

`:actionlist <M-S-` で検索した場合

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
