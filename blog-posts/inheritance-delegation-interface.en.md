---
title: 'Choosing Between Inheritance and Delegation, and Why Interfaces Matter'
createdAt: '2018-08-28'
---

This article is my attempt to put into words how I think about questions like "What are the qualitative differences between inheritance and delegation, and on what basis do I choose between them?" and "What's so great about interfaces, anyway?"

## TL;DR

- Inheritance gives the child the same capabilities and responsibilities as the parent. Delegation only lets the child own the parent as a mere tool; the capabilities and responsibilities are not shared.
  - When the parent is just a tool from the child's perspective, delegation is the way to go. Using inheritance instead saddles the child with multiple responsibilities, which causes problems.
  - Conversely, when the child should carry the same responsibility as the parent, use inheritance. Using delegation leads to problems because the child doesn't have the same capabilities as the parent.
- Interfaces let you enforce a separation of responsibilities. If you can design your interfaces well, you improve the maintainability and robustness of the system—keeping the blast radius of changes to a minimum, for example—and you also gain testability.

## The difference between inheritance and delegation, and how to choose

As an example, suppose you're building "a feature that fetches and saves user information from a SQL database," and you arrive at the following implementation plan.

1. The logic that holds the DB connection state and executes SQL queries seems reusable (and you'd like to reuse it) not just for fetching user information, but for fetching information from the database in general.
2. So you carve out the reusable DB-operation parts into a class (let's call it the `Database` class), and have the `UserRepository` class—which fetches and saves user information—use the `Database` class somehow. That way the DB-operation features of the `Database` class can be reused, which feels nice.

Now, two ways of using the `Database` class from `UserRepository` come to mind: inheritance or delegation.
To cut to the chase, delegation is the better choice, but you might be tempted to reach for inheritance and write it like this.

### An example of using inheritance where delegation should be used

```java
class Database {

  void connectToDatabase(String dbHost, String dbName, ...) {
    // Logic for connecting to the DB
  }

  Result doSQL(String sql) {
    // Logic that issues a query to the connected DB and returns the result
  }

  // Other things, such as managing the DB connection state
}
```

```java
class UserRepository extends Database {

  User getUser(int userId) {
    String sql = String.format("SELECT * FROM users WHERE user_id=%d", userId);
    Result result = this.doSQL(sql)
    // Build a user object from the query result and return it
  }
}
```

In this inheritance-based implementation, because `UserRepository` extends `Database`, it gains the ability to behave just like a `Database`.
But that gives rise to a few unnatural things.

### The distortion caused by inheritance

Through inheritance, `UserRepository` has acquired not only its intended role of "fetching a particular user," but also the roles that `Database` carries: "holding the DB connection state and sending SQL queries to the DB." This violates the [Single Responsibility Principle](https://xn--97-273ae6a4irb6e2hsoiozc2g4b8082p.com/%E3%82%A8%E3%83%83%E3%82%BB%E3%82%A4/%E5%8D%98%E4%B8%80%E8%B2%AC%E4%BB%BB%E5%8E%9F%E5%89%87/).
From `UserRepository`'s point of view, `Database` is meant to be used merely as a tool for connecting to the DB—it has no desire to _become_ a `Database` itself.

### What happens when one class takes on multiple responsibilities

When a single class ends up carrying multiple responsibilities—through inheritance, for instance—the following downsides can arise.

- When you want to use the class expecting one responsibility, features you didn't ask for come along for the ride, lowering the class's reusability.
- It becomes harder to unit test.
  - In this example, it's difficult[^a] to mock only the DB-connection feature for testing, so testing `UserRepository` requires an actual DB.
  - For a single operation, the specifications arising from each of the multiple responsibilities get tangled together at the same time. Compared to a case where those responsibilities can be tested independently, the number of test cases balloons. What could have been `m + n` cases becomes `m × n` cases.
- When the parent class has public methods, those methods become callable as methods of the child class too. In this example, DB-operation methods that have nothing directly to do with "fetching a user" become available to callers of `UserRepository`, opening the door to `UserRepository` being used in ways it was never meant to be.

[^a]: In reality this phrasing isn't quite accurate—for instance, in Java you can mock methods however you like with a test mocking library, so it isn't actually much of a problem.

When you put two classes with different expected roles—like `UserRepository` and `Database`—into an inheritance relationship, several unnatural things crop up, as shown above.
In such cases, delegation is the more suitable choice.

### The example rewritten using delegation

`Database` stays exactly the same as before; `UserRepository` is what changes.

```java
class UserRepository {

  Database database;

  UserRepository(Database database) {
    // Set the Database instance when constructing the UserRepository instance
    this.database = database;
  }

  User getUser(int userId) {
    String sql = String.format("SELECT * FROM users WHERE user_id=%d", userId);
    Result result = this.database.doSQL(sql)
    // Build a user object from the query result and return it
  }
}
```

Instead of inheriting, it holds an instance of `Database` and calls into it as needed (**delegation**).
The `Database` instance is passed in via something like the constructor when the `UserRepository` object is created.

Since `UserRepository` doesn't inherit from `Database`, it can't behave as a `Database`, and it knows little about the implementation of things like the DB-connection logic. It is responsible only for the logic that converts DB data ⇔ User objects.
In this way, delegation lets you uphold the Single Responsibility Principle and also resolves the downsides of inheritance described earlier.
**When you want to use the features of a class whose expected role is different, delegation—not inheritance—is the appropriate choice.**

## When to use inheritance

Conversely, when "the child is expected to play the same role as the parent," inheritance is a good fit.

For example, consider a `Car` class and an `ElectoricCar` (electric car) class.
`Car` is broader in meaning and higher in abstraction than `ElectoricCar`, but whether you're using a `Car` or an `ElectoricCar`, you'd expect the same basic actions—"speed up / slow down," "open / close the windows"—to be possible.
Just as it's not wrong to rephrase "driving an electric car" as "driving a car," you could say that the roles expected of `Car` and `ElectoricCar` are, at their core, the same.

In a case like this, using delegation looks like the following.

### An example of using delegation where inheritance should be used

```java
class Car {

  void SpeedUp() {
    // ...
  }

  void OpenWindow() {
    // ...
  }

  // ...
}
```

```java
class ElectoricCar {

  Car car;

  void SpeedUp() {
    car.SpeedUp();
  }

  void OpenWindow() {
    car.OpenWindow();
  }

  // ...

  // Logic specific to electric cars
  void Charge() {
    // ...
  }
}
```

For every feature `Car` has—accelerating, decelerating, opening and closing windows—boilerplate code piles up in `ElectoricCar`. If `Car` gains a "turn on the lights" action, you have to change `ElectoricCar` too. And if you try to add a new `HybridCar`, things get truly unbearable to look at.
Furthermore, since the two classes have no inheritance relationship, in a language that doesn't allow duck typing you can't treat `ElectoricCar` as a `Car` as it stands.

### The example rewritten using inheritance

`Car` stays exactly the same as before; `ElectoricCar` is what changes.

```java
class ElectoricCar extends Car {

  // Logic specific to electric cars
  void Charge() {
    // ...
  }
}
```

Obvious as it may be, this is overwhelmingly cleaner than the delegation version. Even if `Car` changes—say, by gaining a new method—you generally don't need to change `ElectoricCar`. Because of the inheritance relationship, `ElectoricCar` can also behave as a `Car` type.
**When "the child is expected to play the same role as the parent," inheritance—not delegation—is the appropriate choice.**

## Recap so far

- When the child is expected to play the same role as the parent, use inheritance, which lets the child behave just like the parent.
- When the child is not expected to play the same role as the parent, the parent is most likely just a tool to the child, so use delegation.

## When to use interfaces

Thinking about `UserRepository` again: to put it bluntly, the caller of `UserRepository` just wants to be able to fetch the user, and it shouldn't matter whether what's behind the scenes is a database, a `.txt` file, in-memory storage, or anything else.
Cases like this—"the underlying implementation might involve complex state and so on, but as a user I don't care as long as my goal is achieved"—are often where interfaces come into play.
So let's create an interface called `IUserRepository` that plays the role of "fetching and saving users," and have `UserRepository` implement `IUserRepository`.

```java
interface IUserRepository {

  User getUser(int userId);

  void saveUser(User user);
}
```

```java
class UserRepository implements IUserRepository {

  Database database;

  UserRepository(Database database) {
    this.database = database;
  }

  User getUser(int userId) {
    String sql = String.format("SELECT * FROM users WHERE user_id=%d", userId);
    // ...
  }

  // ...
}
```

The logic on the side that uses `UserRepository` might look like this.

```java
class SomeApplicationService {

  IUserRepository userRepository;

  void changeUserEmail(String email) {
    User user = userRepository.getUser(userId);
    user.setEmail(email);
    userRepository.saveUser(user);
  }
}
```

Because `IUserRepository` is an interface, it says nothing whatsoever about the implementation. So `SomeApplicationService`, which uses `IUserRepository`, is **declaring in code that "I just expect to be able to fetch a user; I don't care about the implementation (and `SomeApplicationService` won't be affected by differences in the implementation)."**
The great appeal of interfaces is that they let you **explicitly define what should be exposed and what should be hidden—and enforce it.**

### The benefits of interfaces

You could say that the interface `IUserRepository` filters out the outside world with all its pains—DB connections, state management, gnarly SQL queries—and **exposes only a clean, abstract world where "somehow, beats me how, if I throw in a userId it nicely returns a user, and if I throw in a user it nicely saves the user."**

By interposing an interface, `SomeApplicationService` is freed from depending on `UserRepository`.
Thanks to this, even if the internal logic of `UserRepository` undergoes some massive change—even if the DB switches from MySQL to NoSQL—as long as the interface doesn't change, the change won't ripple all the way out to `SomeApplicationService`.

This property is a huge help during testing, too. For example, you can prepare an in-memory `InMemoryUserRepository` that implements `IUserRepository` for testing `SomeApplicationService`, and swap it in only during tests, which makes testing much easier.
In the same vein, with interfaces you can swap out, say, a class that "sends an email to a user" for one that "looks like it's sending but actually does nothing" only during tests.

### Why interfaces are important

Interfaces play an extremely important role in large-scale development.
My recent thinking is that as long as the interface is solid, the internal implementation can be somewhat sloppy and you'll be surprisingly fine.
Conversely, if you botch the interface design early on, by the time changes become necessary it's often already too late, and you'll be doing a rewrite accompanied by great suffering.
It's no exaggeration to say that the interface design determines whether a system's future maintainability and robustness will sink or swim—so when designing an interface, it pays to think carefully: Is this level of abstraction really appropriate? Am I receiving or passing more information than necessary? And so on.

### The concept of an interface

Up to this point I've been writing with Java's `interface` more or less in mind, but in languages that support duck typing there are cases where there's little need to define an interface class separately from the implementation. There are also languages that lack a language feature like Java's `interface`.
Even so, I believe the importance of interfaces is unchanged. The essence of an interface is "what information classes and objects expose in order to communicate with one another," and as long as a language gives you room to think about that, you're dealing with interfaces.
The only difference is whether a language feature that embodies the concept of an interface exists explicitly—the essential concept of an interface exists universally regardless of the programming language, and the fact that it's a very important concept remains the same.

## In closing

I've tried to explain inheritance, delegation, and interfaces in my own words.
If anything is unclear or you have questions, I'd be glad to hear them in the comments.
