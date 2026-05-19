---
title: "仿魅族手机消息通知效果"
date: 2016-06-14
tags: ["Android"]
category: "Android"
excerpt: "使用WindowManager实现仿魅族手机顶部消息通知效果，支持自动消失和滑动删除。"
---

用了一年多的魅族手机了，先不说手机性能怎么样，个人是非常喜欢魅族的UI，各方面都比较符合我的审美，感觉魅族在UI的设计上在国内还是听超前的吧。这不是广告，这只是一条华丽的分割线

---

下面就进入今天的正题吧。今天我要实现的是一个魅族的通知效果，先来看看魅族原生的效果吧。

![魅族原生通知效果](http://upload-images.jianshu.io/upload_images/623504-62c7658ba7ace254.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

最上面的那个区域就是魅族魅族的通知，在一段时间后会自动消失，并且可以滑动删除。这样做给用户的体验还是挺不错的。

既然要能脱离应用显示，第一个想到的肯定是WindowManager，当然只是为了在应用内显示PopupWindow也可以，但是PopupWindow内部也是用的WindowManager实现的，所以最后我选择了WindowManager去在实现这个效果。

那么来看看最终做出来的效果吧。

![最终效果](http://upload-images.jianshu.io/upload_images/623504-ad326cabb19e671a.gif?imageMogr2/auto-orient/strip)

和原生的还是有那么一些的差别，最重要的一点就是我的这个没做到覆盖状态栏，在其中我也想了很多办法，始终还是没能实现，当然如果有知道的也望你的指点

如果还有不太了解WindowManager的同学，推荐去看看**码农小阿飞**的这篇文章[像360悬浮窗那样，用WindowManager实现炫酷的悬浮迷你音乐盒（上）](http://www.jianshu.com/p/95ceb0a2ed27)

### 下面来看看具体的实现

代码我就不全文贴了，这样做比较影响阅读，文末会有源码链接。

先来看看WindowManager创建的这一块

```java
      mWindowManager = (WindowManager)
mContext.getSystemService(Context.WINDOW_SERVICE);
      mWindowParams = new WindowManager.LayoutParams();
      mWindowParams.type = WindowManager.LayoutParams.TYPE_TOAST;// 系统提示window
      mWindowParams.gravity = Gravity.LEFT | Gravity.TOP;
      mWindowParams.width = WindowManager.LayoutParams.MATCH_PARENT;
      mWindowParams.height = WindowManager.LayoutParams.WRAP_CONTENT;
      mWindowParams.flags =
              WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
              WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;
      //设置进入和退出动画
      mWindowParams.windowAnimations = R.style.NotificationAnim;
      mWindowParams.x = 0;
      mWindowParams.y = -mStatusBarHeight;
```

这里设置了很多的flag，
FLAG_LAYOUT_NO_LIMITS：让Window能全屏显示，能延伸至状态栏
FLAG_NOT_TOUCH_MODAL: 不阻塞事件传递到后面的窗口,如果不设置这个flag，当我们的Window显示出来的时候，Window之外的地方就接收不到任何的事件。

```java
mWindowParams.windowAnimations = R.style.NotificationAnim;
```

这句就是设置Window显示和消失的默认动画。

由于这个通知窗口是全屏显示，如果不做任何的处理，状态栏就会遮挡住通知窗口的一部分（ps：不知道怎么解决让通知窗口覆盖状态栏的办法）。我的解决方案是，在布局文件中添加一个占位的View然后在代码中动态得到状态栏的高度，然后对这个占位View的高度赋值，还是很好的解决了这个问题。

到这里就差不多可以将通知窗口给显示出来了。接着来看下怎么实现滑动功能。

滑动的实现其实也还是比较的简单，就是对内容视图添加一个OnTouch事件。然后在OnTouch事件里面做一些处理。下面看代码的详细实现：

```java
private int downX = 0;
 private int direction = DIRECTION_NONE;

 @Override
 public boolean onTouch(View v, MotionEvent event) {
     if (isAnimatorRunning()) {
         return false;
     }
     switch (event.getAction()) {
         case MotionEvent.ACTION_DOWN:
             downX = (int) event.getRawX();//记录下相对于屏幕的坐标
             break;
         case MotionEvent.ACTION_MOVE:
             //处于滑动状态就取消自动消失
             mHandler.removeMessages(HIDE_WINDOW);
             int moveX = (int) event.getRawX() - downX;
             //判断滑动方向
             if (moveX > 0) {
                 direction = DIRECTION_RIGHT;
             } else {
                 direction = DIRECTION_LEFT;
             }
             updateWindowLocation(moveX, mWindowParams.y);//更新窗口的位置
             break;
         case MotionEvent.ACTION_UP:
             if (Math.abs(mWindowParams.x) > mScreenWidth / 2) {
                 startDismissAnimator(direction);//开始消失动画
             } else {
                 startRestoreAnimator();//开始恢复动画
             }
             break;
     }
     return true;
 }
```

这段代码其实并不复杂，只要仔细看看就会懂了。

关于对通知窗体里面的赋值，我用的是构造者模式。比较重要的就是这些了，更详细的代码实现可以去看源码。

来看看怎么去使用:

```java
MeiZhuNotification notification =
               new MeiZhuNotification.Builder().setContext(this)
                       .setTime(System.currentTimeMillis())
                       .setImgRes(R.drawable.notify)
                       .setTitle("你收到了一条消息")
                       .setContent("人丑就得多读书").build();

notification.show();
```

如果没设置图标和标题就相当于一条普通的消息，也还是比较实用的。

最后，源码链接：[MeiZhuNotification](https://github.com/burgessjp/MeiZhuNotification)
