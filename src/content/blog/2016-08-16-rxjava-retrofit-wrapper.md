---
title: "聊聊对RxJava与Retrofit的封装"
date: 2016-08-16
tags: ["Android", "RxJava", "Retrofit"]
category: "Android"
excerpt: "介绍如何对RxJava与Retrofit进行封装，包括ServiceFactory、HttpResultSubscriber、线程调度和重试机制的实现，使网络请求代码更加简洁可控。"
---

> 目前RxJava和Retrofit结合使用已经是非常普遍了，网上关于这方面的文章也是层出不穷，其实大致的思想都是差不多的，今天我也来写一篇关于RxJava与Retrofit的文章，聊一聊关于RxJava与Retrofit的封装，尽可能的能让其适用于大部分项目，以供大家在学习这方面的时候多一份参考。

关于RxJava的基础使用可以参考我的另一篇文章：[是时候学习RxJava了](http://www.jianshu.com/p/8cf84f719188)，至于Retrofit的基本使用这里我就不做介绍了，这里可以给大家提供一个学习Retrofit比较全面的网址[retrofit-getting-started-and-android-client](https://futurestud.io/blog/retrofit-getting-started-and-android-client)，对Retrofit还不太熟悉的同学可以先去看看上面的系列文章。

闲话不多说了，直接上今天的主题。我们先来看看关于RxJava和Retrofit最基本的使用是怎么样的

首先我们需要去定义一个对应接口的Service和返回结果的实体类

```java
public class GankResultBean {
    private boolean error;
    private List<ResultsBean> results;
    ...省略部分代码...
}
 public interface RxGankService {
        @GET("data/all/20/{page}")
        Observable<GankResultBean> getAndroidData(@Path("page") int page);
 }
```

接着再去初始化Retrofit

```java
Retrofit retrofit = new Retrofit.Builder()
                .baseUrl("http://gank.io/api/")
                .addConverterFactory(GsonConverterFactory.create())
                .addCallAdapterFactory(RxJavaCallAdapterFactory.create())
                .build();
```

最后我们就可以去使用了

```java
RxGankService rxGankService = retrofit.create(RxGankService.class);
Observable<GankResultBean> observable = rxGankService.getAndroidData(1);
observable.subscribeOn(Schedulers.io())
               .observeOn(AndroidSchedulers.mainThread())
               .subscribe(new Subscriber<GankResultBean>() {
                   @Override
                   public void onCompleted() {

                   }

                   @Override
                   public void onError(Throwable e) {

                   }

                   @Override
                   public void onNext(GankResultBean gankResultBean) {

                   }
               });
```

逻辑还是挺清晰的，但是呢，如果每次使用都让你去写这么多的代码肯定会觉得很乏味，并且这里我还没有对返回结果做错误处理，于是我们就应该考虑一下对代码封装一下了。

但是应该从哪里入手呢，这里简单分析下：

- 看上面的代码我们会发现Retrofit初始化的那段代码，一般就一个baseUrl会有不同，其他的基本是一致的，如果我们每次去创建一个Service都要去写那么多重复的代码也大大增加了冗余度
- 对于返回的结果一般情况下数据格式是这样的：

```json
{
   code:1,
   msg:"your message",
   data:[]
}
```

code是服务器端和客户端约定好的一种规则，比如1表示数据请求成功，-1表示请求失败，-2表示权限不足等等，msg代表提示消息，其中data可能是数组对象也可能是普通的对象，我们可以考虑对返回的结果做一个统一的处理。

经过上面的分析我们大致有了一个方向，对于Service的创建应该有一个类去单独处理。所以这里我创建了一个ServiceFactory的类。

```java
/**
 * Created by _SOLID
 * Date:2016/7/27
 * Time:15:23
 */
public class ServiceFactory {

    private final Gson mGsonDateFormat;

    private ServiceFactory() {
        mGsonDateFormat = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd hh:mm:ss")
                .create();
    }

    private static class SingletonHolder {
        private static final ServiceFactory INSTANCE = new ServiceFactory();
    }

    public static ServiceFactory getInstance() {
        return SingletonHolder.INSTANCE;
    }

    /**
     * create a service
     *
     * @param serviceClass
     * @param <S>
     * @return
     */
    public <S> S createService(Class<S> serviceClass) {
        String baseUrl = "";
        try {
            Field field1 = serviceClass.getField("BASE_URL");
            baseUrl = (String) field1.get(serviceClass);
        } catch (NoSuchFieldException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.getMessage();
            e.printStackTrace();
        }
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(getOkHttpClient())
                .addConverterFactory(GsonConverterFactory.create(mGsonDateFormat))
                .addCallAdapterFactory(RxJavaCallAdapterFactory.create())
                .build();
        return retrofit.create(serviceClass);
    }

    private final static long DEFAULT_TIMEOUT = 10;

    private OkHttpClient getOkHttpClient() {
        //定制OkHttp
        OkHttpClient.Builder httpClientBuilder = new OkHttpClient.Builder();
        //设置超时时间
        httpClientBuilder.connectTimeout(DEFAULT_TIMEOUT, TimeUnit.SECONDS);
        httpClientBuilder.writeTimeout(DEFAULT_TIMEOUT, TimeUnit.SECONDS);
        httpClientBuilder.readTimeout(DEFAULT_TIMEOUT, TimeUnit.SECONDS);
        //设置缓存
        File httpCacheDirectory = new File(FileUtils.getCacheDir(SolidApplication.getInstance()), "OkHttpCache");
        httpClientBuilder.cache(new Cache(httpCacheDirectory, 10 * 1024 * 1024));
        return httpClientBuilder.build();
    }
}
```

其他的代码我就不做说明了，这里我只对createService方法做一个简单的说明：对于baseUrl是用反射去获取我们自定义Service中的BASE_URL字段，所以在使用的时候就有了一个约定，当我们新建一个Service的时候一定要有BASE_URL字段并赋值。也就是说我们在新建的Service大致是这样的

```java
public interface GankService {

    String BASE_URL = "http://www.gank.io/api/";

   @GET("data/all/20/{page}") Observable<GankResultBean> getAndroidData(@Path("page") int page);
}
```

现在我们应该怎样去使用呢

```java
GankService gankService = ServiceFactory.getInstance().createService(GankService.class);
```

是不是一下感觉创建一个Service的代码一下简洁了很多。这里还没完，我们只是解决了Service的创建，还没有对结果去做处理。

我以 *<http://gank.io/api/data/Android/10/1>* 这个接口为例：
他返回的结果的格式是这样的：

```json
{
  "error": false,
  "results": []
}
```

所以这里我定义了这样的一个泛型类（T 是返回结果results的类型）

```java
public class HttpResult<T> {
    public boolean error;
    public T results;
}
```

在处理结果的时候，其实用户只关心的是T，对其他数据可以统一处理下就比如这里的error字段，有了这个我们就可以再封装一下Subscriber了。

```java
public abstract class HttpResultSubscriber<T> extends Subscriber<HttpResult<T>> {

    @Override
    public void onCompleted() {

    }

    @Override
    public void onError(Throwable e) {
        Logger.e(this,e.getMessage());
        e.printStackTrace();
        //在这里做全局的错误处理
        if (e instanceof HttpException) {
            // ToastUtils.getInstance().showToast(e.getMessage());
        }
        _onError(e);
    }

    @Override
    public void onNext(HttpResult<T> t) {
        if (!t.error)
            onSuccess(t.results);
        else
            _onError(new Throwable("error=" + t.error));
    }

    public abstract void onSuccess(T t);

    public abstract void _onError(Throwable e);
}
```

我们来看看现在怎么使用吧：

```java
ServiceFactory.getInstance()
                .createService(GankService.class)
                .getAndroidData(1)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribeOn(Schedulers.io())
                .subscribe(new HttpResultSubscriber<List<GanHuoDataBean>>() {
                    @Override
                    public void onSuccess(List<GanHuoDataBean> list) {

                    }

                    @Override
                    public void _onError(Throwable e) {

                    }
                });
```

把这段代码与文章开始那段代码比较一下，是不是神清气爽了很多，并且这里还做了错误处理的。

细心的同学肯定注意到了这段代码，这段代码每次都是在重复的使用

```java
observeOn(AndroidSchedulers.mainThread())
.subscribeOn(Schedulers.io())
```

这里我们可以创建一个TransformUtils类去处理一下

```java
public class TransformUtils {

    public static <T> Observable.Transformer<T, T> defaultSchedulers() {
        return new Observable.Transformer<T, T>() {
            @Override
            public Observable<T> call(Observable<T> tObservable) {
                return tObservable.observeOn(AndroidSchedulers.mainThread()).subscribeOn(Schedulers.io());
            }
        };
    }

    public static <T> Observable.Transformer<T, T> all_io() {
        return new Observable.Transformer<T, T>() {
            @Override
            public Observable<T> call(Observable<T> tObservable) {
                return tObservable.observeOn(Schedulers.io()).subscribeOn(Schedulers.io());
            }
        };
    }
}
```

然后在使用的时候使用compose操作符就可以了

```java
.compose(TransformUtils.<HttpResult<List<GanHuoDataBean>>>defaultSchedulers())
```

我们都知道对于网络请求肯定会有不成功的情况，有没有一种方案能够处理一下？其实RxJava已经为我们提供了这样的一个操作符`RetryWhen`可以用来实现重试机制，我这里有一个实现好的一个机制，默认情况下，最多重试3次，第一次会等3s，第二次会等6s，第三次会等9s。

```java
public class RetryWhenNetworkException implements Func1<Observable<? extends Throwable>, Observable<?>> {
    private int count = 3;//retry count
    private long delay = 3000;//delay time

    public RetryWhenNetworkException() {

    }

    public RetryWhenNetworkException(int count) {
        this.count = count;
    }

    public RetryWhenNetworkException(int count, long delay) {
        this.count = count;
        this.delay = delay;
    }

    @Override
    public Observable<?> call(Observable<? extends Throwable> observable) {
        return observable
                .zipWith(Observable.range(1, count + 1), new Func2<Throwable, Integer, Wrapper>() {
                    @Override
                    public Wrapper call(Throwable throwable, Integer integer) {
                        return new Wrapper(throwable, integer);
                    }
                }).flatMap(new Func1<Wrapper, Observable<?>>() {
                    @Override
                    public Observable<?> call(Wrapper wrapper) {
                        if ((wrapper.throwable instanceof ConnectException
                                || wrapper.throwable instanceof SocketTimeoutException
                                || wrapper.throwable instanceof TimeoutException)
                                && wrapper.index < count + 1) {
                            return Observable.timer(delay + (wrapper.index - 1) * delay, TimeUnit.MILLISECONDS);
                        }
                        return Observable.error(wrapper.throwable);
                    }
                });
    }

    private class Wrapper {
        private int index;
        private Throwable throwable;

        public Wrapper(Throwable throwable, int index) {
            this.index = index;
            this.throwable = throwable;
        }
    }
}
```

---

到这里对于RxJava与Retrofit的封装的基本封装就差不多了，也能适用于大部分的项目中去了，一般情况下改改HttpResult和HttpResultSubscriber这两个类就可以了。
但是实际开发中有可能会遇到这样的一种情况：直接去访问一个完整的Url，还有用Retrofit去做下载该怎么做呢？

其实解决方案是有的，这里我们可以去定义一个CommonService

```java
public interface CommonService {
    String BASE_URL = "http://www.example.com/";//这个不重要，可以随便写，但是必须有

    @GET
    Observable<ResponseBody> loadString(@Url String url);

    @GET
    @Streaming
    Observable<ResponseBody> download(@Url String url);
}
```

其实就是把参数的注解换成@Url就可以了，关于实现的细节可以参考文末给出的源码。

本文源码地址:[源码](https://github.com/burgessjp/GanHuoIO/tree/v3.1.0/library/src/main/java/ren/solid/library/rx/retrofit)

参考资料可以去我管理的专题查看：
[RxJava系列专题（Android方向）](http://www.jianshu.com/collection/d79a6385bded)
