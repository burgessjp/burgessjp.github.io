---
title: "自定义ItemDecoration这个问题你真的注意到了吗"
date: 2017-04-06
tags: ["Android", "RecyclerView"]
category: "Android"
excerpt: "讨论自定义GridDividerItemDecoration时容易被忽略的偏移量分配问题，分析源码找出最后一列itemView宽度异常的原因，并给出均匀分配offset的解决方案。"
---

> 本文讨论的是关于自定义ItemDecoration容易被忽略的问题，此文适合有过自定义ItemDecoration经验的同学阅读，还没有学习过的可以先去看看相关文章再来看本文。

**ItemDecoration** 我相信只要使用过RecyclerView的同学肯定都比较熟悉了，我们在使用 **RecyclerView** 的时候一般都是用这个来画分隔线的，不得不说十分的好用。但是在最近发现在使用自定义的**ItemDecoration**上遇到了一些细节上的问题，我这里自定义了一个**GridDividerItemDecoration** ，用于网格布局的分隔，大概效果如下图所示：

![GridDividerItemDecoration效果](http://upload-images.jianshu.io/upload_images/623504-79211e4d8ae74ee9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

**绘制的逻辑大概是这样的：当 itemView 不是最后一列或者最后一行的时候就绘制右侧和底部分隔线，如果是最后一列时则不绘制右侧分隔线，如果是最后一行则不绘制底部分隔线。**

代码大概是这样的

```java
if (isLastRow && isLastColumn) {//最后一行最后一列什么都不绘制
    outRect.set(0, 0, 0, 0);
} else if (isLastRow) {// 如果是最后一行，则不需要绘制底部
    outRect.set(0, 0, mDividerHeight, 0);
} else if (isLastColumn) {// 如果是最后一列，则不需要绘制右边
    outRect.set(0, 0, 0, mDividerHeight);
} else {
    outRect.set(0, 0, mDividerHeight,
            mDividerHeight);
}
```

这里的分割线设置的宽度只有1dp，看起来似乎没有什么问题，但是如果把分隔线的宽度设置为20dp效果如下图所示：

![分隔线宽度20dp效果](http://upload-images.jianshu.io/upload_images/623504-622640741f5eba50.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

会明显的感觉到最后一列itemView的宽度会比前几列宽一些，具体的数值就是我们设置的 dividerWidth （也就是分隔线的宽度），正常情况下我们在自定义的 ItemDocration 设置 ItemOffsets 不会影响 itemView 的的大小，然而这里却出现了这个问题（其实网上绝大部分流行的关于网格的ItemDocration都存在这个问题），什么原因呢，看看下面两段源码就会知道了

```java
private void measureChild(View view, int otherDirParentSpecMode, boolean alreadyMeasured) {
       final LayoutParams lp = (LayoutParams) view.getLayoutParams();
       final Rect decorInsets = lp.mDecorInsets;
       final int verticalInsets = decorInsets.top + decorInsets.bottom
               + lp.topMargin + lp.bottomMargin;
       final int horizontalInsets = decorInsets.left + decorInsets.right
               + lp.leftMargin + lp.rightMargin;
       final int availableSpaceInOther = getSpaceForSpanRange(lp.mSpanIndex, lp.mSpanSize);
       final int wSpec;
       final int hSpec;
       if (mOrientation == VERTICAL) {
           //最后一个参数用来标识在当前的mOrientation 下是否可以滚动，
           //当mOrientation 是VERTICAL的时候水平方向肯定是不能滚动的
           wSpec = getChildMeasureSpec(availableSpaceInOther, otherDirParentSpecMode,
                   horizontalInsets, lp.width, false);
           hSpec = getChildMeasureSpec(mOrientationHelper.getTotalSpace(), getHeightMode(),
                   verticalInsets, lp.height, true);
       } else {
           hSpec = getChildMeasureSpec(availableSpaceInOther, otherDirParentSpecMode,
                   verticalInsets, lp.height, false);
           wSpec = getChildMeasureSpec(mOrientationHelper.getTotalSpace(), getWidthMode(),
                   horizontalInsets, lp.width, true);
       }
       measureChildWithDecorationsAndMargin(view, wSpec, hSpec, alreadyMeasured);
   }
```

```java
public static int getChildMeasureSpec(int parentSize, int parentMode, int padding,
                int childDimension, boolean canScroll) {
            int size = Math.max(0, parentSize - padding);
            int resultSize = 0;
            int resultMode = 0;
            if (canScroll) {
                if (childDimension >= 0) {
                    resultSize = childDimension;
                    resultMode = MeasureSpec.EXACTLY;
                } else if (childDimension == LayoutParams.MATCH_PARENT) {
                    switch (parentMode) {
                        case MeasureSpec.AT_MOST:
                        case MeasureSpec.EXACTLY:
                            resultSize = size;
                            resultMode = parentMode;
                            break;
                        case MeasureSpec.UNSPECIFIED:
                            resultSize = 0;
                            resultMode = MeasureSpec.UNSPECIFIED;
                            break;
                    }
                } else if (childDimension == LayoutParams.WRAP_CONTENT) {
                    resultSize = 0;
                    resultMode = MeasureSpec.UNSPECIFIED;
                }
            } else {
                if (childDimension >= 0) {
                    resultSize = childDimension;
                    resultMode = MeasureSpec.EXACTLY;
                } else if (childDimension == LayoutParams.MATCH_PARENT) {
                    resultSize = size;
                    resultMode = parentMode;
                } else if (childDimension == LayoutParams.WRAP_CONTENT) {
                    resultSize = size;
                    if (parentMode == MeasureSpec.AT_MOST || parentMode == MeasureSpec.EXACTLY) {
                        resultMode = MeasureSpec.AT_MOST;
                    } else {
                        resultMode = MeasureSpec.UNSPECIFIED;
                    }

                }
            }
            //noinspection WrongConstant
            return MeasureSpec.makeMeasureSpec(resultSize, resultMode);
        }
```

由于我们这里讨论的是垂直方向上的Grid，所以 **mOrientation == VERTICA**，从上面的代码可以看出当我们的itemView宽度不是精确数值的时候，然后测量出的宽度就为 **Math.max(0, parentSize - padding)**（这里的 padding 就是 `horizontalInsets = decorInsets.left + decorInsets.right + lp.leftMargin + lp.rightMargin`），原来这里在实际的宽度下还减去了ItemDecoration的左右偏移量，这也就解释了上面的那个问题。有人会问我们可不可以把宽度设置为固定值呢？可以当然是可以的，但是又会出现其他问题，下来你可以去尝试一下，这里我就不再去细究了。

一般情况下当 mOrientation == VERTICA 的时候itemView的宽度是 match_parent的，当 mOrientation == HORIZONTAL的时候itemView的高度就是 match_parent的，这样才能更好的去适配各种屏幕的手机。

这里我们找到了问题的原因所在，应该怎样去解决呢？  其实也很简单，就是均匀的分配offset给每一个itemView。

下面我们来计算一下偏移量。

```
// 每一个itemView的总偏移量（left+right）
eachOffset =（spanCount-1）* dividerWidth / spanCount;

L0=0 , R0=eachOffset;
L1=dividerWidth-R0 , R1=eachOffset-L1;
L2=dividerWidth-R1 , R2=eachOffset-L2;
```

其中：
L~n~:表示第n列itemView  left 偏移量。
R~n~:表示第n列itemView  right 偏移量。

可能有些同学看到上面式子会有点凌乱，这里我直接告诉你最后推算出的结论好了，L~n~ 是一个以 **dividerWidth-eachOffset** 为差值的一个等差数列，R~n~就等于 **eachWidth-L~n~**。所以我们最后对 getItemOffsets 做了改进，代码如下：

```java
int left = 0;
int top = 0;
int right = 0;
int bottom = 0;
int eachWidth = (spanCount - 1) * mDividerHeight / spanCount;
int dl = mDividerHeight - eachWidth;

left = itemPosition % spanCount * dl;
right = eachWidth - left;
bottom = mDividerHeight;

if (isLastRow) {
    bottom = 0;
}
outRect.set(left, top, right, bottom);
```

最后的效果图如下：

![修复后效果](http://upload-images.jianshu.io/upload_images/623504-36ce8945af500155.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

完美的解决了上面出现的问题，这都是些细节上的问题，如果不怎么注意，还真的很难去注意到，以后如果遇到其他类似的问题也可以很容易的解决了。本文只是讨论了在使用ItemDecoration其中的一个问题，并不算难，但是也很重要，所以大家在平时的开发中还是应该多多注意细节上的问题。

最后送上本文源码地址:

1. [GridDividerItemDecoration](https://github.com/burgessjp/QuickDevLib/blob/master/library/src/main/java/me/solidev/library/ui/recyclerview/GridDividerItemDecoration.java)

- [GridDividerItemDecorationBug](https://github.com/burgessjp/QuickDevLib/blob/master/library/src/main/java/me/solidev/library/ui/recyclerview/GridDividerItemDecorationBug.java)

顺便给大家推荐一个十分强大的开源自定义的ItemDecoration ，适用于 **LinearLayoutManager**作为布局管理器的RecyclerView : [RecyclerView-FlexibleDivider](https://github.com/yqritc/RecyclerView-FlexibleDivider)
