---
title: 'I wrote "h2s", a library for declaratively scraping HTML in Rust'
createdAt: '2023-05-01'
---

## h2s

- crates.io: <https://crates.io/crates/h2s>
- Repository: <https://github.com/ikenox/h2s-rs>

It's `html-to-struct`, hence `h2s`.

## Selling points

- You can describe scraping logic declaratively
- A simple yet flexible interface
- You get detailed information about the cause of errors

I'll go into detail below.

## How to use

1. Define, as a struct, what structure you expect of the HTML document you want to scrape
2. Call `h2s::parse(html)`
3. The scraping result is returned populated into the struct
   - If the defined struct doesn't match the structure of the HTML document, an error is returned

### Example

As an example, suppose you want to scrape the following HTML document.

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

You define the structure you expect of the HTML document as a struct. For each field of the struct, you describe a CSS selector as an attribute.
One example would look like this.

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

After that, calling `h2s::parse` runs the scraping.

```rust
let page: Page = h2s::parse("(the HTML document described above)").unwrap();
```

As a result, the struct you defined first is returned populated with the scraped values.

```rust
// Verify that scraping succeeded correctly
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

As struct fields, in addition to string and numeric types, you can specify `Option`, `Vec`, nesting of other structs, and so on—essentially everything you're likely to need in real use cases is supported.

## Advantages of this library

### You can describe scraping logic declaratively

With the traditional, procedural approach to scraping, the logic for traversing the HTML document tends to become verbose, and it tends to become hard to read from the actual code "what structure is expected of the HTML document." If you try to do it properly, a lot of non-essential logic such as error handling also gets mixed in, which tends to make it even more cluttered.

With h2s, if you define "what structure you expect of the HTML document," that definition works as is, so compared to the procedural approach the logic is much clearer, and it's easier both to write and to read.

### A simple yet flexible interface

This partly overlaps with the declarative aspect, but I aimed for a library simple enough that you can understand how to use it without getting lost just by glancing at a code example.

At the same time, I was conscious about carefully defining and exposing traits as a library, so that users can appropriately extend the library in various places. For example, if you want to specify, as a leaf field of a struct definition, your own struct or a struct that h2s doesn't support by default in addition to `String` or `usize`, you can make it usable by implementing a specific trait on that struct ([code example](https://github.com/ikenox/h2s-rs/blob/aa8dec4/examples/from_text_custom.rs)).

### You get detailed information about the cause of errors

A prior library that takes the same approach as h2s is [unhtml](https://docs.rs/unhtml/0.8.0/unhtml/), but it had the problem that when the HTML document wasn't the expected structure, you couldn't tell the specific location or cause of the problem ([the author seems to be aware of this too](https://github.com/Hexilee/unhtml.rs/blob/master/unhtml/src/err.rs#L3)).
Since that library also seems to have been unmaintained for a while, "I might as well write one myself" was part of the original motivation for creating h2s.

In h2s, when the structure of the HTML document doesn't match expectations and an error occurs, I return a message that lets you tell "what didn't match where." This should make debugging and investigating errors easier.

To show an example of an error, let me run scraping again with part of the earlier HTML document commented out, as below.

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
          <!-- partially commented out -->
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

Then, because the HTML document doesn't match the expected structure, h2s returns an error. Where and what kind of error occurred is held inside the error as a stack structure, and `.to_string()` gives an error message like the following.

```
[articles(.articles > div)]: (index=2): [title(h2 > a)]: expected exactly one element, but no elements found
```

This error can be read as "in the 3rd element (`index=2`) of `articles` (the elements matching `.articles > div`), `title` (the element matching `h2 > a`) cannot be found," so you can tell the detailed location of the error's cause.

As another example, when the number of elements doesn't match expectations, it properly detects that and emits an error to that effect.

```rust
/// Example: when an element expected to exist only once is found more than once
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
/// Example: when an element expected to exist exactly 3 times is found only twice
#[derive(FromHtml, Debug, Eq, PartialEq)]
pub struct MyStruct2 {
    #[h2s(select = "h2")]
    h2: [usize; 3],
}

let err = h2s::parse::<MyStruct2>("<div><h2>1</h2><h2>2</h2></div>").unwrap_err();

println!("{}", err.to_string());
// => [h2(h2)]: expected 3 elements, but found 2 elements
```

## Other things I was particular about

These probably don't have much impact on usability, but they're points I personally worked hard on.

### The backend HTML parser library is swappable

h2s itself doesn't have the logic for parsing an HTML document from a string or traversing the DOM; it relies on [scraper](https://docs.rs/scraper/latest/scraper/) behind the scenes for that. However, the core of h2s doesn't depend directly on scraper, and it's structured so that other libraries can be used as the backend by implementing [a specific trait](https://github.com/ikenox/h2s-rs/blob/10b277c/core/src/lib.rs#L26).

Is there actually demand for swapping it out? If you ask me, the answer is: probably not really.

### Use of Generic Associated Types

While writing the core logic of h2s, situations came up like "I want to apply `fn(T) -> U` to `T`, `Vec<T>`, and `Option<T>` without distinguishing between them," and when I tried to write that cleanly I wanted to implement something close to a Functor in functional programming terms, which required GATs, so I used them.

The processing in h2s of traversing the HTML tree and fitting it into a struct has the prospect of being writable quite neatly by bringing in concepts from functional programming such as Functors, but at present I'm only able to leverage that halfway.
The expressiveness of Rust's current GATs is said to be insufficient to express concepts like Functor or Monad[^monad], and indeed what I implemented in h2s ended up being a half-baked Functor-like thing, which leads to the problem that parts that could in principle be unified aren't unified.
At present I have to admit that using GATs was largely within the realm of a hobby, and as a result it ended up requiring Rust 1.65 or higher (where GATs became stable), so I get the feeling the downsides might outweigh the benefits.
If GATs get more powerful in the future, or some improvement is made as a separate feature, I'd like to actively incorporate it into h2s as well.

[^monad]: https://zenn.dev/yyu/articles/f60ed5ba1dd9d5

## Future work

- When multiple errors occur in parallel, I can currently only return the first one, so ideally I'd like to be able to return all of them.
- I haven't been able to provide an OR-style expression like "exactly one of these elements is always included," so I think it would be good to support `enum` to cover that kind of thing.
- I think it would be fun to be able to support generic structs.

## Summary

I've actually been using h2s in a scraping system I run as a personal hobby, and so far it's been pleasant to use.
I have the sense that, for the small amount of source code and small number of public interfaces in h2s, it behaves flexibly and richly, and I think it turned out pretty well.
Please give it a try if you'd like.
