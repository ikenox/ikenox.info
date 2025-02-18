---
title: TypeScript製の軽量Firestoreクライアント「firestore-repository」を作った
date: '2025-02-19'
---

## firestore-repository

- npm: [firestore-repository](https://www.npmjs.com/package/firestore-repository)
- GitHub: [ikenox/firestore-repository](https://github.com/ikenox/firestore-repository)

## 特徴

- いわゆるRepository PatternでのFirestoreクライアントを提供
- なるべく独自の概念や複雑な仕組みを持ち込まず、公式ライブラリの薄いwrapperに徹している
- ドキュメントデータはPOJOとして表現されるので、アプリケーションコードがライブラリと密結合しにくい
- バックエンド（Node.js）とwebフロントエンドの両方に対応。インターフェースも共通のため、バックエンドとフロントエンド間でスキーマやクエリ定義などの共有が可能

### 作った理由

Firestoreの公式クライアントライブラリを生で使うだけだと、以下のような点が不便に感じました。

- 公式クライアントを使ってドキュメントをreadすると `DocumentSnapshot` というオブジェクトが返ってくるが、このオブジェクトはメタデータ的なあれこれもくっついている。純粋なデータ本体は`.data()`で取り出せるが、一方でドキュメントのIDは`.data()`内には含まれないので、データとIDを一緒に取り回そうとすると結局 `DocumentSnapshot`自体をアプリ内で引き回すことになり、アプリ全体がFirestoreライブラリに密結合するような形になってしまう。それを避けようとすると自前で`DocumentSnapshot`からPOJOに変換するようなレイヤをコレクションごとに用意するような感じになり、それはそれで大変。
- ドキュメントデータに基本的には型がつかない。一応`withConverter`という仕組みは用意されていて、これを使うと`.data()`で返ってくる値に型をつけることはできるのだが、前述のIDがデータ本体と別になってる問題なども絡んできて結局のところ微妙に使い勝手が良くない。
- 公式クライアントライブラリにもバックエンド向けとフロントエンド向けが存在しているが、インターフェースの互換性は無く、例えばバックエンドとフロントエンドでスキーマ定義を共有するような場合は工夫が必要となる。

公式ライブラリという立場だとこれらはしょうがないというか、公式として提供できるものは限られている（unopinionatedでないといけない）だろうとも思ったので、それならその辺を解消するための簡単なwrapperを自分で書いてみようと思いました。

## 使い方

### インストール

```shell
# バックエンドで利用する場合
npm install firestore-repository @firestore-repository/google-cloud-firestore

# フロントエンドで利用する場合
npm install firestore-repository @firestore-repository/firebase-js-sdk
```

### スキーマを定義

まずはcollectionのスキーマを定義します。このスキーマ定義はバックエンド/フロントエンドで共有できます。  
スキーマを共有することで、フロントエンドとバックエンドそれぞれで同じコレクションのドキュメントを一貫性を保った形でread(+write)できます。

```ts
import { mapTo, data, rootCollection } from 'firestore-repository/schema';

// define a collection
const users = rootCollection({
  name: 'Users',
  id: mapTo('userId'),
  data: data<{
    name: string;
    profile: { age: number; gender?: 'male' | 'female' };
    tag: string[];
  }>(),
});
```

備考: スキーマ定義において`id`や`data`に指定している値の実態は、単に`from` `to`という2つの関数をペアにしただけのものです。`from`はFirestoreからアプリレイヤに取り出す際の変換の関数で、`to`はアプリレイヤからFirestoreに保存する際のデータの変換の関数です。この双方向の変換定義について、汎用的によく使うであろうものはライブラリでutility的に提供していますが、独自の変換処理をしたい場合は自前で好きに変換ロジックを書くこともできます。  
その話も踏まえると、このライブラリにおけるスキーマ定義というのは、単にFirestoreのドキュメントの各コンポーネント(ID、データ、コレクションパス)それぞれの双方向変換の定義を寄せ集めただけのものと言えます。

### repositoryインスタンスの作成

前のステップで定義したスキーマと、公式ライブラリのDBオブジェクトを使って、repositoryのインスタンスを作成します。

```ts
// For backend
import { Firestore } from '@google-cloud/firestore';
import { Repository } from '@firestore-repository/google-cloud-firestore';
const db = new Firestore();

// For web frontend
import { getFirestore } from '@firebase/firestore';
import { Repository } from '@firestore-repository/firebase-js-sdk';
const db = getFirestore();

const repository = new Repository(users, db);
```

使うための準備としては以上で、あとは作成したrepositoryインスタンスを通じて各種操作が可能です。

### 基本のread/write操作

一通りの基本的なドキュメントの読み込み/書き込み操作を型がついた状態で行えます。リアルタイムアップデートの購読も可能です。  
`get`や`set`の返り値や引数のデータ型はシンプルなPOJOのため、アプリケーションコードとFirestoreを疎結合に保つことができます。

repositoryのインターフェースもバックエンドとフロントエンドで共通です。（バックエンド側にはバックエンド専用のメソッドが追加されていたりといった増分は存在）

```ts
// Set a document
await repository.set({
  userId: 'user1',
  name: 'John Doe',
  profile: { age: 42, gender: 'male' },
  tag: ['new'],
});

// Get a document
const doc = await repository.get({ userId: 'user1' });
// doc = {
//   userId: 'user1',
//   name: 'John Doe',
//   profile: { age: 42, gender: 'male' },
//   tag: ['new'],
// }

// Listen a document
repository.getOnSnapshot({ userId: 'user1' }, (doc) => {
  console.log(doc);
});

// Delete a document
await repository.delete({ userId: 'user2' });
```

### クエリ

クエリについても、公式のFirestoreクライアントでサポートされているような条件指定や集計操作は一通り行えます。  
リアルタイムアップデートの購読も可能です。

クエリ定義についても、バックエンド/フロントエンドで共有可能です。

```ts
import { condition as $, limit, query } from 'firestore-repository/query';

// Define a query
const q = query(
  users,
  $('profile.age', '>=', 20),
  $('profile.gender', '==', 'male'),
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

なお、クエリ条件の指定にも型がつくようになっています。  
フィールド名には補完が効き、存在しないフィールド名を指定した場合にはきちんとコンパイルエラーが発生するようになっています。  
また、指定した値がフィールドの型と合っていない場合にもコンパイルエラーになります。

```ts
const validQuery = query(users, $('profile.age', '>=', 20));

const invalidQuery1 = query(users, $('profile.foo', '>=', 20));
//                                    ~~~~~~~~~~~ スキーマで定義されていないフィールド名のためコンパイルエラー

const invalidQuery2 = query(users, $('profile.age', '>=', 'foo'));
//                                                         ~~~ 数値型でないためコンパイルエラー
```

### バッチ操作

一括での`set`や`delete`ができるメソッドを用意しています。  
`batchGet` については現状バックエンド側のみサポートしています[^1]。

```ts
// Set multiple documents
await repository.batchSet([
  {
    userId: 'user1',
    name: 'Alice',
    profile: { age: 30, gender: 'female' },
    tag: ['new'],
  },
  {
    userId: 'user2',
    name: 'Bob',
    profile: { age: 20, gender: 'male' },
    tag: [],
  },
]);

// Delete multiple documents
await repository.batchDelete([{ userId: 'user1' }, { userId: 'user2' }]);

// Get multiple documents (backend only)
const users = await repository.batchGet([
  { userId: 'user1' },
  { userId: 'user2' },
]);
```

また、`set`や`delete`などの各種書き込み系のメソッドの第二引数では `tx` パラメータに公式ライブラリのバッチオブジェクトを渡せるようになっており、それを利用することで複数種別の書き込み操作を1つのバッチにまとめることが可能です。

```ts
// For backend
const batch = db.writeBatch();
// For web frontend
import { writeBatch } from '@firebase/firestore';
const batch = writeBatch();

await repository.set(
  {
    userId: 'user3',
    name: 'Bob',
    profile: { age: 20, gender: 'male' },
    tag: [],
  },
  { tx: batch }
);
await repository.batchSet(
  [
    /* ... */
  ],
  { tx: batch }
);
await repository.delete({ userId: 'user4' }, { tx: batch });
await repository.batchDelete([{ userId: 'user5' }, { userId: 'user6' }], {
  tx: batch,
});

await batch.commit();
```

### トランザクション

バッチと同じ要領で、各種メソッドの第二引数で `tx` パラメータに公式ライブラリのトランザクションオブジェクトを渡せるようになっています。

```ts
// For web frontend
import { runTransaction } from '@firebase/firestore';

// Or, please use db.runTransaction for backend
await runTransaction(async (tx) => {
  // Get
  const doc = await repository.get({ userId: 'user1' }, { tx });

  if (doc) {
    doc.tag = [...doc.tag, 'new-tag'];
    // Set
    await repository.set(doc, { tx });
    await repository.batchSet(
      [
        { ...doc, userId: 'user2' },
        { ...doc, userId: 'user3' },
      ],
      { tx }
    );
  }

  // Delete
  await repository.delete({ userId: 'user4' }, { tx });
  await repository.batchDelete([{ userId: 'user5' }, { userId: 'user6' }], {
    tx,
  });
});
```

## まとめ

という感じで、一通りのことができる便利なFirestoreクライアントライブラリを作れました。  
よければ使ってみてください。

### 残課題

- `serverTimestamp`や`increment`などの、Firestoreへの書き込み時にだけ利用できる特殊な値の扱いについて。ライブラリの裏の構造としてはこの辺を扱うための土台は用意できているが、表向きどのように提供すべきか悩ましい（そもそもこれらの概念は手続き的であり、Repository Patternの思想からも外れる）。
- Firestoreのタイムスタンプ値はアプリレイヤでは`Date`にして取り回したいが、現状だと`firestore.Timestamp`から`Date`への変換を明示的に記述しなくてはならず面倒。
  - 一応、`Object.entries(...)` とかを使ってドキュメントデータを走査してTimestampフィールドを見つけたら`Date`に変換して回るといった処理を書くこともできなくはないが、処理効率は悪いのでライブラリ側からutilityとして提供するのは躊躇われる。
  - これについては公式ライブラリ側で何か汎用的な仕組みを用意してほしいところ...

[^1]: フロントエンド側については、一括取得は公式クライアントとしても未サポートとなっている [https://github.com/firebase/firebase-js-sdk/issues/1176](https://github.com/firebase/firebase-js-sdk/issues/1176)
