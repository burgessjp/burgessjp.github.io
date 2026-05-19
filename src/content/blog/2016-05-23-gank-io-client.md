---
title: "基于Gank-IO提供的API的第三方客户端"
date: 2016-05-23
tags: ["项目"]
category: "项目"
excerpt: "基于Gank.IO开放API开发的第三方Android客户端，支持在线收藏功能，采用MVP架构、RxJava、新浪微博登录，Material Design风格设计。"
---

> 最近也是因为准备毕业设计的事，很久没更新博客了，但是在这段时间我也不是没有准备这方面的东西。知道gank.io的同学肯定知道，代码家在上面提供了一个免费开放的api供大家去玩，这个接口的信息每天也在更新，发布的内容也是很有质量的，不仅有技术类的文章，还有我们喜欢的福利图。之前我也是看到很多比较好的链接由于时间问题，没来的及看，每次回去找都得花很多的时间。也是正因为这个原因激发了我做一个基于Gank.IO提供的API的第三方客户端，最初计划的两个重要功能是可以对信息进行在线收藏和离线缓存，因为时间原因后者暂时没有实现，后面的更新我肯定会实现的。重要的是本项目完全开源，项目已经上传至Github,项目中覆盖了MVP、RxJava、第三方登录以及很多第三方库的使用，我相信本项目的源码对那些正在自学的同学还是有价值的。(ps:这个应用其实都做完一段时间了，微博那边一直没给审核通过，没法正式发布，所以一直没发布出来)

APP下载地址（fir.im）：[干货IO](http://fir.im/ganhuoio)
也欢迎大家去应用商店下载:[干货IO](http://android.myapp.com/myapp/detail.htm?apkName=ren.solid.ganhuoio)
源码地址：[GanHuoIO](https://github.com/burgessjp/GanHuoIO)  欢迎Star和Fork，提交问题到 Issues

先来两张App的截图

![](http://upload-images.jianshu.io/upload_images/623504-b273dd5d2e63fc4b.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![S60521-211246.jpg](http://upload-images.jianshu.io/upload_images/623504-3a7543e4e650cd4a.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

下面就来简单的介绍一下这个项目吧

App是MD风格的，后端服务是用的bomb，由于涉及到了收藏肯定会有登录，对于登录目前只能使用新浪微博（我也借助新浪微博ID是唯一的这一点），用到了MVP，RxJava，这里我也只是单纯的把RxJava来当做EventBus来使用的，最初我本来是计划把最近很火的Retrofit也加上的，但是这次这个项目的最底层是基于我之前自己开发的一个快速开发库的，里面对网络层做了封装，因为Retrofit是基于注解的，我改动的还是比较多，所以最后就放弃了，对于侧滑菜单，我用的是[MaterialDrawer](https://github.com/mikepenz/MaterialDrawer)，而不是系统自带的那个NavigationView，MaterialDrawer比系统自带的更加的强大和灵活。

来看看App的基本操作

![App基本操作](http://upload-images.jianshu.io/upload_images/623504-272e96a7ee176af9.gif?imageMogr2/auto-orient/strip)

我们可以对信息进行收藏，也可以对类别进行拖动排序（对于RecyclerView的拖动排序十分的简单，只需一个ItemTouchHelper就可以实现）

![拖动排序](http://upload-images.jianshu.io/upload_images/623504-43c90c49394c2b3d.gif?imageMogr2/auto-orient/strip)

里面还有更多的操作等着你的使用。

如果你感觉还不错就赶紧去下载使用吧，非常欢迎大家提供在使用过程中的bug（我没对5.0以下的手机进行适配，我相信作为开发者的你，应该不可能还会在使用5.0以下的系统）。
