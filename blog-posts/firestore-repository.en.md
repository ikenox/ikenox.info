---
title: 'I built "firestore-repository", a lightweight Firestore client written in TypeScript'
createdAt: '2025-02-19'
updatedAt: '2026-06-13'
---

## firestore-repository

- npm: [firestore-repository](https://www.npmjs.com/package/firestore-repository)
- GitHub: [ikenox/firestore-repository](https://github.com/ikenox/firestore-repository)

## Features

- Provides a Firestore client in the so-called Repository pattern
- Avoids introducing its own concepts or complex mechanisms as much as possible, staying a thin wrapper over the official library
- Document data is represented as POJOs, so application code is less likely to become tightly coupled to the library
- Supports both the backend (Node.js) and the web frontend. Since the interface is also shared, schemas, query definitions, and so on can be shared between backend and frontend

### Why I built it

Using Firestore's official client library raw felt inconvenient in the following ways.

- When you read a document using the official client, you get back an object called `DocumentSnapshot`, and this object has various metadata-ish things attached. You can extract the pure data body with `.data()`, but the document's ID is not included inside `.data()`, so if you try to carry the data and ID together you end up passing the `DocumentSnapshot` itself around in the app, which results in the whole app being tightly coupled to the Firestore library.
  - If you try to avoid the tight coupling, you end up preparing a layer per collection that converts `DocumentSnapshot` into a POJO yourself, which is a hassle in its own right.
- Document data basically isn't typed. There is a mechanism called `withConverter`, and using it you can type the value returned by `.data()`, but combined with the aforementioned problem of the ID being separate from the data body, in the end it's subtly not that pleasant to use.
- The official client library also comes in backend and frontend flavors, but the interfaces aren't compatible, so if, for example, you want to share schema definitions between backend and frontend, you need some workarounds.

As an official library, these are kind of unavoidable; I figured what an official library can offer is limited (it has to be unopinionated), so I thought I'd write a simple wrapper myself to resolve these things.

## How to use

### Installation

```shell
# When using it on the backend
npm install firestore-repository @firestore-repository/google-cloud-firestore

# When using it on the frontend
npm install firestore-repository @firestore-repository/firebase-js-sdk
```

### Define a schema

First, define the collection's schema. This schema definition can be shared between backend and frontend.\
By sharing the schema, you can read (and write) documents of the same collection consistently on both the frontend and the backend.

```ts
import {
  rootCollection,
  string,
  double,
  map,
  optional,
  literal,
  array,
} from 'firestore-repository/schema';

// define a collection
const users = rootCollection({
  name: 'Users',
  schema: {
    name: string(),
    profile: map({
      age: double(),
      gender: optional(literal('male', 'female')),
    }),
    tag: array(string()),
  },
});
```

Note: In a schema definition, you specify the collection name (`name`) and the type of each field of the document data (`schema`). As field types, in addition to primitive types such as `string` / `double` / `bool` / `timestamp`, a full set is provided—`map` (a nested object), `array`, `union`, `literal`, `optional` / `nullable`, and so on—and you can express a schema by combining these.\
By default, documents are read and written as a simple model of the form `{ id, data }`, but if you want to convert them into your app's own model type, you can customize that with the `Mapper` described later.

### Create a Repository instance

Using the schema defined in the previous step and the official library's DB object, create a Repository instance.

```ts
// For backend
import { Firestore } from '@google-cloud/firestore';
import { rootCollectionRepository } from '@firestore-repository/google-cloud-firestore';
const db = new Firestore();

// For web frontend
import { getFirestore } from '@firebase/firestore';
import { rootCollectionRepository } from '@firestore-repository/firebase-js-sdk';
const db = getFirestore();

const repository = rootCollectionRepository(db, users);
```

That's all the preparation needed; after that you can perform various operations through the created Repository instance.

### Basic read/write operations

You can perform a full set of basic document read/write operations in a typed manner. You can also subscribe to real-time updates.\
The data types of the return values and arguments of `get` and `set` are simple POJOs derived in accordance with the schema definition, so you can keep your application code loosely coupled to Firestore.

The Repository interface is also shared between backend and frontend. (There are some increments, such as backend-only methods added on the backend side.)

```ts
// Set a document
await repository.set({
  id: 'user1',
  data: {
    name: 'John Doe',
    profile: { age: 42, gender: 'male' },
    tag: ['new'],
  },
});

// Get a document
const doc = await repository.get('user1');
// doc = {
//   id: 'user1',
//   data: {
//     name: 'John Doe',
//     profile: { age: 42, gender: 'male' },
//     tag: ['new'],
//   },
// }

// Listen a document
repository.getOnSnapshot('user1', (doc) => {
  console.log(doc);
});

// Delete a document
await repository.delete('user2');
```

### Queries

For queries too, you can perform the full set of condition specifications and aggregation operations supported by the official Firestore client.\
You can also subscribe to real-time updates.

Query definitions can also be shared between backend and frontend.

```ts
import { eq, gte, limit, query, where } from 'firestore-repository/query';
import { average, count, sum } from 'firestore-repository/aggregate';

// Define a query
const q = query(
  { collection: users },
  where(gte('profile.age', 20), eq('profile.gender', 'male')),
  limit(10)
);

// List documents
const docs = await repository.list(q);
console.log(docs);

// Listen documents
repository.listOnSnapshot(q, (docs) => {
  console.log(docs);
});

// Aggregate
const result = await repository.aggregate(q, {
  avgAge: average('profile.age'),
  sumAge: sum('profile.age'),
  count: count(),
});
console.log(`avg:${result.avgAge} sum:${result.sumAge} count:${result.count}`);
```

Query condition specifications are also typed.\
Field names are auto-completed, and if you specify a field name that doesn't exist, a compile error properly occurs.\
Also, if the specified value doesn't match the field's type, that too becomes a compile error.

```ts
const validQuery = query({ collection: users }, where(gte('profile.age', 20)));

// `profile.foo` => compile error because the field name isn't defined in the schema
const invalidQuery1 = query(
  { collection: users },
  where(gte('profile.foo', 20))
);

// `'foo'` => compile error because it isn't a numeric type
const invalidQuery2 = query(
  { collection: users },
  where(gte('profile.age', 'foo'))
);
```

### Batch operations

Methods are provided that allow `set` or `delete` in bulk.\
`batchGet` is currently supported only on the backend side[^1].

```ts
// Set multiple documents
await repository.batchSet([
  {
    id: 'user1',
    data: {
      name: 'Alice',
      profile: { age: 30, gender: 'female' },
      tag: ['new'],
    },
  },
  {
    id: 'user2',
    data: { name: 'Bob', profile: { age: 20, gender: 'male' }, tag: [] },
  },
]);

// Delete multiple documents
await repository.batchDelete(['user1', 'user2']);

// Get multiple documents (backend only)
const users = await repository.batchGet(['user1', 'user2']);
```

Also, the second argument of the various write methods such as `set` and `delete` lets you pass the official library's batch object via the `tx` parameter, and by using it you can combine write operations of multiple kinds into a single batch.

```ts
// For backend
const batch = db.batch();
// For web frontend
import { writeBatch } from '@firebase/firestore';
const batch = writeBatch(db);

await repository.set(
  {
    id: 'user3',
    data: { name: 'Bob', profile: { age: 20, gender: 'male' }, tag: [] },
  },
  { tx: batch }
);
await repository.batchSet(
  [
    {
      id: 'user7',
      data: {
        name: 'Alice',
        profile: { age: 30, gender: 'female' },
        tag: ['new'],
      },
    },
    {
      id: 'user8',
      data: { name: 'Carol', profile: { age: 25, gender: 'female' }, tag: [] },
    },
  ],
  { tx: batch }
);
await repository.delete('user4', { tx: batch });
await repository.batchDelete(['user5', 'user6'], { tx: batch });

await batch.commit();
```

### Transactions

In the same manner as batches, the second argument of the various methods lets you pass the official library's transaction object via the `tx` parameter.

```ts
// For web frontend
import { runTransaction } from '@firebase/firestore';

// Or, please use db.runTransaction for backend
await runTransaction(db, async (tx) => {
  // Get
  const doc = await repository.get('user1', { tx });

  if (doc) {
    doc.data.tag = [...doc.data.tag, 'new-tag'];
    // Set
    await repository.set(doc, { tx });
    await repository.batchSet(
      [
        { ...doc, id: 'user2' },
        { ...doc, id: 'user3' },
      ],
      { tx }
    );
  }

  // Delete
  await repository.delete('user4', { tx });
  await repository.batchDelete(['user5', 'user6'], { tx });
});
```

### Subcollections

Firestore subcollections are also supported. You define a subcollection with `subCollection`, and specify in `parent` an array listing the names of the parent collections in hierarchical order (from the root side). For example, for `Users/{userId}/Posts` it's `['Users']`, and for the even deeper `Users/{userId}/Posts/{postId}/Comments` it's `['Users', 'Posts']`.

The only difference from a root collection is that the ID identifying a document becomes a tuple (array) of "the parent document's ID + its own ID." All other operations such as queries, batches, and transactions can be used with exactly the same interface as a root collection.\
This lets you access a nested collection structure with the same usability as a root collection, while safely expressing the parent-child path with types.

```ts
import { subCollection, string } from 'firestore-repository/schema';

// For backend
import { subcollectionRepository } from '@firestore-repository/google-cloud-firestore';

// For web frontend
import { subcollectionRepository } from '@firestore-repository/firebase-js-sdk';

const posts = subCollection({
  name: 'Posts',
  schema: { title: string() },
  parent: ['Users'] as const,
});

const postRepository = subcollectionRepository(db, posts);

// Set a document (id is [parentDocId, docId])
await postRepository.set({
  id: ['user1', 'post1'],
  data: { title: 'My first post' },
});

// Get a document
const post = await postRepository.get(['user1', 'post1']);
```

If the tuple-form ID is hard to work with, you can also use the `Mapper` described later to convert the ID into your own object such as `{ userId: string; postId: string }`.

```ts
const postRepository = repositoryWithMapper(db, posts, {
  // Just define the mutual conversion between your own ID object ⇄ the tuple
  toDocRef: (id) => [id.userId, id.postId],
  fromFirestore: (doc) => ({
    id: { userId: doc.id[0], postId: doc.id[1] },
    data: doc.data,
  }),
  toFirestore: (post) => ({
    id: [post.id.userId, post.id.postId],
    data: post.data,
  }),
});

// Now you can specify the ID as an object
const post = await postRepository.get({ userId: 'user1', postId: 'post1' });
```

## Advanced usage

From here on it's not mandatory, but I'll introduce some advanced content that's handy to know.

### Special values such as serverTimestamp and increment

Firestore has server-side special values usable only at write time (server timestamp, numeric increment, adding/removing array elements). Using the helpers provided from `firestore-repository/server-value`, you can pass these just like normal field values.

For example, using `serverTimestamp()` lets you record a server-side timestamp at write time.

```ts
import { serverTimestamp } from 'firestore-repository/server-value';

// Here, assume the users schema has an additional updatedAt: timestamp() defined
await repository.set({
  id: 'user1',
  data: {
    name: 'John Doe',
    profile: { age: 42, gender: 'male' },
    tag: ['new'],
    updatedAt: serverTimestamp(), // write a server-side timestamp
  },
});
```

Also, `timestamp()`-typed fields are automatically converted to `Date` and returned at read time, so at the app layer you can treat them directly as `Date` without being conscious of `firestore.Timestamp`.

> Note: `increment` and `arrayUnion` / `arrayRemove` are also provided as helpers, but since the current `set` overwrites the entire target document, using these with `set` does not function as "adding to an existing value" or "adding to / removing from an existing array" (for example, `increment(5)` doesn't become existing value + 5, but just overwrites with `5`). Values that don't depend on existing values, like `serverTimestamp`, work fine.
>
> To make these work with Firestore's original semantics, you'd need an operation equivalent to `update`/`merge`, but that is a partial update of "updating only part of a document," which doesn't mesh with the Repository pattern idea of "retrieving and persisting an aggregate as a whole," so this library doesn't provide it for now.

### Custom Mapper

A Repository created with `rootCollectionRepository` and the like reads and writes, by default, a model of the form `{ id: string, data: ... }`. This is close to the data format of the official Firestore library, but on the application side there are surely many cases where you'd want to work with "your own model type where ID and data are flattened together."

In such cases, by defining your own `Mapper` and creating a Repository with `repositoryWithMapper`, the Repository can automatically convert between Firestore documents and your app's model. This lets you treat them, from the application code, as pure domain models without being conscious of the `{ id, data }` structure or that Firestore sits behind them.

A `Mapper` consists of the following three functions.

- `toDocRef`: converts your app model's ID into a Firestore document reference
- `fromFirestore`: converts a Firestore document into the model for reading
- `toFirestore`: converts the model for writing into a Firestore document

The definition of this `Mapper` itself can also be written in a type-safe way. The types of the argument of `fromFirestore` (the document taken out of Firestore) and the return value of `toFirestore` (the document written to Firestore) are automatically derived from the schema definition. Therefore, you can write the conversion logic between the domain model and the Firestore document with type support (with field-name completion and compile errors for type mismatches working).

```ts
import { type AppModel, type Mapper } from 'firestore-repository/repository';

// For backend
import { repositoryWithMapper } from '@firestore-repository/google-cloud-firestore';
// For web frontend
import { repositoryWithMapper } from '@firestore-repository/firebase-js-sdk';

// Define your application model type
type User = {
  userId: string;
  name: string;
  profile: { age: number; gender?: 'male' | 'female' };
  tag: string[];
};

// Define a mapper
const userMapper: Mapper<typeof users, AppModel<string, User, User>> = {
  toDocRef: (id) => [id],
  fromFirestore: (doc) => ({ userId: doc.id[0], ...doc.data }),
  toFirestore: (user) => ({
    id: [user.userId],
    data: { name: user.name, profile: user.profile, tag: user.tag },
  }),
};

const repository = repositoryWithMapper(db, users, userMapper);

// Now the repository accepts and returns your custom User type directly
await repository.set({
  userId: 'user1',
  name: 'Alice',
  profile: { age: 30, gender: 'female' },
  tag: ['new'],
});
const user: User | undefined = await repository.get('user1');
await repository.delete('user1');
```

#### Using separate model types for reading and writing

With a custom Mapper, you can also specify separate model types for reading and writing.\
For example, you can express a domain model that's asymmetric between read and write, such as "at write time, specifying `'server-time'` for `updatedAt` records the current time on the server side, and at read time you receive it as a `Date`." The library-specific `serverTimestamp()` can be hidden inside the `Mapper`, so your app's model can stay an easy-to-understand representation.

```ts
import { serverTimestamp } from 'firestore-repository/server-value';

// Assuming the users schema has updatedAt: timestamp()
type User = { userId: string; name: string; updatedAt: Date };
type UserWrite = {
  userId: string;
  name: string;
  updatedAt: Date | 'server-time';
};

const userMapper: Mapper<typeof users, AppModel<string, User, UserWrite>> = {
  toDocRef: (id) => [id],
  fromFirestore: (doc) => ({
    userId: doc.id[0],
    name: doc.data.name,
    updatedAt: doc.data.updatedAt,
  }),
  toFirestore: (user) => ({
    id: [user.userId],
    data: {
      name: user.name,
      // convert to a server timestamp only when it's 'server-time'
      updatedAt:
        user.updatedAt === 'server-time' ? serverTimestamp() : user.updatedAt,
    },
  }),
};
const repository = repositoryWithMapper(db, users, userMapper);

// At write time, specifying 'server-time' records a server timestamp
await repository.set({
  userId: 'user1',
  name: 'Alice',
  updatedAt: 'server-time',
});

// At read time it comes back as a Date
const user = await repository.get('user1');
const updatedAt: Date = user!.updatedAt;
```

## Summary

So, that's how I was able to build a handy Firestore client library that can do a full range of things.\
Please give it a try if you'd like.

[^1]: On the frontend side, bulk retrieval is unsupported even by the official client [https://github.com/firebase/firebase-js-sdk/issues/1176](https://github.com/firebase/firebase-js-sdk/issues/1176)
