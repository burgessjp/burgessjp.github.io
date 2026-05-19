---
title: "在Android中使用Realm作本地存储"
date: 2016-09-22
tags: ["Android", "ORM"]
category: "Android"
excerpt: "介绍Realm数据库在Android中的入门使用，包括环境配置、创建实体、CRUD操作、JSON创建对象、数据迁移以及与RxJava的结合等进阶用法。"
---

Android平台有很多的orm框架可以对数据作本地存储，比如ormlite、greenDao、SugarORM等等，这些orm框架基本都是基于sqlite的。今天我要介绍的这个数据库Realm，是用来替代sqlite的一种解决方案，它有一套自己的数据库存储引擎，比sqlite更轻量级，拥有更快的速度，最重要的是跨平台，目前已有Java，Objective C，Swift，React-Native，Xamarin这五种实现。
本文是Realm数据库在Android中使用的一个入门级的教程，这里不对Realm与其他的orm框架的优缺点作讨论（这些网上已是一搜一大把）。

> 本文学习目录
> 一.环境配置
> 二.创建实体
> 三.CRUD（增删改查操作）
> 四.进阶用法

### 一.环境配置

1. 在项目的build文件加上

```gradle
buildscript {
    repositories {
        jcenter()
    }
    dependencies {
        ...
        classpath "io.realm:realm-gradle-plugin:1.2.0"
    }
```

2. 在 app 的 build文件中加入

```gradle
apply plugin: 'realm-android'
```

### 二.创建实体

Realm 支持的字段类型，除了Java提供的基本类型之外，Realm还支持`继承了RealmObject 的对象`和`RealmList<? extends RealmObject>`

这里为了方便直接使用了示例项目中的对象了。

创建一个User实体

```java
public class User extends RealmObject {
    @PrimaryKey
    private String id;
    private String name;
    private int age;
    private RealmList<User> friends;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public RealmList<User> getFriends() {
        return friends;
    }

    public void setFriends(RealmList<User> friends) {
        this.friends = friends;
    }
}
```

细心的同学已经注意到了，我们上面创建的实体对象继承于RealmObject ，Realm 数据实体定义需要继承自 RealmObject类。

这里需要知道的几点：

- `@PrimaryKey`用来标识主键
- 默认的所有的字段都会被存储
- 如果某个字段不需要被存储到本地，则需在在这个字段上面加上`@Ignore`注解

### 三.CRUD（增删改查操作）

数据库的使用无非上就是增删改查这四种操作，其中查是重点，在写原生sql语句中这也是个难点。下面我们就来看看Realm的CRUD是怎样的

#### 1.添加数据

```java
RealmConfiguration realmConfig = new RealmConfiguration
                .Builder(this)
                .build();
Realm realm = Realm.getInstance(realmConfig);
```

```java
public void testAdd() {
       initRealm();
       realm.executeTransaction(new Realm.Transaction() {
           @Override
           public void execute(Realm realm) {
               for (int i = 0; i < 10; i++) {
                   User user = realm.createObject(User.class);
                   user.setName("user" + i);
                   user.setAge(10 + i);
                   user.setId(UUID.randomUUID().toString());
               }
               showInTextView("10条数据添加成功");
           }
       });
   }
```

在用Realm进行操作之前需要对Realm作相关的配置操作，Realm中所有的写操作都必须在事务中进行，不然就会报错，**记得在Activity的onDestory中调用realm.close()释放资源**。上面的代码片段就创建了10个User对象。

#### 2.查询数据

- 查询全部

```java
public void testQuery() {
       List<User> users= realm.where(User.class).findAll();
       for (User user: users) {
           showInTextView("id:" + user.getId() + " name:" + user.getName() + " age:" + user.getAge());
       }
   }
```

- 条件查询，Realm 支持以下查询条件（来源于官网）：
  - between()、greaterThan()、lessThan()、greaterThanOrEqualTo() 和 lessThanOrEqualTo()
  - equalTo() 和 notEqualTo()
  - contains()、beginsWith() 和 endsWith()
  - isNull() 和 isNotNull()
  - isEmpty() 和 isNotEmpty()

以下代码片段查询年龄小于15的User

```java
public void testQueryAgeLessThan15() {
       List<User> users= realm.where(User.class).lessThan("age", 15).findAll();
       for (User user: users) {
           showInTextView("id:" + user.getId() + " name:" + user.getName() + " age:" + user.getAge());
       }
   }
```

- 聚合查询，支持的聚合操作有sum，min，max，average
以下代码片段得到所有人的平均年龄

```java
public void testQueryAverageAge() {
        double age = realm.where(User.class).findAll().average("age");
        textView.setText("average age:" + age);
    }
```

#### 3.更新数据

```java
public void testUpdate() {
       realm.executeTransaction(new Realm.Transaction() {
           @Override
           public void execute(Realm realm) {
               User user = realm.where(User.class).equalTo("name", "user9").findFirst();
               if (user != null) {
                   user.setAge(99);
                   user.setName("二逼青年");
               }
               textView.setText("更新成功");
           }
       });
   }
```

#### 4.删除数据

以下代码片段展示了如何删除指定的对象

```java
public void testDelete() {
       realm.executeTransaction(new Realm.Transaction() {
           @Override
           public void execute(Realm realm) {
               User user = realm.where(User.class).equalTo("name", "user0").findFirst();
               if (user != null)
                   user.deleteFromRealm();
               textView.setText("删除成功");
           }
       });
   }
```

### 四.进阶用法

通过前面一节的学习，我们基本学会了Realm数据库基本的增删改查操作。
本节来看看Realm还有什么其他用法

#### 1.用json创建对象

在实际开发中我们和json打交道的机会比较多，所以直接从json去创建对象是十分有用的，下面的代码片段展示了怎么去用。

```java
private void testAddFromJson() {
        realm.executeTransaction(new Realm.Transaction() {
            @Override
            public void execute(Realm realm) {
                String json = "{\n" +
                        "    \"id\": \"uuid1\",\n" +
                        "    \"name\": \"solid\",\n" +
                        "    \"age\": 20\n" +
                        "}";
                String jsons = "[\n" +
                        "    {\n" +
                        "        \"id\": \"uuid1\",\n" +
                        "        \"name\": \"solid\",\n" +
                        "        \"age\": 20\n" +
                        "    },\n" +
                        "    {\n" +
                        "        \"id\": \"uuid2\",\n" +
                        "        \"name\": \"jhack\",\n" +
                        "        \"age\": 21\n" +
                        "    },\n" +
                        "    {\n" +
                        "        \"id\": \"uuid3\",\n" +
                        "        \"name\": \"tom\",\n" +
                        "        \"age\": 22\n" +
                        "    }\n" +
                        "]";
                //realm.createObjectFromJson(User.class, json);
                realm.createAllFromJson(User.class, jsons);
            }
        });
    }
```

#### 2.数据模型改变的处理

 开发中数据模型不可能从一开始创建了，就保证后面的开发过程中不会更改，对于Realm如果其中的某个实体类改变了，而我们没有做任何的处理，就会报错，如果还处于应用的开发的初期，这无所谓，直接清空数据即可，但是如果应用已经发布了，我们就需要去寻找一种解决方案了。

这里的解决方案如下：

```java
public class MyMigration implements RealmMigration {
    @Override
    public void migrate(DynamicRealm realm, long oldVersion, long newVersion) {
        Log.e(MainActivity.TAG, "oldVersion:" + oldVersion + " newVersion:" + newVersion);

        RealmSchema schema = realm.getSchema();

        if (newVersion == 2) {
            schema.get("User")
                    .addField("desc", String.class);
        }
    }

    @Override
    public boolean equals(Object obj) {
        return obj instanceof MyMigration;
    }

    @Override
    public int hashCode() {
        return super.hashCode();
    }
}
```

```java
realmConfig = new RealmConfiguration
               .Builder(this)
               .schemaVersion(2)
               .migration(new MyMigration())
               .build();
```

#### 3.与RxJava的结合

Realm原生是支持Rxjava的，由于RxJava 是可选依赖，所以在使用的时候需要在app的build文件中添加RxJava库的依赖，下面是使用的代码片段。

```java
public void testRxJava() {
        realm.where(User.class).findAll()
                .asObservable()
                .flatMap(new Func1<RealmResults<User>, Observable<User>>() {
                    @Override
                    public Observable<User> call(RealmResults<User> users) {
                        return Observable.from(users);
                    }
                })
                .subscribe(new Action1<User>() {
                    @Override
                    public void call(User user) {
                        showInTextView("id:" + user.getId() + " name:" + user.getName() + " age:" + user.getAge() + " desc:" + user.getDesc());

                    }
                });
    }
```

这篇文章接到这了，遗憾的是Realm在Windows中没有相关的查看器，只有Mac版的，所以不能直接在Windows中查看Realm数据库中的数据，希望官方后面会有支持吧。更多的资料请查看官方文档。
参考文档：[realm-java](https://realm.io/docs/java/latest/)
