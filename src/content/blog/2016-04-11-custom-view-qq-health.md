---
title: "Android自定义View之高仿QQ健康"
date: 2016-04-11
tags: ["Android"]
category: "Android"
excerpt: "通过高仿QQ健康页面，介绍Android自定义View的实现过程，包括onMeasure测量、onSizeChanged自适应、onDraw绘制等关键步骤。"
---

源码有更新：加入动画，动画由简书网友xsfelvis提供

> 我们都知道自定义View一般有三种**直接继承View**、**继承原有的控件对控件的进行修改**、**重新拼装组合**，最后一种主要针对于ViewGroup。具体的怎么做不是本文的所涉及的内容（本文是基于第一种方式实现的），还不太了解的请自行查询相关资料。这次这篇文章主要给大家带来一个高仿QQ健康的自定义View的实现，在介绍的过程中会对涉及到的自定义View相关知识点进行简单的说明，着重点还是在怎么是实现这个自定义View上。

好了，话不多说。我们来看看QQ健康页面的这个View吧。下面就是给大家讲解这个View怎么去实现。
![QQ健康](http://upload-images.jianshu.io/upload_images/623504-c9055114e1633799.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

来分析下这个View，最上面有一个圆弧，圆弧里面包含了一些文字，在圆弧的下面有几根竖条，很容易会想到这些竖条的长度是根据每天的步数来计算的。左下方是自己的头像，右下方可以点击查看。
我是使用的第一种方式，了解自定义View的同学肯定知道，第一种方式一般就是重写OnDraw方法利用Paint在Canvas中一笔一笔的画。

这个View的宽和高是有一定的比例的。如果我们随意的给宽高，然后又没有一定的比例最后渲染出来的View肯定是很混乱的。所以我首先重写了下onMeasure方法

![](http://upload-images.jianshu.io/upload_images/623504-30892374cc2e5b46.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

> 在初始化方法中有个mRatio是宽高的比例，是我根据截图用像素尺亮出来的，这个因人而异，可能每个人都会有不一样的度量结果，只要记住这个的作用是用来按照一定的比例绘制这个View的就OK了，这样做的好处就是不管这个View多大多小里面的内容都能够自适应，包括后面可能会会出现的一大堆数字，看到可能会有点晕，不用去管他。

知识点扫盲之**MeasureSpec**：他代表一个32位的int值，前两位代表SpecMode，后30位代表SpecSize。一个MeasureSpec封装了父布局传递给子布局的布局要求，每个MeasureSpec代表了一组宽度和高度的要求。

从代码中可以看到如果widthMode 是EXACTLY 或者AT_MOST，我们就将父布局传递过来的测量宽度作为View的宽度。如果不是这两种就将前面定义的默认的宽度来作为View宽度（这个一般不会用到）。宽度测量完了之后，就按照一定的比例计算出高度，然后就将这个高度作为我们View的高度，这样做，View的高度都是按照宽度来计算的，这样做的好处是我们在使用这个View的时候不会导致变形。
值得注意的是测量完了之后一定要调用 setMeasuredDimension这个方法。

下面我们再来看看onSizeChanged方法，这里是自适应的关键

![](http://upload-images.jianshu.io/upload_images/623504-58e2b66f6ae021c4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

mArcCenterX 和mArcCenterY 是最上面那个圆弧的中心。我们都知道在Android中画一个圆弧需要一个这个圆弧的外接矩形，mArcRect就是这个外接矩形，mArcWidth和mBarWidth是对应画笔的宽度，在这个方法中我们对这些值作了初始化的工作。如果在构造函数里面取调用这个方法，宽和高是未知的。

到这里我们的初始化工作做得差不多了。下面来看看最重要的onDraw方法中都干了些什么，下面代码都是onDraw方法里面的（代码较长一次性截不完）

![](http://upload-images.jianshu.io/upload_images/623504-0ce87cd7b50c2149.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/623504-6fe50f733534a453.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/623504-a5fe9bc9b8daccbf.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
![](http://upload-images.jianshu.io/upload_images/623504-6361b545aabc8639.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

我注释的还是比较详细了，步骤也已经标明了，我相信仔细看肯定能看懂。对于绘制背景那里我多说两句，绘制背景的圆角我用的是贝塞尔曲线画的，当然你也可以直接使用canvas.drawRoundRect去画，但是对于这样一种需求：一个矩形上面两个角是圆角，下面的就是正常的方角，canvas.drawRoundRect显然办不到，然而贝塞尔曲线可以很容易办到，当然贝塞尔曲线的作用不仅仅是这个，它是非常强大的，只要是你能想到的他基本上都是能办到。这里有一篇关于贝塞尔曲线比较好的文章，感兴趣的可以去看看。
[Android 自定义View高级特效，神奇的贝塞尔曲线](http://mp.weixin.qq.com/s?__biz=MjM5NDkxMTgyNw==&mid=405545611&idx=1&sn=6f59bb10a31c520aae2c6fbef382053e&scene=0#wechat_redirect)

最后我们来看看怎么对右下角的那个查看添加点击事件吧
![](http://upload-images.jianshu.io/upload_images/623504-834e3287e7252674.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
其实还是很简单，我们找到右下角对应的一个矩形区域，然后判断当前点击的坐标在不在这个矩形区域内就可以了。

**值得注意的是要记得在初始化方法中加上这句代码
`setLayerType(View.LAYER_TYPE_SOFTWARE, null);`
这句是关闭硬件加速，防止某些4.0的设备虚线显示为实线的问题，可以在AndroidManifest.xml时的Application标签加上android:hardwareAccelerated="false",这样整件应用都关闭了硬件加速，虚线可以正常显示，但是关闭硬件加速对性能有些影响，所以这里我们只对当前这个View关闭硬件加速就行了。**

我们来看看最后我们实现的效果吧。

![](http://upload-images.jianshu.io/upload_images/623504-b7b0bd4982e2d151.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/623504-bb924a232b8f1127.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

![](http://upload-images.jianshu.io/upload_images/623504-f41852622a8a8d73.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

是不是还是挺不错的，并且还能自适应大小，和QQ的基本上一模一样。

由于代码量还是比较大，完整的贴出来比较 ，就不贴到这篇文章中了，需要完整版代码的请点击：
[完整代码](https://github.com/burgessjp/MaterialDesignDemo/blob/master/app/src/main/java/ren/solid/materialdesigndemo/view/QQHealthView.java)
