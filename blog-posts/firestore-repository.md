---
title: TypeScript製の軽量Firestoreクライアント「firestore-repository」を作った
createdAt: '2025-02-19'
updatedAt: '2026-06-13'
---

## firestore-repository

- npm: [firestore-repository](https://www.npmjs.com/package/firestore-repository)
- GitHub: [ikenox/firestore-repository](https://github.com/ikenox/firestore-repository)

## 特徴

- いわゆるRepository PatternでのFirestoreクライアントを提供
- なるべく独自の概念や複雑な仕組みを持ち込まず、公式ライブラリの薄いwrapperに徹する
- ドキュメントデータはPOJOとして表現されるので、アプリケーションコードがライブラリと密結合しにくい
- バックエンド（Node.js）とwebフロントエンドの両方に対応。インターフェースも共通のため、バックエンドとフロントエンド間でスキーマやクエリ定義などの共有が可能

### 作った理由

Firestoreの公式クライアントライブラリを生で使うだけだと、以下のような点が不便に感じました。

- 公式クライアントを使ってドキュメントをreadすると `DocumentSnapshot` というオブジェクトが返ってくるが、このオブジェクトはメタデータ的なあれこれもくっついている。純粋なデータ本体は`.data()`で取り出せるが、一方でドキュメントのIDは`.data()`内には含まれないので、データとIDを一緒に取り回そうとすると結局 `DocumentSnapshot`自体をアプリ内で引き回すことになり、アプリ全体がFirestoreライブラリに密結合するような形になってしまう
  - 密結合を避けようとすると自前で`DocumentSnapshot`からPOJOに変換するようなレイヤをコレクションごとに用意するような感じになり、それはそれで面倒
- ドキュメントデータに基本的には型がつかない。一応`withConverter`という仕組みは用意されていて、これを使うと`.data()`で返ってくる値に型をつけることはできるのだが、前述のIDがデータ本体と別になってる問題なども絡んできて結局のところ微妙に使い勝手が良くない
- 公式クライアントライブラリにもバックエンド向けとフロントエンド向けが存在しているが、インターフェースの互換性は無く、例えばバックエンドとフロントエンドでスキーマ定義を共有するような場合は工夫が必要となる

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
    profile: map({ age: double(), gender: optional(literal('male', 'female')) }),
    tag: array(string()),
  },
});
```

備考: スキーマ定義では、コレクション名(`name`)と、ドキュメントデータの各フィールドの型(`schema`)を指定します。フィールドの型としては、`string` / `double` / `bool` / `timestamp` といったプリミティブな型のほか、`map`(ネストしたオブジェクト)、`array`、`union`、`literal`、`optional` / `nullable` など一通りのものが用意されており、これらを組み合わせてスキーマを表現できます。  
なお、ドキュメントはデフォルトでは`{ id, data }`という形のシンプルなモデルとして読み書きされますが、アプリ独自のモデル型へ変換したい場合は後述の`Mapper`でカスタマイズできます。

### Repositoryインスタンスの作成

前のステップで定義したスキーマと、公式ライブラリのDBオブジェクトを使って、Repositoryのインスタンスを作成します。

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

使うための準備としては以上で、あとは作成したRepositoryインスタンスを通じて各種操作が可能です。

### 基本のread/write操作

一通りの基本的なドキュメントの読み込み/書き込み操作を型がついた状態で行えます。リアルタイムアップデートの購読も可能です。  
`get`や`set`の返り値や引数のデータ型はスキーマ定義に沿って導出されたシンプルなPOJOとなるため、アプリケーションコードとFirestoreを疎結合に保つことができます。

Repositoryのインターフェースもバックエンドとフロントエンドで共通です。（バックエンド側にはバックエンド専用のメソッドが追加されていたりといった増分は存在）

```ts
// Set a document
await repository.set({
  id: 'user1',
  data: { name: 'John Doe', profile: { age: 42, gender: 'male' }, tag: ['new'] },
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

### クエリ

クエリについても、公式のFirestoreクライアントでサポートされているような条件指定や集計操作は一通り行えます。  
リアルタイムアップデートの購読も可能です。

クエリ定義についても、バックエンド/フロントエンドで共有可能です。

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

なお、クエリ条件の指定にも型がつくようになっています。  
フィールド名には補完が効き、存在しないフィールド名を指定した場合にはきちんとコンパイルエラーが発生するようになっています。  
また、指定した値がフィールドの型と合っていない場合にもコンパイルエラーになります。

```ts
const validQuery = query({ collection: users }, where(gte('profile.age', 20)));

const invalidQuery1 = query({ collection: users }, where(gte('profile.foo', 20)));
//                                                            ~~~~~~~~~~~ スキーマで定義されていないフィールド名のためコンパイルエラー

const invalidQuery2 = query({ collection: users }, where(gte('profile.age', 'foo')));
//                                                                           ~~~ 数値型でないためコンパイルエラー
```

### バッチ操作

一括での`set`や`delete`ができるメソッドを用意しています。  
`batchGet` については現状バックエンド側のみサポートしています[^1]。

```ts
// Set multiple documents
await repository.batchSet([
  {
    id: 'user1',
    data: { name: 'Alice', profile: { age: 30, gender: 'female' }, tag: ['new'] },
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

また、`set`や`delete`などの各種書き込み系のメソッドの第二引数では `tx` パラメータに公式ライブラリのバッチオブジェクトを渡せるようになっており、それを利用することで複数種別の書き込み操作を1つのバッチにまとめることが可能です。

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
      data: { name: 'Alice', profile: { age: 30, gender: 'female' }, tag: ['new'] },
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

### トランザクション

バッチと同じ要領で、各種メソッドの第二引数で `tx` パラメータに公式ライブラリのトランザクションオブジェクトを渡せるようになっています。

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

### サブコレクション

Firestoreのサブコレクションにも対応しています。サブコレクションは`subCollection`で定義し、`parent`に親コレクションの名前を階層順(ルート側から)に並べた配列を指定します。例えば`Users/{userId}/Posts`なら`['Users']`、さらに深い`Users/{userId}/Posts/{postId}/Comments`なら`['Users', 'Posts']`となります。

ルートコレクションとの違いは、ドキュメントを特定するためのIDが「親ドキュメントのID + 自身のID」のタプル(配列)になる点だけです。クエリ・バッチ・トランザクションなどそれ以外の操作は、ルートコレクションとまったく同じインターフェースで利用できます。  
これにより、ネストしたコレクション構造であっても、親子のパスを型で安全に表現しつつ、ルートコレクションと変わらない使い勝手でアクセスできます。

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

なお、タプル形式のIDが扱いづらい場合は、後述の`Mapper`を使ってIDを`{ userId: string; postId: string }`のような独自のオブジェクトに変換することもできます。

```ts
const postRepository = repositoryWithMapper(db, posts, {
  // 独自のIDオブジェクト ⇄ タプルの相互変換を定義するだけ
  toDocRef: (id) => [id.userId, id.postId],
  fromFirestore: (doc) => ({
    id: { userId: doc.id[0], postId: doc.id[1] },
    data: doc.data,
  }),
  toFirestore: (post) => ({ id: [post.id.userId, post.id.postId], data: post.data }),
});

// IDをオブジェクトで指定できるようになる
const post = await postRepository.get({ userId: 'user1', postId: 'post1' });
```

## 発展的な使い方

ここからは必須ではありませんが、知っておくとより便利に使える発展的な内容を紹介します。

### serverTimestampやincrementなどの特殊な値

Firestoreには、書き込み時にだけ使えるサーバー側の特殊な値(サーバータイムスタンプ、数値のインクリメント、配列要素の追加/削除)があります。これらは`firestore-repository/server-value`から提供されるヘルパーを使って、通常のフィールド値と同じように渡せます。

例えば`serverTimestamp()`を使うと、書き込み時にサーバー側のタイムスタンプを記録できます。

```ts
import { serverTimestamp } from 'firestore-repository/server-value';

// ここでは users スキーマに updatedAt: timestamp() が追加で定義されているものとする
await repository.set({
  id: 'user1',
  data: {
    name: 'John Doe',
    profile: { age: 42, gender: 'male' },
    tag: ['new'],
    updatedAt: serverTimestamp(), // サーバー側のタイムスタンプを書き込む
  },
});
```

また、`timestamp()`型のフィールドはread時に自動的に`Date`へ変換されて返ってくるため、アプリレイヤでは`firestore.Timestamp`を意識せずそのまま`Date`として扱えます。

> 備考: `increment`や`arrayUnion` / `arrayRemove`も同じくヘルパーとして用意されていますが、現状の`set`は対象ドキュメントを丸ごと上書きするため、これらを`set`で使っても「既存値への加算」や「既存配列への追加/削除」としては機能しません（例えば`increment(5)`は既存値+5ではなく、単に`5`で上書きするだけになります）。`serverTimestamp`のように既存値に依存しない値は問題なく使えます。
>
> これらをFirestore本来の意味で動かすには`update`/`merge`相当の操作が必要ですが、これは「ドキュメントの一部分だけを更新する」という部分更新であり、「集約をまるごと取得・永続化する」というRepository Patternの考え方と噛み合わないため、このライブラリでは今のところ提供していません。

### カスタムMapper

`rootCollectionRepository`などで作成したRepositoryは、デフォルトでは`{ id: string, data: ... }`という形のモデルを読み書きします。これは公式のFirestoreライブラリのデータ形式に近いですが、アプリケーション側では「IDとデータがフラットにまとまった独自のモデル型」で取り回したいケースも多いはずです。

そういった場合は、独自の`Mapper`を定義して`repositoryWithMapper`でRepositoryを作成することで、FirestoreドキュメントとアプリのモデルとをRepository内で自動的に相互変換できます。これにより、アプリケーションコードからは`{ id, data }`という構造を意識せず、後ろにFirestoreがあることを意識させない純粋なドメインモデルとして扱えるようになります。

`Mapper`は以下の3つの関数で構成されます。

- `toDocRef`: アプリのモデルのIDをFirestoreのドキュメント参照に変換する
- `fromFirestore`: Firestoreのドキュメントを読み込み用のモデルに変換する
- `toFirestore`: 書き込み用のモデルをFirestoreのドキュメントに変換する

この`Mapper`の定義自体も型安全に記述できます。`fromFirestore`の引数(Firestoreから取り出したドキュメント)や`toFirestore`の返り値(Firestoreへ書き込むドキュメント)の型は、スキーマ定義から自動的に導出されます。そのため、ドメインモデルとFirestoreドキュメントの間の変換ロジックを、型のサポートを受けながら(フィールド名の補完や型の不一致のコンパイルエラーを効かせつつ)記述できます。

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

#### 読み込み用と書き込み用で別々のモデル型を使う

カスタムMapperでは読み込み用と書き込み用で別々のモデル型を指定することもできます。  
例えば「書き込み時は`updatedAt`に`'server-time'`を指定するとサーバー側で現在時刻が書き込まれ、読み込み時は`Date`として受け取る」といった、read/writeで非対称なドメインモデルを表現できます。ライブラリ固有の`serverTimestamp()`は`Mapper`の中に隠蔽してしまえるので、アプリ側のモデルは分かりやすい表現に保てます。

```ts
import { serverTimestamp } from 'firestore-repository/server-value';

// users スキーマに updatedAt: timestamp() がある前提
type User = { userId: string; name: string; updatedAt: Date };
type UserWrite = { userId: string; name: string; updatedAt: Date | 'server-time' };

const userMapper: Mapper<typeof users, AppModel<string, User, UserWrite>> = {
  toDocRef: (id) => [id],
  fromFirestore: (doc) => ({ userId: doc.id[0], name: doc.data.name, updatedAt: doc.data.updatedAt }),
  toFirestore: (user) => ({
    id: [user.userId],
    data: {
      name: user.name,
      // 'server-time' のときだけサーバータイムスタンプに変換する
      updatedAt: user.updatedAt === 'server-time' ? serverTimestamp() : user.updatedAt,
    },
  }),
};
const repository = repositoryWithMapper(db, users, userMapper);

// 書き込み時は 'server-time' を指定するとサーバータイムスタンプが記録される
await repository.set({ userId: 'user1', name: 'Alice', updatedAt: 'server-time' });

// 読み込み時は Date として返ってくる
const user = await repository.get('user1');
const updatedAt: Date = user!.updatedAt;
```

## まとめ

という感じで、一通りのことができる便利なFirestoreクライアントライブラリを作れました。  
よければ使ってみてください。

[^1]: フロントエンド側については、一括取得は公式クライアントとしても未サポートとなっている [https://github.com/firebase/firebase-js-sdk/issues/1176](https://github.com/firebase/firebase-js-sdk/issues/1176)
