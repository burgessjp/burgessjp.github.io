---
title: "比系统自带的更好用的SnackBar"
date: 2016-05-09
tags: ["Android"]
category: "Android"
excerpt: "对Android原生SnackBar进行封装扩展，提供info、warning、danger、confirm等多种样式的SnackBar，使用简洁的API调用。"
---

关于SnackBar我相信不用我多说，我相信大部分的同学肯定都知道。他是在Android5.0之后才推出的，可以为一个操作提供了一个轻量级的反馈，用来代替Toast的。如果有不太了解的同学或者还不太清楚可以直接定位到 [这篇文章](http://www.jianshu.com/p/1e6eed09d48b) 的Snackbar去看看。

对于SnackBar我们通常是这样使用的，

```java
Snackbar.make(mDrawerLayout,"再按一次退出",Snackbar.LENGTH_SHORT).show();
```

他的展示效果比较单一，就只有一个黑色的背景。我们能不能每一种类型的提示都有不同的样式呢，答案是:肯定可以。
下面我就来简单介绍下今天要介绍的这个关于SnackBar的扩展，其实这个扩展我也参考了一些博客，发现一些博客只提供了方法，没有具体的去封装，还有一些的确封装了，但是个人感觉提供的Api不太好用，于是决定自己再去做一下。

![SnackBar效果演示](http://upload-images.jianshu.io/upload_images/623504-64c26a8d8fa7bfab.gif?imageMogr2/auto-orient/strip)

来看看最后的效果图。

关于这个扩展的使用，和原始api基本一致，但比原生的更好用。
先来看看怎么使用。

- 不带Action的

```java
SnackBarUtils.makeShort(v, "TEXT").show();
SnackBarUtils.makeShort(v, "TEXT").danger();
SnackBarUtils.makeShort(v, "TEXT").confirm();
SnackBarUtils.makeShort(v, "TEXT").info();
SnackBarUtils.makeShort(v, "TEXT").warning();
```

- 带有Action的

```java
SnackBarUtils.makeShort(v, "TEXT").info("action", new View.OnClickListener() {
                   @Override
                   public void onClick(View v) {
                       SnackBarUtils.makeShort(v, "TEXT").show();
                   }
               });
```

是不是很简洁，也很方便！ 如果你想让Snackbar显示的时间稍微长一点，可以调用`SnackBarUtils.makeLong()`方法，使用方法与上面一样。

其实代码的实现很简单，全部代码也没没到100行。（ps：在做这个封装的时候，我刚开始想过用构造者模式，最后在实现的时候发现不仅api使用不方便，还有点杀鸡用宰牛刀的感觉）。好了下面来看看代码实现。

```java
/**
 * Created by _SOLID
 * Date:2016/5/9
 * Time:11:30
 */
public class SnackBarUtils {
    private static final int color_danger = 0xffa94442;
    private static final int color_success = 0xff3c763d;
    private static final int color_info = 0xff31708f;
    private static final int color_warning = 0xff8a6d3b;

    private static final int action_color = 0xffCDC5BF;

    private Snackbar mSnackbar;

    private SnackBarUtils(Snackbar snackbar) {
        mSnackbar = snackbar;
    }

    public static SnackBarUtils makeShort(View view, String text) {
        Snackbar snackbar = Snackbar.make(view, text, Snackbar.LENGTH_SHORT);
        return new SnackBarUtils(snackbar);
    }

    public static SnackBarUtils makeLong(View view, String text) {
        Snackbar snackbar = Snackbar.make(view, text, Snackbar.LENGTH_LONG);
        return new SnackBarUtils(snackbar);
    }

    private View getSnackBarLayout(Snackbar snackbar) {
        if (snackbar != null) {
            return snackbar.getView();
        }
        return null;

    }



    private Snackbar setSnackBarBackColor(int colorId) {
        View snackBarView = getSnackBarLayout(mSnackbar);
        if (snackBarView != null) {
            snackBarView.setBackgroundColor(colorId);
        }
        return mSnackbar;
    }

    public void info() {
        setSnackBarBackColor(color_info);
        show();
    }

    public void info(String actionText, View.OnClickListener listener) {
        setSnackBarBackColor(color_info);
        show(actionText, listener);
    }

    public void warning() {
        setSnackBarBackColor(color_warning);
        show();
    }

    public void warning(String actionText, View.OnClickListener listener) {
        setSnackBarBackColor(color_warning);
        show(actionText, listener);
    }

    public void danger() {
        setSnackBarBackColor(color_danger);
        show();
    }

    public void danger(String actionText, View.OnClickListener listener) {
        setSnackBarBackColor(color_danger);
        show(actionText, listener);
    }

    public void confirm() {
        setSnackBarBackColor(color_success);
        show();
    }

    public void confirm(String actionText, View.OnClickListener listener) {
        setSnackBarBackColor(color_success);
        show(actionText, listener);
    }

    public void show() {
        mSnackbar.show();
    }

    public void show(String actionText, View.OnClickListener listener) {
        mSnackbar.setActionTextColor(action_color);
        mSnackbar.setAction(actionText, listener).show();
    }
}
```

如果感觉好用可直接拿走。因为相对而言比较简单，所以代码里面就没给注释了。我相信正在阅读的你肯定能看懂，真看不懂的可留言。如果感觉字体颜色不太搭，可以修改代码为每一种样式提供一种字体颜色，或者如果感觉api不够用，还可以为这个扩展类带来更多的灵活的api。

参考文章：

- [Design Support Library第三部分：Snackbar样式](http://www.jcodecraeer.com/a/anzhuokaifa/androidkaifa/2015/0714/3186.html)
- [没时间解释了，快使用SnackBar!](http://mp.weixin.qq.com/s?__biz=MzAxMTI4MTkwNQ==&mid=2650820083&idx=1&sn=1cd6b3d66b9d0054054df548c5b4afbb&scene=23&srcid=05090VutW25mPtOHU6HqozkR#rd)
