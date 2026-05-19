---
title: "Android自定义ViewGroup之仿制一个Windows桌面"
date: 2016-04-28
tags: ["Android"]
category: "Android"
excerpt: "通过仿制Windows桌面来讲解Android自定义ViewGroup的实现，详细介绍onMeasure和onLayout两个核心方法的使用。"
---

前段时间写过一个[Android自定义View的文章](http://www.jianshu.com/p/740c64ba15ac)，是高仿的QQ健康，还没有看过的可以去看看，所以一直都计划着在写个自定义ViewGroup相关的文章。我知道网上关于这方面的文章已经是一搜一大堆的那种了，所以我想一定要找个与网上的不同的来做Demo，还是要稍微有点新意，由于一直找不到所以就一直拖着了，最近也是突然间想到Windows的桌面不错，我可以拿这个作为一个自定ViewGroup的Demo啊，于是就着手写了这么一个。本文比较简单，适合那些还不太会自定义ViewGroup的同学看看。先来看看最后的效果图

![Demo效果图](http://upload-images.jianshu.io/upload_images/623504-7263db4919b58b08.gif?imageMogr2/auto-orient/strip)

自定义一个ViewGroup，其实真的并不太难，主要就在onMeasure和onLayout这两个方法上下功夫，无非就是去把子View的大小测量出来然后再把子View按照一定的规则放置到相应的位置上，只要把测量和布局的逻辑和思想弄懂了，自定义ViewGroup就是小Case了。

下面就来说说上面的这个自定义ViewGroup怎么做吧。
先来说说思路，整个ViewGroup分为两个区域，上面是内容区，下面是底部状态栏，我这个自定义ViewGroup的做法就是默认的把最后添加的那一个View来作为底部状态栏。至于弹出来的那个就是个PopWondow，与自定义ViewGroup是没有什么关系的，是在使用的时候添加的。

来看看代码实现

## 1.onMeasure方法

![onMeasure](http://upload-images.jianshu.io/upload_images/623504-2591f4bfacc2602c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

与自定义View唯一不同的就是，在ViewGroup的onMeasure方法里还需对他所包含的View的大小进行测量，里面的measureChildren是调用的系统的测量方法，他是将父布局的测量规格作为参数传递到这个方法中，然后根据父布局的测量规格去测量子View的大小（感兴趣可以去源码查看，还是比较简单的，这里我们完全可以自己去做这个测量，既然系统已经提供了，就不用去那些重复的事了）。最后就是setMeasuredDimension设置ViewGroup本身的大小，这里我对ViewGroup是大小是wrap_content的情况，就直接将其大小设置为0了，在这个自定义ViewGroup中wrap_content也没多大的意义。

## 2.onLayout方法

当测量完成之后就是对ViewGroup中的子View进行放置了，View的layout方法就是用来去将View放到某个位置用的，来看看onLayout方法的实现。

![onLayout](http://upload-images.jianshu.io/upload_images/623504-4fa8631f16bf23a5.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这里简单说一下，onLayout方法中的那几个参数的含义

- changed:默认这个值都是为false，如果这个ViewGroup的位置改变了，导致了被重新布局，这个值就为true，
- l:ViewGroup left的位置
- t:ViewGroup top的位置
- r:ViewGroup right的位置
- b:ViewGroup bottom的位置

我们都知道，一般知道了一个View的left，top，right，bottom就决定了这个View的位置。

代码中大部分我注释的还是比较清楚了，这里只来看看for循环里面的实现,里面的逻辑就是去计算将要放置的View的位置的。
注意到，if(cb>contentHeight) 这句，就是如果当前将要放置的View的bottom位置已经超过了内容区的高度，那么我们就将列数加1，将之放到下一列中去。

整个自定义ViewGroup就完了，就是这么简单。我们来看看怎么在布局文件中去使用。

```xml
<ren.solid.materialdesigndemo.view.WindowsLayout
       android:id="@+id/windows_layout"
       android:layout_width="match_parent"
       android:layout_height="match_parent"
       android:background="#6b6b6b">

       <LinearLayout
           android:layout_width="100dp"
           android:layout_height="100dp"
           android:gravity="center"
           android:orientation="vertical">

           <ImageView
               android:layout_width="50dp"
               android:layout_height="50dp"
               android:src="@drawable/icon_folder" />

           <TextView
               android:layout_width="wrap_content"
               android:layout_height="wrap_content"
               android:text="文件夹" />
       </LinearLayout>

       <LinearLayout
           android:layout_width="100dp"
           android:layout_height="100dp"
           android:gravity="center"
           android:orientation="vertical">

           <ImageView
               android:layout_width="50dp"
               android:layout_height="50dp"
               android:src="@drawable/icon_folder" />

           <TextView
               android:layout_width="wrap_content"
               android:layout_height="wrap_content"
               android:text="文件夹" />
       </LinearLayout>

       <LinearLayout
           android:layout_width="100dp"
           android:layout_height="100dp"
           android:gravity="center"
           android:orientation="vertical">

           <ImageView
               android:layout_width="50dp"
               android:layout_height="50dp"
               android:src="@drawable/icon_folder" />

           <TextView
               android:layout_width="wrap_content"
               android:layout_height="wrap_content"
               android:text="文件夹" />
       </LinearLayout>

       <LinearLayout
           android:layout_width="100dp"
           android:layout_height="100dp"
           android:gravity="center"
           android:orientation="vertical">

           <ImageView
               android:layout_width="50dp"
               android:layout_height="50dp"
               android:src="@drawable/icon_folder" />

           <TextView
               android:layout_width="wrap_content"
               android:layout_height="wrap_content"
               android:text="文件夹" />
       </LinearLayout>

       <LinearLayout
           android:layout_width="100dp"
           android:layout_height="100dp"
           android:gravity="center"
           android:orientation="vertical">

           <ImageView
               android:layout_width="50dp"
               android:layout_height="50dp"
               android:src="@drawable/icon_folder" />

           <TextView
               android:layout_width="wrap_content"
               android:layout_height="wrap_content"
               android:text="文件夹" />
       </LinearLayout>

       <LinearLayout
           android:layout_width="100dp"
           android:layout_height="100dp"
           android:gravity="center"
           android:orientation="vertical">

           <ImageView
               android:layout_width="50dp"
               android:layout_height="50dp"
               android:src="@drawable/icon_folder" />

           <TextView
               android:layout_width="wrap_content"
               android:layout_height="wrap_content"
               android:text="文件夹" />
       </LinearLayout>


       <LinearLayout
           android:id="@+id/ll_bottom"
           android:layout_width="match_parent"
           android:layout_height="50dp"
           android:background="#e0000000"
           android:gravity="center_vertical"
           android:orientation="horizontal"
           android:paddingLeft="10dp">

           <ImageView
               android:layout_width="30dp"
               android:layout_height="30dp"
               android:src="@drawable/icon_windows" />
       </LinearLayout>


   </ren.solid.materialdesigndemo.view.WindowsLayout>
```

在这个自定义的ViewGroup中，前面放置的都是内容区的，最后一个是底部状态栏。就这样就可以实现最开始那个动态图中的效果。对于点击左下角的徽标，可以弹出一个层，我使用的是PopWindow，代码如下：

```java
LinearLayout ll_bottom = customFindViewById(R.id.ll_bottom);
       ll_bottom.setOnClickListener(new View.OnClickListener() {
           @Override
           public void onClick(View v) {

               int[] location = new int[2];
               v.getLocationOnScreen(location);

               View popupView = LayoutInflater.from(getMContext()).inflate(R.layout.pop_windows, null);
               PopupWindow popupWindow = new PopupWindow(popupView, ViewGroup.LayoutParams.WRAP_CONTENT,
                       ViewGroup.LayoutParams.WRAP_CONTENT, true);
               popupView.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED);
               popupWindow.setBackgroundDrawable(new ColorDrawable(Color.parseColor("#e0000000")));
               popupWindow.setOutsideTouchable(true);
               popupWindow.setFocusable(true);
               int height=popupView.getMeasuredHeight();
               popupWindow.showAtLocation(v, Gravity.NO_GRAVITY, location[0], location[1]-height);
           }
       });
```

源码附上：[源码](https://github.com/burgessjp/MaterialDesignDemo/blob/master/app/src/main/java/ren/solid/materialdesigndemo/view/WindowsLayout.java)
