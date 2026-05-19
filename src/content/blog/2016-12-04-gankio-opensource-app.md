---
title: "干货IO 3.0一个完全开源的App"
date: 2016-12-04
tags: ["项目"]
category: "项目"
excerpt: "记录干货IO这个基于Gank.IO的开源App从1.0到3.0的演进历程，包括UI重构、RxJava+Retrofit网络请求、MultiType列表适配等技术的综合应用。"
---

之前写过一篇关于介绍[干货IO]的文章[基于Gank.IO提供的API的第三方客户端，可以在线收藏[项目开源]](http://www.jianshu.com/p/3f137269a942)，大致介绍了用到了什么，有哪些功能，一句话就是让大家知道了这个app的存在，之后了一段时间对app也在一直维护，有过好几次的更新，但是改动程度都不是太大，改的最大的一次就是重构底层的网络请求，但并不是太彻底，所以也遗留下了一些问题，其他的就是一些小功能的增增改改。之所以再次写关于**[干货IO]**的文章，就是想纪录一下做这个app的心路历程，以及介绍一下里面的技术实现。

**在这里再次感谢一下[daimajia](https://github.com/daimajia)，没有[gank.io](http://gank.io/)就不会有这个app的存在，如果还有不知道的可以每天都去这个网站看看，除了周六周末两天不更新之外，每天都会有技术干货的推送更新。**

先说下这个3.0版本更新的主要内容吧

- 1.UI风格大调整，全新的 UI 风格
- 2.支持干货配图
- 3.新增 gank 最近推出的闲读
- 4.新增搜索
- 5.修复仅Wifi加载图片的bug
- 6.行为更改：长按干货收藏

下面是应用部分截图：

![p1](http://upload-images.jianshu.io/upload_images/623504-b825a653dee193d7.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/300)

![p2.jpg](http://upload-images.jianshu.io/upload_images/623504-430e5c355e524eca.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/300)

![p3.jpg](http://upload-images.jianshu.io/upload_images/623504-a0a8c1ba87cc46c6.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/300)

为了不影响文章的可读性，这里就不放太多的截图了，感兴趣的可以去安装体验。

---

好了，开始正题。

### 干货IO 1.0

大概是今年3月份的时候关注了gan.io这个网站，这上面每天都会提供很多的技术干货，后面的时间我也是受益良多，与此同时也知道了drakeet为之做的一个 App [Meizhi](https://github.com/drakeet/Meizhi)，这个App最近好像有更新，非常好的一个开源项目，从这个项目中我也学到了很多。众所周知，gan.io是客户端最多的一个网站，应用市场一搜索就可以搜到很多关于gank的应用，但这些应用都有一个共同点，没有收藏功能，我个人感觉收藏功能还是比较重要的，他可以防止以后想回过来再看的时候不用花太多的时间去一页一页的找，这个就是我最开始想做这个App的的主要动机。于是就有了 **干货IO 1.0** 的出现，也是一个完全开源项目，在今年五月份就提交到了github，只有查看最新干货，分类浏览和收藏三个功能，只能说达到了预期目标，做的相对而言也比较粗糙，App并不是那么流畅。

1.0系列版本有过好几次更新，大多改动都不太大，基本上都是些bug的修复和一些小功能的增加，最大的一次改动就是使用 RxJava + Retrofit + MVP重构这个项目了，底层的代码改动算是比较大的，由于时间上的原因这次重构并不是太彻底，也因此造成了代码的混乱。说到这里我们来简单说说RxJava 、 Retrofit 、 MVP这三个技术吧，我相信大家对这三个技术肯定也不陌生。

RxJava可以以流的方式去处理我们的数据，线程的切换上也是十分的方便，可以大大减少代码量，网络上也涌现出了相关的库，很大程度上方便了我们的开发，RxJava相关的文章可以去我管理的专题看看 [RxJava系列专题（Android方向）](http://www.jianshu.com/collection/d79a6385bded)，这个专题基本上收录完了简书上关于RxJava最好的文章，当然，你有相关的比较好的文章也可以往这个专题投稿。

Retrofit是Square公司出品的又一大神器，一个高质量的http库，现在十分流行，网上关于他的文章也是多不胜数，他极大化的简化了我们的网络请求，使得我们的代码更加可读，以及方便后期的维护，加上RxJava简直就是完美 。

MVP是Android目前比较受欢迎的一种设计模式，个人感觉这个库比较适合于多人共同维护开发的大项目，一般的项目用MVP开发，会多出很多的类文件，有点影响开发效率，1.0版本就试过用MVP去重构项目，最后发现大大增大了我们的工作量，本来很快就能完成的一个功能，增加了很多的类文件，最后到了3.0版本我果断去掉了MVP（还残留了一部分）。项目开发的时候应该实际情况去选择设计模式，而不是盲目的套用现在十分流行的。

### 干货IO 2.0

这个版本在功能上其实没什么改变，只是调整了一下UI，把侧滑菜单中的部门功能放到了底部选项卡中，加入了谷歌最新推出的**BottomNavigationBar**。

### 干货IO 3.0

这个版本变化时比较大的，断断续续的花了我一周的时间去做，基本上是完全重构之前所有的代码，这次的重构是的代码更加的干净，比较有学习的价值，网络请求完全采用Retrofit+RxJava，网络请求也更加的清晰可控，新增了搜索和闲读，干货有了Gif配图，应用也更具MD的风格，在这里必须感谢下[Android-Proficiency-Exercise](https://github.com/ryanhoo/Android-Proficiency-Exercise)，分类列表的UI样式就来源于他。刚开始在做gif图加载的时候，加载十分的慢，并且内存使用也十分的大，最后经过查阅资料把Glide的缓存策略改为`DiskCacheStrategy.SOURCE`就可以了。列表的Adapter使用的是drakeet的[MultiType](https://github.com/drakeet/MultiType)，这个库处理含有多种itemType的RecyclerView非常的棒！如果还不知道这个库的，我强烈推荐使用。同时我基于[MultiType](https://github.com/drakeet/MultiType)也封装了一个通用列表的抽象类，很简单的就能实现一个列表，添加头部这个都不是事，最简单的列表只需实现loadData方法。

```java
@Override
public void loadData(final int pageIndex) {
    ServiceFactory.getInstance().createService(GankService.class)
            .getGanHuo(mType, pageIndex)
            .compose(TransformUtils.<HttpResult<List<GanHuoDataBean>>>defaultSchedulers())
            .subscribe(new Subscriber<HttpResult<List<GanHuoDataBean>>>() {
                @Override
                public void onCompleted() {

                }

                @Override
                public void onError(Throwable e) {
                    showError(new Exception(e));
                }

                @Override
                public void onNext(HttpResult<List<GanHuoDataBean>> listHttpResult) {
                    onDataSuccessReceived(pageIndex, listHttpResult.results);
                }
            });
}
```

上面的代码来源于分类列表Fragment，具体的实现可以去看文章末尾的源码。好了差不多就是这些了，这里贴代码也没有什么意义，反而影响文章的可阅读性，用到了哪些技术文章中也提到了，这个App综合了我前面好几篇博客的内容，也算是对之前讲解的技术的一个综合应用，并且应用是完全开源的，阅读源码可以看到更多的技术细节实现，反而更直接有效。如果在使用过程中发现有bug，非常欢迎反馈，我会继续维护这个项目。
写到这里突然感觉自己逼逼了好多的废话，轻喷~~~

### 特别感谢

[daimajia](https://github.com/daimajia)、[drakeet](https://github.com/drakeet)、[Android-Proficiency-Exercise](https://github.com/ryanhoo/Android-Proficiency-Exercise)

应用体验下载地址:[点击下载](http://android.myapp.com/myapp/detail.htm?apkName=ren.solid.ganhuoio)
源码传送门：[GanHuoIO](https://github.com/burgessjp/GanHuoIO)
