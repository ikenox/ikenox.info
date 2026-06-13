---
title: 'MouseX::Types::Enum - A module for writing Java-style enum (enumerated type) classes in Perl'
createdAt: '2018-05-20'
---

[MouseX::Types::Enum](https://metacpan.org/pod/MouseX::Types::Enum)

I wanted to use enumerated types with fields and methods in Perl, just like Java's `enum` type, so I created a module called `MouseX::Types::Enum`.

### Dependencies

I built it as an extension of [Mouse](https://metacpan.org/pod/Mouse), so it depends on Mouse.

## Usage example

With `MouseX::Types::Enum`, each enum constant can have member variables and methods, just like Java's enumerated types.
Here is an example of how to use it. In this example:

- I defined three enum constants: `APPLE`, `ORANGE`, and `BANANA`. When calling `MouseX::Types::Enum`
  in the `use` statement, you pass it the array of enum constants you want to define.
- I defined member variables `name`, `color`, and `has_seed` on the enum constants. You can use Mouse's `has` syntax to define member variables.
- I defined a method called `make_sentence`. It builds and returns a string based on the arguments and member variables.

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

### How to declare when member variables aren't needed

If you don't need member variables, you can also declare them like this:

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

## Notes

Java's `enum` type has an instance method called `ordinal()`. When called on an enum constant, it returns that constant's ordinal (a unique number).
However, because the ordinal is determined by the declaration order of the enum constants, it has the property that changing the declaration order also changes the corresponding ordinals.
For this reason, if you persist an ordinal obtained via `ordinal()` somewhere and then later reorder the enum constants, or insert a new declaration between existing ones, there's a risk that the ordinals will become inconsistent.

Since this behavior can lead to unexpected bugs, I decided not to define an `ordinal()` method or the concept of ordinals in `MouseX::Types::Enum`.
It's a trade-off against having to write more code, but I think it's better to write the number ⇔ enum constant mapping explicitly somewhere in your code.
