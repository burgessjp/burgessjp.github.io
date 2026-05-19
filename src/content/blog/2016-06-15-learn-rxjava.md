---
title: "是时候学习RxJava了"
date: 2016-06-15
tags: ["Android", "RxJava"]
category: "Android"
excerpt: "从零开始学习RxJava，涵盖RxJava核心概念、操作符介绍，以及RxBinding、RxPermissions、RxBus、Retrofit+RxJava等实际应用场景。"
---

![RxJava](http://upload-images.jianshu.io/upload_images/623504-95ab3050919a97ab.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

从开始最开始学习RxJava到现在也有一段时间了，还记得去年第一次看RxJava的文章就是[扔物线](https://github.com/rengwuxian)的的这篇文章[给 Android 开发者的 RxJava 详解](http://gank.io/post/560e15be2dca930e00da1083#toc_1)，那一次我看了整整一个下午，由于在那之前我完全没接触过RxJava，也不知道那是个什么，看完很多地方都还不是很理解，整个人都是晕晕的，当然收获也还是有的，至少对RxJava有了一个初步的概念。那次之后我就没再去碰过RxJava了，当时心里想的是，如果后面需要这方面的东西我再来学习也不迟。
时间差不多过了半年，RxJava也越来越火了，使用RxJava的开发者也是越来越多，github上关于的开源库中使用RxJava的也越来越多。当我再去看一些开源库的时候，由于很多地方都用到了RxJava，就发现很多代码都看不懂了，这也就激起了再次去学习RxJava的动力，随后就在网上各种的查找RxJava相关的学习资料，从头学习，我又去看了一遍[给 Android 开发者的 RxJava 详解](http://gank.io/post/560e15be2dca930e00da1083#toc_1)，收获还是很多的，本文也是对这段时间我学习RxJava的一个小结，以下知识点主要针对于Android开发者。

> ### 本文的学习目录
> ---
> 1.RxJava是什么
> 2.在Android中怎么去使用RxJava
> 3.RxJava操作符的介绍
> 4.RxJava在生产环境中的使用
> 5.RxJava学习的参考资料

## 1.RxJava是什么

要知道RxJava是什么，那么你应该先去了解一下Rx。Rx的全称是Reactive Extensions，直译过来就是响应式扩展。Rx基于观察者模式，他是一种编程模型，目标是提供一致的编程接口，帮助开发者更方便的处理异步数据流。*ReactiveX.io给的定义是，Rx是一个使用可观察数据流进行异步编程的编程接口，ReactiveX结合了观察者模式、迭代器模式和函数式编程的精华。*Rx已经渗透到了各个语言中，有了Rx所以才有了 RxJava，Rx.NET、RxJS、RxSwift、Rx.rb、RxPHP等等，更详细的可以去这里看看[languages](http://reactivex.io/languages.html)

那么RxJava到底是什么，我对于他的理解就针对于Java语言的一个异步的响应式编程库。

## 2.怎么去使用RxJava

在gradle文件的dependencies中加入以下代码即可（以下版本可能不是最新的，需要最新的可到[RxAndroid](https://github.com/ReactiveX/RxAndroid)查看）

```gradle
compile 'io.reactivex:rxandroid:1.2.0'
compile 'io.reactivex:rxjava:1.1.5'
```

## 3.RxJava操作符的介绍

有了以上的配置，我们就可以在Android中使用RxJava了。对于RxJava的使用，最重要的还是对于操作符的学习，熟悉了操作符才能更好的使用RxJava。RxJava中的操作符是非常丰富的，关于RxJava操作符介绍的文章已经是属于一搜就是一大堆的那种了，所以本文就不多做介绍了，在这里给大家推荐一个学习操作符比较好的地方[Operaters](https://mcxiaoke.gitbooks.io/rxdocs/content/Operators.html)

![RxJava操作符](http://upload-images.jianshu.io/upload_images/623504-c57385da15b90d9a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

## 4.RxJava在生产环境中的使用

想必学习RxJava的同学，在学习完操作符之后，最想知道的是怎么将其用在我们平时的开发当中去，本节就带大家去了解一下怎么去应用RxJava。

> RxBinding
> 节流(防止按钮的重复点击)
> 轮询，定时操作
> RxPermissions
> RxBus
> RxJava与Retrofit
> 等待你们的补充~~~

**(1) RxBinding**

[RxBinding](https://github.com/JakeWharton/RxBinding)是[JakeWharton](https://github.com/JakeWharton)大牛用RxJava为Android控件编写的一个控件绑定库，并且为各个包下的控件都编写相应的库，如下所示

```gradle
Platform bindings:
compile 'com.jakewharton.rxbinding:rxbinding:0.4.0'

'support-v4' library bindings:
compile 'com.jakewharton.rxbinding:rxbinding-support-v4:0.4.0'

'appcompat-v7' library bindings:
compile 'com.jakewharton.rxbinding:rxbinding-appcompat-v7:0.4.0'

'design' library bindings:
compile 'com.jakewharton.rxbinding:rxbinding-design:0.4.0'

'recyclerview-v7' library bindings:
compile 'com.jakewharton.rxbinding:rxbinding-recyclerview-v7:0.4.0'

'leanback-v17' library bindings:
compile 'com.jakewharton.rxbinding:rxbinding-leanback-v17:0.4.0'
```

我们只需引入对应地库就可以使用了。

比如我们对Button添加一个单击事件就可以这样做了

```java
Button button = (Button) findViewById(R.id.button);

      RxView.clicks(button).subscribe(new Action1<Void>() {
          @Override
          public void call(Void aVoid) {
            Log.i("test", "clicked");
          }
      });
```

到这里，你肯定会说，这并没有没什么卵用，还不如直接设置一个setOnClickListener来的方便，直接。继续往下看

通常情况下，如果我们要防止一个按钮重复点击会怎么做？设置一个第一次按下的时间，然后在第二次点击的时候去判断？NO NO NO，这样做都太low了，我们来看看用RxBing怎样去实现

```java
RxView.clicks(button).debounce(300, TimeUnit.MILLISECONDS).subscribe(new Action1<Void>() {
            @Override
            public void call(Void aVoid) {
                Log.i("test", "clicked");
            }
        });
```

很爽吧，这里过滤掉了在300ms内的重复点击，只需加一个操作符就可以了，而不用我们去编写一大堆并且还容易出错的逻辑代码了。

这里使用最多的一个地方就是在我们做搜索的时候，再结合filter操作，去过滤掉那些没必要的查询操作，来减小服务器的压力和客户端的流量输出。

**(2) 轮询，定时操作**

在做App的时候，有些地方我们可能会时不时的去请求服务器，以至于客户端的数据是最新的，在RxJava中可以这样做

```java
//每隔两秒执行一次
Observable.interval(2, 2, TimeUnit.SECONDS).subscribe(new Action1<Long>() {
         @Override
         public void call(Long aLong) {
             //TODO WHAT YOU WANT
         }
     });
```

在两秒后去执行一些操作（比如启动页跳转到主页面）

```java
Observable.timer(2, TimeUnit.SECONDS).subscribe(new Action1<Long>() {
           @Override
           public void call(Long aLong) {
               //TODO WHAT YOU WANT
           }
       });
```

**(3) RxPermissions**

[RxPermissions](https://github.com/tbruyelle/RxPermissions)也是国外的大牛开发的基于RxJava的Android权限管理库，他让6.0以上的权限管理更加的简单，如果有适配6.0以上的手机的需求，这个库是个不错的选择。下面我们来看看基本的用法。

```java
// 请求相机权限
 RxPermissions.getInstance(this)
 .request(Manifest.permission.CAMERA)
 .subscribe(granted -> {
     if (granted) { // 用户同意了（在6.0之前的手机始终都为true）
       //可以拍照了
     } else {
        //可以在这里提示用户，或者再次请求
     }
 });
```

当然，如果我想一次请求多个权限呢，每次都去写上面的代码肯定是个不好的做法，RxPermissions的作者也考虑到了这一点，在Api里提供了一个多参数的重载

```java
//取得相机权限和读取手机状态
RxPermissions.getInstance(this)
    .request(Manifest.permission.CAMERA,
             Manifest.permission.READ_PHONE_STATE)
    .subscribe(granted -> {
        if (granted) {

        } else {

        }
    });
```

更多的资料还请去github上去查看。

**(4) RxBus**

有了RxJava，EventBus、Otto什么的都可以靠边了，因为RxJava本身就自带了这个功能，我们只需做一下简单的封装就可以使用了，也顺便减少了我们项目的体积。

```java
public class RxBus {

    private final Subject<Object, Object> _bus;

    private static class RxBusHolder {
        private static final RxBus instance = new RxBus();
    }

    private RxBus() {
        _bus = new SerializedSubject<>(PublishSubject.create());
    }

    public static synchronized RxBus getInstance() {
        return RxBusHolder.instance;
    }

    public void post(Object o) {
        _bus.onNext(o);
    }

    public <T> Observable<T> toObserverable(Class<T> eventType) {
        return _bus.ofType(eventType);
}
```

怎么去使用？

在需要发送消息的地方

```java
RxBus.getInstance().post("SomeChange");
```

在需要接收消息的地方

```java
 Subscription mSubscription = RxBus.getInstance().toObserverable(String.class).subscribe(new Action1<String>() {
            @Override
            public void call(String s) {
                handleRxMsg(s);
            }
});
```

不要忘了在适当的地方去取消这个订阅（以免发生内存泄漏）

```java
mSubscription.unsubscribe();
```

到这里可能你有个疑问，Subject是个什么鬼！

其实Subject同时充当了Observer和Observable的角色，他可以发射数据也可以接收数据，有AsyncSubject、BehaviorSubject、PublishSubject、ReplaySubject四种，详细的介绍请看[Subject](https://mcxiaoke.gitbooks.io/rxdocs/content/Subject.html)

**(5) RxJava与Retrofit**

Retrofit可能大家都不太陌生了，如果你还不知道的话，那么赶紧去学习吧，这么强大的框架怎么能不知道呢！

后面的讲解是基于了解过Retrofit的同学

关于Retrofit的基本使用可能我们都不是太陌生，对于请求后的结果都是在一个回调接口里接收，对于结果的处理并不是太灵活，一大堆的回调会让你以后回过来看代码的时候看的醉生梦死。
RxJava很好的解决了这个问题，我们来看看Retrofit的怎么去适配RxJava吧。

gradle文件的引用

```gradle
compile 'com.squareup.retrofit2:retrofit:2.0.2'
compile 'com.squareup.retrofit2:converter-gson:2.0.2'
compile 'com.squareup.retrofit2:adapter-rxjava:2.0.2'//RxJava与Retrofit的适配器
```

这里我以请求 [http://gank.io/api/data/Android/10/1](http://gank.io/api/data/Android/10/1) 为例。

返回的结果大致是这样的

![返回结果](http://upload-images.jianshu.io/upload_images/623504-0605a63e05ab2f33.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

于是我定义了一个GankResultBean去接收这个结果。

![GankResultBean](http://upload-images.jianshu.io/upload_images/623504-62967f0fabf00980.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

其中ResultsBean就是results中的每一个条目。
好了，下面我们来看看适配了RxJava的Retrofit怎么去使用吧
首先我们定义一个接口

```java
public interface RxGankService {
       @GET("all/20/{page}")
       Observable<GankResultBean> getAndroidData(@Path("page") int page);
   }
```

值得注意的是这里返回的是`Observable<GankResultBean>`而不是常规的`Call<GankResultBean>`

接着就可以做请求了

```java
 Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("http://gank.io/api/data/")
                .addConverterFactory(GsonConverterFactory.create())
                .addCallAdapterFactory(RxJavaCallAdapterFactory.create())//这个就是用来适配RxJava的
                .build();

RxGankService rxGankService = retrofit.create(RxGankService.class);
        final Observable<GankResultBean> observable = rxGankService.getAndroidData(1);
        observable
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .map(new Func1<GankResultBean, List<GankResultBean.ResultsBean>>() {
                    @Override
                    public List<GankResultBean.ResultsBean> call(GankResultBean gankResultBean) {
                        return gankResultBean.getResults();
                    }
                })
                .flatMap(new Func1<List<GankResultBean.ResultsBean>, Observable<GankResultBean.ResultsBean>>() {
                    @Override
                    public Observable<GankResultBean.ResultsBean> call(List<GankResultBean.ResultsBean> resultsBeen) {
                        return Observable.from(resultsBeen);
                    }
                })
                .filter(new Func1<GankResultBean.ResultsBean, Boolean>() {
                    @Override
                    public Boolean call(GankResultBean.ResultsBean resultsBean) {
                        return "Android".equals(resultsBean.getType());
                    }
                })
                .subscribe(new Subscriber<GankResultBean.ResultsBean>() {
                    @Override
                    public void onCompleted() {
                        Log.i("test", "onCompleted");
                    }

                    @Override
                    public void onError(Throwable e) {
                        e.printStackTrace();
                    }

                    @Override
                    public void onNext(GankResultBean.ResultsBean resultsBean) {
                        textView.append(resultsBean + "\n");
                    }
                });
```

这里是为了演示才使用了这么多的操作符，在实际使用的时候根据具体情况而定。
下面简单解释下上面这段代码
observeOn(AndroidSchedulers.mainThread())：订阅者的回调在主线程
subscribeOn(Schedulers.io())：订阅发生在io线程
map:一般我们不会关心error字段，我们关心的只是results，所以在这里做了一个映射让用户接收的是List<GankResultBean.ResultsBean>而不是包含有error的GankResultBean
flatMap:让结果一条一条的发射出去，而不是一个集合
filter：只接收Type为Android的数据

以上的例子用流的方式是不是很好的解决了对请求结果的处理，对结果的处理可以做到随心所欲，并且逻辑还很清晰。

以上几个点就是我了解的关于RxJava的应用。如果你还有其他方面的应用，还望补充。

## 5.RxJava学习的参考资料

这里我将我学习RxJava以来收集的关于RxJava分享出来，以方便大家的查阅。

学习RxJava的第一手资料,官方的wiki:[wiki](https://github.com/ReactiveX/RxJava/wiki)
我学习RxJava看的第一篇文章：[给 Android 开发者的 RxJava 详解](http://gank.io/post/560e15be2dca930e00da1083#toc_1)(这个大家肯定都知道)
大头鬼总结的RxJava学习资料：**[Awesome-RxJava](https://github.com/lzyzsd/Awesome-RxJava)**
RxJava文档中文翻译：[Rx和RxJava文档中文翻译项目](https://github.com/mcxiaoke/RxDocs)

其他：
[RxJava操作符图解](http://rxmarbles.com)（需科学上网）
[RxJava处理网络连接失败和timer()、interval()、delay()之间的区别](http://www.jianshu.com/p/7e28c8216c7d)
[Architecting Android with RxJava](http://www.jianshu.com/p/943ceaccfdff)
[使用RxJava 提升用户体验](http://www.jianshu.com/p/33c548bce571)
[用RxJava实现事件总线(Event Bus)](http://www.jianshu.com/p/ca090f6e2fe2)
[Intro to Rx](http://www.introtorx.com/Content/v1.0.10621.0/02_KeyTypes.html)
[Implementing an Event Bus With RxJava - RxBus](http://nerds.weddingpartyapp.com/tech/2014/12/24/implementing-an-event-bus-with-rxjava-rxbus/)
[可能是东半球最全的RxJava使用场景小结](http://blog.csdn.net/theone10211024/article/details/50435325)
[RxWeekend——RxJava周末狂欢](http://www.jianshu.com/p/ce228f517586?utm_campaign=haruki&utm_content=note&utm_medium=reader_share&utm_source=qq)

最后：为了跟上时代的步伐，是时候学习RxJava了

欢迎关注我的专题：[RxJava系列专题（Android方向）](http://www.jianshu.com/collection/d79a6385bded)
