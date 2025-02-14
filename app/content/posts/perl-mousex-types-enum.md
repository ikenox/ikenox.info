---
title: MouseX::Types::Enum - PerlでJavaのenum(列挙型)のようなクラスを実現するモジュール
date: '2018-05-20'
---

[MouseX::Types::Enum](https://metacpan.org/pod/MouseX::Types::Enum)

Java の`enum`型のように、フィールドやメソッドを持つ列挙型を Perl でも使いたくなったので、`MouseX::Types::Enum`というモジュールを作りました。

### Dependencies

[Mouse](https://metacpan.org/pod/Mouse)の拡張モジュールとして作ったので、Mouse に依存しています。

## 使用例

`MouseX::Types::Enum`では、Java の列挙型のように各列挙定数がメンバ変数やメソッドを持つことが可能です。
使用例を以下に示します。この例では、

- `APPLE`, `ORANGE`, `BANANA`という 3 つの列挙定数を定義しました。`use`句で`MouseX::Types::Enum`
  を呼び出す際に、定義したい列挙定数の配列を渡してあげます。
- 列挙定数に`name`, `color`, `has_seed`というメンバ変数を定義しました。メンバ変数の定義には Mouse の文法である`has`が使えます。
- `make_sentence`というメソッドを定義しました。引数やメンバ変数をもとに文字列を組み立てて返します。

```perl
package Fruits;

use Mouse;
use MouseX::Types::Enum (
    APPLE  => { name => 'Apple', color => 'red' },
    ORANGE => { name => 'Cherry', color => 'red' },
    BANANA => { name => 'Banana', color => 'yellow', has_seed => 0 }
);

has name => (is => 'ro', isa => 'Str');
has color => (is => 'ro', isa => 'Str');
has has_seed => (is => 'ro', isa => 'Int', default => 1);

sub make_sentence {
    my ($self, $suffix) = @_;
    $suffix ||= "";
    return sprintf("%s is %s%s", $self->name, $self->color, $suffix);
}

__PACKAGE__->meta->make_immutable;
```

```perl
use Fruits;

Fruits->APPLE == Fruits->APPLE; # 1
Fruits->APPLE == Fruits->ORANGE; # ''
Fruits->APPLE->to_string; # 'APPLE'

Fruits->APPLE->name; # 'Apple';
Fruits->APPLE->color; # 'red'
Fruits->APPLE->has_seed; # 1

Fruits->APPLE->make_sentence('!!!'); # 'Apple is red!!!'

Fruits->enums; # { APPLE  => Fruits->APPLE, ORANGE => Fruits->ORANGE, BANANA => Fruits->BANANA }
```

### メンバ変数が不要な場合の宣言方法

メンバ変数が不要な場合は、以下のようにも宣言できます。

```perl
package Day;

use MouseX::Types::Enum qw/
    Sun
    Mon
    Tue
    Wed
    Thu
    Fri
    Sat
/;

__PACKAGE__->meta->make_immutable;
```

```perl
use Day;

Day->Sun == Day->Sun; # 1
Day->Sun == Day->Mon; # ''
Day->Sun->to_string;  # 'APPLE'
Day->enums; # { Sun => Day->Sun, Mon => Day->Mon, ... }
```

## 備考

Java の`enum`型は`ordinal()`というインスタンスメソッドを持っており、各列挙定数から呼ぶとその列挙定数の序数(ユニークな数値)
を返してくれます。
しかし、序数は列挙定数の宣言順に決まるため、列挙定数の宣言順が変化するとそれらに対応する序数も変わってしまうという性質があります。
そのため、`ordinal()`
で取得した序数がどこかで永続化された後に列挙定数の宣言順を入れ替えたり、新たな宣言を既存の列挙定数の宣言の間に追加したような場合に、序数に不整合が生じてしまうことが懸念されます。

この挙動は予期せぬバグを引き起こす可能性があるため、`MouseX::Types::Enum`では`ordinal()`
メソッドや序数の概念は定義しないことにしました。
コードが増えることとのトレードオフではありますが、数値 ⇔ 列挙定数のマッピングは明示的にコード内のどこかに書くのが良いのではないかと考えています。
