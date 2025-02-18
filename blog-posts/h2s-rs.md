---
title: 'RustでHTMLを宣言的にスクレイピングするためのライブラリ「h2s」を書いた'
date: '2023-05-01'
---

## h2s

- crates.io: <https://crates.io/crates/h2s>
- Repository: <https://github.com/ikenox/h2s-rs>

`html-to-struct` なので `h2s` です。

## アピールポイント

- スクレイピングロジックを宣言的に記述できる
- シンプルかつ柔軟なインターフェース
- エラー原因が詳細にわかる

詳細は後述します。

## 使い方

1. スクレイピング対象のHTMLドキュメントにどういう構造を期待するかをstructとして定義する
2. `h2s::parse(html)` を呼ぶ
3. スクレイピング結果がstructに入って返却される
   - 定義したstructとHTMLドキュメントの構造が合わない場合にはエラーが返る

### 例

例として、以下のようなHTMLドキュメントをスクレイピングしたいとします。

```html
<html lang="en">
  <body>
    <div>
      <h1 class="blog-title">My tech blog</h1>
      <div class="articles">
        <div>
          <h2><a href="https://example.com/1">article1</a></h2>
          <div><span>901</span> Views</div>
          <ul>
            <li>Tag1</li>
            <li>Tag2</li>
          </ul>
        </div>
        <div>
          <h2><a href="https://example.com/2">article2</a></h2>
          <div><span>849</span> Views</div>
          <ul></ul>
        </div>
        <div>
          <h2><a href="https://example.com/3">article3</a></h2>
          <div><span>103</span> Views</div>
          <ul>
            <li>Tag3</li>
          </ul>
        </div>
      </div>
    </div>
  </body>
</html>
```

HTMLドキュメントに期待する構造の定義をstructで行います。structの各フィールドにおいて、attributeでCSSSelectorを記述します。
一例としては以下のようになります。

```rust
#[derive(FromHtml, Debug, Eq, PartialEq)]
pub struct Page {
    #[h2s(attr = "lang")]
    lang: String,
    #[h2s(select = "div > h1.blog-title")]
    blog_title: String,
    #[h2s(select = ".articles > div")]
    articles: Vec<Article>,
}

#[derive(FromHtml, Debug, Eq, PartialEq)]
pub struct Article {
    #[h2s(select = "h2 > a")]
    title: String,
    #[h2s(select = "div > span")]
    view_count: usize,
    #[h2s(select = "h2 > a", attr = "href")]
    url: String,
    #[h2s(select = "ul > li")]
    tags: Vec<String>,
    #[h2s(select = "ul > li:nth-child(1)")]
    first_tag: Option<String>,
}
```

その後、`h2s::parse`を呼ぶとスクレイピングが実行されます。

```rust
let page: Page = h2s::parse("(前述したHTMLドキュメント)").unwrap();
```

結果として、初めに定義したstructにスクレイピングした値が入って返却されます。

```rust
// 正しくスクレイピングできていることを確認
assert_eq!(page, Page {
    lang: "en".to_string(),
    blog_title: "My tech blog".to_string(),
    articles: vec![
        Article {
            title: "article1".to_string(),
            url: "https://example.com/1".to_string(),
            view_count: 901,
            tags: vec!["Tag1".to_string(), "Tag2".to_string()],
            first_tag: Some("Tag1".to_string()),
        },
        Article {
            title: "article2".to_string(),
            url: "https://example.com/2".to_string(),
            view_count: 849,
            tags: vec![],
            first_tag: None,
        },
        Article {
            title: "article3".to_string(),
            url: "https://example.com/3".to_string(),
            view_count: 103,
            tags: vec!["Tag3".to_string()],
            first_tag: Some("Tag3".to_string()),
        },
    ]
});
```

structのフィールドに指定できるものとしては、文字列や数値型の他にも`Option`や`Vec`、また別のstructのネストなど、実際のユースケースで必要となりそうなものは一通りサポートしています。

## このライブラリの利点

### スクレイピングロジックを宣言的に記述できる

従来の手続き的なスクレイピングの方法だとHTMLドキュメントを走査していくロジックが冗長になりがちで、「HTMLドキュメントにどういう構造を期待しているか」が実際のコードからは読み取りづらいという状況になりやすいです。真面目にやろうとするとエラーハンドリングのような本筋でないロジックも多く混ざってくるため、より煩雑になりがちです。

h2sでは「HTMLドキュメントにどういう構造を期待しているか」を定義すればそれがそのまま動くので、手続的な方法に比べてロジックの見通しが良く、書くのも読むのも楽です。

### シンプルかつ柔軟なインターフェース

宣言的という特徴とも被る部分はありますが、コード例を一目見ただけで使い方が迷わずわかるくらいのシンプルなライブラリを目指しました。

一方で、ライブラリとしてtraitを丁寧に定義して公開することを意識しており、それによりユーザー側でライブラリ各所において適切に拡張ができるようにしています。
例えば、struct 定義の末端のフィールドとして、`String`や`usize`などの他に自前の構造体やh2sがデフォルトでサポートしていない構造体を指定したい場合は、その構造体に特定のtraitを実装することで利用できるようになります([コード例](https://github.com/ikenox/h2s-rs/blob/aa8dec4/examples/from_text_custom.rs))。

### エラー原因が詳細にわかる

h2sと同じアプローチを取っている先行のライブラリに [unhtml](https://docs.rs/unhtml/0.8.0/unhtml/)がありますが、こちらのライブラリではHTMLドキュメントが期待した構造ではなかった際に、具体的な問題の箇所や原因がわからないという課題がありました（[作者も認識してそう](https://github.com/Hexilee/unhtml.rs/blob/master/unhtml/src/err.rs#L3)）。
このライブラリがしばらくメンテも止まってそうということもあり、せっかくなら自分で書いてみるかというのがh2sを作った元々のモチベーションでもあります。

h2sではHTMLドキュメントの構造が期待と合わずエラーとなった際、「どこがどうマッチしなかったか」がわかるようなメッセージで返却するようにしています。これによりデバッグやエラーの調査が楽になることが期待できます。

エラーの例を示すため、以下のように先ほどのHTMLドキュメントの一部をコメントアウトした状態で再度スクレイピングを実行してみます。

```html
<html lang="en">
  <body>
    <div>
      <h1 class="blog-title">My tech blog</h1>
      <div class="articles">
        <div>
          <h2><a href="https://example.com/1">article1</a></h2>
          <div><span>901</span> Views</div>
          <ul>
            <li>Tag1</li>
            <li>Tag2</li>
          </ul>
          <p class="modified-date">2020-05-01</p>
        </div>
        <div>
          <h2><a href="https://example.com/2">article2</a></h2>
          <div><span>849</span> Views</div>
          <ul></ul>
          <p class="modified-date">2020-03-30</p>
        </div>
        <div>
          <!-- 一部をコメントアウト -->
          <!-- <h2><a href="https://example.com/3">article3</a></h2> -->
          <div><span>103</span> Views</div>
          <ul>
            <li>Tag3</li>
          </ul>
        </div>
      </div>
    </div>
  </body>
</html>
```

すると、HTMLドキュメントが期待している構造と合わないため h2s からエラーが返却されます。どの位置でどういったエラーが起きたかはエラー内部にスタック構造で保持されており、`.to_string()`で以下のようなエラーメッセージが得られます。

```
[articles(.articles > div)]: (index=2): [title(h2 > a)]: expected exactly one element, but no elements found
```

このエラーは、「`articles`(`.articles > dev`にマッチする要素)の3番目(`index=2`)の要素において、
`title`(`h2 > a`にマッチする要素)が見つからない」と読むことができ、詳細なエラーの原因箇所がわかるようになっています。

そのほか一例としては、要素数が想定と合わない場合などもきちんと検知し、その旨のエラーが出ます。

```rust
/// 例: 1つしか存在しない想定の要素が1つ以上見つかった場合
#[derive(FromHtml, Debug, Eq, PartialEq)]
pub struct MyStruct1 {
    #[h2s(select = "h1")]
    h1: usize,
}

let err = h2s::parse::<MyStruct1>("<div><h1>1</h1><h1>2</h1></div>").unwrap_err();

println!("{}", err.to_string());
// => [h1(h1)]: expected exactly one element, but 2 elements found
```

```rust
/// 例: ちょうど3つ存在する想定の要素が2つしか見つからなかった場合
#[derive(FromHtml, Debug, Eq, PartialEq)]
pub struct MyStruct2 {
    #[h2s(select = "h2")]
    h2: [usize; 3],
}

let err = h2s::parse::<MyStruct2>("<div><h2>1</h2><h2>2</h2></div>").unwrap_err();

println!("{}", err.to_string());
// => [h2(h2)]: expected 3 elements, but found 2 elements
```

## その他のこだわり

ユーザビリティにはあんまり影響しなさそうだけど個人的に頑張った点です。

### バックエンドの HTML パーサーライブラリを差し替え可能

h2sはHTMLドキュメントを文字列からパースしたり、DOMを走査したりするロジック自体は持っておらず、そこは裏で [scraper](https://docs.rs/scraper/latest/scraper/)を利用させてもらっています。ただし、h2sのコアからはscraperには直接依存せず、[特定の trait](https://github.com/ikenox/h2s-rs/blob/10b277c/core/src/lib.rs#L26)を実装すれば他のライブラリもバックエンドとして利用できるような構成にしています。

実際差し替える需要とかあるの？と言われると、あんまりなさそうですねとなります。

### Generic Associated Types の利用

h2sのコアロジックを書くにあたって「`T`と`Vec<T>`と`Option<T>`を区別せず`fn(T) -> U`を適用したい」みたいな場面が出てきて、それを綺麗に書こうしたところ関数型プログラミングでいうところのFunctorに近いものを実装したくなり、そこでGATsが必要になって使いました。

HTMLのツリーを走査してstructに当てはめていくというh2sの処理は、Functorをはじめとする関数型プログラミングの概念を持ち込むことでかなりスッキリ書けそうな見通しはあるのですが、現時点では半端にしか活かせていない状況です。
現状のRustのGATsの表現力ではFunctorやMonadのような概念を表現するには不十分であるとされており[^monad]、実際h2sで実装したのもFunctorもどきの半端なものとなってしまい、それによって本来共通化できそうな部分の処理が共通化できていないといった課題があります。
現時点ではGATsを利用したのはかなり趣味の範疇であると言わざるを得ず、結果としてGATsがstableになったRust1.65以上を要求するようになってしまったので、デメリットの方がでかいのではないかという気はしています。
今後GATsがパワーアップするかもしくは別のfeatureとして何らかの改善がなされたら、積極的にh2sにも取り込みたいなと思っています。

[^monad]: https://zenn.dev/yyu/articles/f60ed5ba1dd9d5

## 今後の課題

- 並行して複数のエラーが発生した時にも先頭の1つしか返せてないので、理想的には全部返せるようにしたいです。
- 「この中のいずれかの要素が必ず一つ含まれる」みたいなORの表現を提供できていないので、`enum`をサポートしてその辺をカバーできると良さそうだなと思っています。
- Genericな構造体をサポートできたら楽しそうだなと思っています。

## まとめ

個人の趣味で運用しているスクレイピングのシステムにて実際にh2sを使ってみているのですが、今のところ気持ちよく使えています。
h2sのソースコード量やpublicなインターフェース数の少なさの割には柔軟に豊かな振る舞いをしてくれているような感覚があり、結構よくできたんじゃないかなと思っています。
よかったら使ってみてください。
