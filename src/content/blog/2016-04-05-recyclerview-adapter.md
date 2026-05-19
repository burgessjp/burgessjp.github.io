---
title: "打造一个RecyclerView的万能适配器"
date: 2016-04-05
tags: ["Android", "RecyclerView"]
category: "Android"
excerpt: "通过封装一个通用的RecyclerView适配器，减少重复的Adapter和ViewHolder代码，提供简洁的数据绑定方式。"
---

我们都知道每次在我们使用RecyclerView这样的列表组件的时候，我们都会先去创建一个Adapter，对于RecyclerView的Adapter我们已经不需要对itemView的复用操心了，使用过ListView，GridView的肯定知道，对于ItemView的复用需要我们自己去做。但是对于这个RecyclerView的Adapter我们还是会写很多重复的代码，在ViewHolder中也会有很多的FindViewById()这样的代码在里面，写一次无所谓，但是如果我们的项目里面需要写很多个这样的Adapter的时候呢？如果"不偷下懒"，我相信你会写的醉生梦死。

先说明下：本文的思想是基于HongYang的这篇博客：[Android 快速开发系列 打造万能的ListView GridView 适配器](http://blog.csdn.net/lmj623565791/article/details/38902805)，他的是基于ListView，GridView的。本文并没有什么技术含量，只是一种简单的封装而已。
我们来看看怎么去实现这个适配器吧（下面代码可直接拷贝使用）：

```java
/**
 * Created by _SOLID
 * Date:2016/4/5
 * Time:11:18
 * <p>
 * 通用的RecyclerView的适配器
 * </p><p>
 * 思想上参考了Hongyang的 http://blog.csdn.net/lmj623565791/article/details/38902805这篇博客
 */
public abstract class SolidRVBaseAdapter<T> extends RecyclerView.Adapter<SolidRVBaseAdapter.SolidCommonViewHolder> {

    protected List<T> mBeans;
    protected Context mContext;
    protected boolean mAnimateItems = true;
    protected int mLastAnimatedPosition = -1;

    public SolidRVBaseAdapter(Context context, List<T> beans) {
        mContext = context;
        mBeans = beans;
    }

    @Override
    public SolidRVBaseAdapter.SolidCommonViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        LayoutInflater inflater = LayoutInflater.from(mContext);
        View view = inflater.inflate(getItemLayoutID(viewType), parent, false);
        SolidCommonViewHolder holder = new SolidCommonViewHolder(view);
        return holder;
    }


    @Override
    public void onBindViewHolder(SolidRVBaseAdapter.SolidCommonViewHolder holder, int position) {
        runEnterAnimation(holder.itemView, position);
        onBindDataToView(holder, mBeans.get(position));

    }

    /**
     * 绑定数据到Item的控件中去     *
     * @param holder
     * @param bean
     */
    protected abstract void onBindDataToView(SolidCommonViewHolder holder, T bean);

    /**
     * 取得ItemView的布局文件     *
     * @return
     */
    public abstract int getItemLayoutID(int viewType);


    @Override
    public int getItemCount() {
        return mBeans.size();
    }

    public void add(T bean) {
        mBeans.add(bean);
        notifyDataSetChanged();
    }

    public void addAll(List<T> beans) {
        mBeans.addAll(beans);
        notifyDataSetChanged();
    }

    public void clear() {
        mBeans.clear();
        notifyDataSetChanged();
    }

    /***
     * item的加载动画
     * @param view
     * @param position
     */
    private void runEnterAnimation(View view, int position) {
        if (!mAnimateItems) {
            return;
        }
        if (position > mLastAnimatedPosition) {
            mLastAnimatedPosition = position;
            view.setTranslationY(ViewUtils.getScreenHeight(mContext));
            view.animate()
                    .translationY(50)
                    .setStartDelay(100)
                    .setInterpolator(new DecelerateInterpolator(3.f))
                    .setDuration(300)
                    .start();
        }
    }


    public class SolidCommonViewHolder extends
            RecyclerView.ViewHolder {
        private final SparseArray<View> mViews;
        private View itemView;

        public SolidCommonViewHolder(View itemView) {
            super(itemView);
            this.mViews = new SparseArray<>();
            this.itemView = itemView;
            //添加Item的点击事件
            itemView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    onItemClick(getAdapterPosition());
                }
            });
        }


        public <T extends View> T getView(int viewId) {

            View view = mViews.get(viewId);
            if (view == null) {
                view = itemView.findViewById(viewId);
                mViews.put(viewId, view);
            }
            return (T) view;
        }

        public void setText(int viewId, String text) {
            TextView tv = getView(viewId);
            tv.setText(text);
        }

        /**
         * 加载drawable中的图片
         *
         * @param viewId
         * @param resId
         */
        public void setImage(int viewId, int resId) {
            ImageView iv = getView(viewId);
            iv.setImageResource(resId);
        }

        /**
         * 加载网络上的图片
         *
         * @param viewId
         * @param url
         */
        public void setImageFromInternet(int viewId, String url) {
            ImageView iv = getView(viewId);
            SolidHttpUtils.getInstance().loadImage(url, iv);//这里可根据自己的需要变更
        }
    }

    /**
     * ItemView的单击事件(如果需要，重写此方法就行)
     *
     * @param position
     */
    protected void onItemClick(int position) {

    }
}
```

这里我们用到了泛型，如果还有不知道泛型的同学那就赶快去补补泛型这方面的基本知识吧，在面向对象程序设计中泛型这个点还是很重要的。细心的肯定注意到了这是个抽象类，里面有getItemLayoutID和onBindDataToView两个抽象方法，getItemLayoutID是用来设置itemView的布局文件的，onBindDataToView是用来绑定数据到itemView中的控件中去。分别在**onCreateViewHolder**和**onBindViewHolder**中使用到了。这两个方法里面的代码其实并不复杂，我就不多说了，此外我还添加了add、addAll、clear这三个方法用来对数据进行操作。其中**runEnterAnimation**是用来添加ItemView的进入动画的（动画的具体效果可根据需求或者自己的喜欢调整）

比较重要的还是**SolidCommonViewHolder**这个类，这里是我们减少冗余代码的关键。这里使用到了**SparseArray**来保存View（不要问我为什么，这个是Google推荐使用的，和HashMap有点类似，但是在Android中性能要稍微好一些）。我们知道在我们的ItemView中无非是TextView，ImageView这些控件，所以在这里我提供了setText、setImage、setImageFromInternet这几个方法。如果你有更多的控件在ItemView中，请自行添加相关方法。

我们来看看怎么去使用吧

```java
/**
 * Created by _SOLID
 * Date:2016/4/5
 * Time:11:34
 */
public class BookAdapter extends SolidRVBaseAdapter<BookBean> {

    public BookAdapter(Context context, List<BookBean> beans) {
        super(context, beans);
    }

    @Override
    public int getItemLayoutID(int vieWType) {
        return R.layout.item_book;
    }

    @Override
    protected void onItemClick(int position) {
        Intent intent = new Intent(mContext, BookDetailActivity.class);
        intent.putExtra("url", mBeans.get(position - 1).getUrl());
        mContext.startActivity(intent);
    }

    @Override
    protected void onBindDataToView(SolidCommonViewHolder holder, BookBean bean) {
        holder.setText(R.id.tv_title, bean.getTitle());
        holder.setText(R.id.tv_price, "￥" + bean.getPrice());
        holder.setText(R.id.tv_author, "作者:" + bean.getAuthor() + "");
        holder.setText(R.id.tv_date, "出版日期:" + bean.getPubdate());
        holder.setText(R.id.tv_publisher, "出版社:" + bean.getPublisher());
        holder.setText(R.id.tv_num_rating, bean.getRating().getNumRaters() + "人评分");
        holder.setImageFromInternet(R.id.iv_image, bean.getImage());
    }
}
```

是不是很简单，我们只需去设置一个ItemLayoutID然后绑定数据到控件中去就OK了，再也不用去各种FindViewById了。

到这里可能有的同学肯定会问了，你这个只支持只有一个ViewType的RecyclerView啊，要是我有多个改怎么办呢。其实也不难，请看下面代码：

```java
/**
 * Created by _SOLID
 * Date:2016/4/5
 * Time:17:36
 * <p>
 * 支持多种ItemType的Adapter（适用于RecyclerView）
 */
public abstract class SolidMultiItemTypeRVBaseAdapter1<T> extends SolidRVBaseAdapter<T> {

    public SolidMultiItemTypeRVBaseAdapter1(Context context, List<T> beans) {
        super(context, beans);
    }

    @Override
    public abstract int getItemViewType(int position);
}
```

这个类就是继承于之前写的那个类，在这里我只将RecyclerView.Adapter的getItemViewType这个方法变成了抽象方法。目的是强迫子类根据自己的需求去实现即可,实现类中的onBindDataToView方法根据holder.getItemViewType()去绑定数据即可（这里我没有实际去测试过，就不贴测试代码了）。只要你知道之前那个类中的这个方法，我相信你肯定就会懂了。![](http://upload-images.jianshu.io/upload_images/623504-8f8b053b0926b6f2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
