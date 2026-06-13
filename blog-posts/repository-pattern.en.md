---
title: 'Dealing with the global variable called a database (Repository Pattern)'
createdAt: '2019-01-12'
---

## Global variables

A global variable is a variable that can be accessed from anywhere in a program, regardless of scope.
Because of this nature, it must be handled with care. Mishandling it can lead to problems such as "it becomes hard to grasp when and where the variable gets rewritten, which makes the program harder to reason about."

## A database is a global variable

Data stored in a database such as MySQL has the same nature as a global variable. Through SQL queries and the like, it can be accessed and rewritten from anywhere in the program.
"You have to be very careful with global variables, or things will go badly" is a widely shared understanding, but when it comes to "a database is a global variable," I get the feeling that it isn't always kept in the back of our minds.

As a result, in real-world development it is easy for the phenomenon of "the global variable called a database being treated carelessly without anyone intending to" to occur.
So if you are not careful, the very problem usually cited as a downside of global variables—"it becomes hard to grasp when and where the variable gets rewritten, which makes the program harder to reason about"—happens all too easily.
The result is that the logic for updating rows in a table ends up scattered across all sorts of places, and it becomes completely impossible to see "what value column Y of table X should take under which conditions and states, and where and how it is used." Unable to fully grasp the specification, someone adds new update logic based on vibes, and ends up unintentionally breaking data consistency, or giving birth to an `updated_at` that only gets updated on a whim.

These problems become more serious the more the service grows and the larger the codebase becomes. Developers end up spending most of their working hours grepping the entire codebase every time they make a change, development speed drops, and every time they touch the code they play a game of Russian roulette that wears down their mental health.

## Repository Pattern

One possible solution to this problem is the Repository pattern.
Let me write some simple pseudocode using the Repository pattern.

```java
class HogeRepository {

  public Hoge get(int id) {
    Row row = db.execute("SELECT id, a, b FROM hoge where id=?", id);
    return new Hoge(row.getInt('id'), row.getInt('a'), row.getStr('b'));
  }

  public void save(Hoge hoge) {
    db.execute("INSERT INTO hoge VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ...", hoge.id, hoge.a,
        hoge.b);
  }
}

class Hoge {

  int id;
  int a;
  String b;

  public Hoge(int id, int a, String b) {
    this.id = id;
    this.a = a;
    this.b = b;
  }

  public void changeState() {
    this.a = this.a * 10;
    this.b = this.b + " foo";
  }
}

// Example of using the Repository
class SomeApplicationService {

  HogeRepository hogeRepository;

  public void sampleProcess() {
    Hoge hoge = hogeRepository.get(id);
    hoge.changeState();
    hogeRepository.save(hoge);
  }
}
```

**The role of a Repository is solely "to retrieve and persist a certain object."**
A Repository does not get involved at all in logic such as changes to an object's state; it only needs to flawlessly handle "how to persist the object to the database" and "how to restore the object from the database."
Conceptually, what it does is close to serialization and deserialization between an object and JSON.

This code snippet written in the Repository pattern has the following characteristics.

- It separates "persisting/retrieving `Hoge` (the DB ⇔ object conversion logic)" from "changes to the internal state of `Hoge` (domain logic)."
- What `changeState()` on the `Hoge` object changes is only the internal state of the `Hoge` object. Since only the object's internal state changes, the DB is not involved at all, and naturally no DB update happens.
- The Repository simply pushes the `Hoge` object into the DB or pulls it out, exactly in its current state. Therefore the Repository does not need to know anything about when and how the internal state of `Hoge` changes.

And these characteristics mitigate the harm caused by the fact that a database is a global variable, in the following ways.

- The points of contact with the DB are kept to a minimum. Since the only windows for interacting with the DB are `get` and `save`, you can immediately grasp "where and how the `Hoge` table is referenced/updated."
- The role of keeping data consistent is enclosed inside the `Hoge` class, so no matter how you manipulate the `Hoge` object or the `HogeRepository` from the outside, data consistency will not break.
- "What value each field of the `Hoge` table can take under which conditions and states" can be grasped just by looking inside the logic of the Hoge object.

In addition, the Repository pattern has the following benefits.

- Tests involving the DB are kept to a minimum. You only need to write tests for "can a `Hoge` object be persisted correctly in its current state" and "can it be restored back into a `Hoge` object correctly." The update logic for the internal state of the `Hoge` object has nothing to do with the Repository.
- Even if future spec changes increase the patterns or logic for internal state changes, you do not need to add more update statements to the DB because of that.
  - The `HogeRepository` persists/retrieves `Hoge` exactly in its current state, so it does not matter how complicated the internal state changes get.
- Even if you change the DB from an RDB to something like a KVS, it will work as long as you rewrite only the reference/retrieval logic of the Repository.
  - Mocking the DB for tests also becomes easy. You can just swap in a Repository that merely holds objects in memory.

In this way, **by using the Repository pattern well, you can flexibly handle the complex internal state changes of the things your application deals with, decoupled from the DB.**
The Repository pattern has the effect of mitigating the pain caused by the fact that a DB is essentially a global variable.

Conversely, in cases like log data—where it is immutable once written and has no complex logic—you probably will not enjoy much of the benefit of the Repository pattern.
Let's use the Repository pattern in the right places to build flexible, easy-to-reason-about applications.
