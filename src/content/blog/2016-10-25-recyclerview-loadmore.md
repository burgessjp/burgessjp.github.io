---
title: "分享一种RecyclerView滑动到底部自动加载的实现方案"
date: 2016-10-25
tags: ["Android"]
category: "Android"
excerpt: "介绍RecyclerView滑动到底部自动加载更多的三种实现方案：常规版、进阶版和综合版，结合滚动监听与装饰者模式实现带状态显示的自动加载。"
---

在我们开发app的时候，列表组件总是最常用的。目前**下拉刷新**和**上拉加载**的组件有很多。Github一搜索，大部分的开源项目都只实现了**下拉刷新**而没有**上拉加载**，也有部分项目把**上拉加载**更多实现了，但是这样做其实并不好，因为在app实际的运行中当户滑动到底部就应该自动加载下一页的内容（决大部分app都是这样做的），而不是要让用户手动去上拉才会去加载，这样会严重影响到用户体验，当然，个别特殊情况除外。

今天我要讲的内容可能很多人都知道怎么做，搜一搜也会出现很多相应的内容。我这次分享主要的目的是聊聊实现方案和在其中遇到的一些问题，如果有更好的实现方案，望不吝赐教。

### 1.常规版

我们都知道RecyclerView可以监听滚动事件的Listener：我们只需实现里面对应的事件就可以实现滑动到底部加载更多了
代码实现大概是这样的（这里只考虑了布局管理器是LinearLayoutManager的情况，其他的也类似）：

```java
recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrollStateChanged(RecyclerView recyclerView, int newState) {
                LinearLayoutManager lm = (LinearLayoutManager) recyclerView.getLayoutManager();
                int totalItemCount = recyclerView.getAdapter().getItemCount();
                int lastVisibleItemPosition = lm.findLastVisibleItemPosition();
                int visibleItemCount = recyclerView.getChildCount();

                if (newState == RecyclerView.SCROLL_STATE_IDLE
                        && lastVisibleItemPosition == totalItemCount - 1
                        && visibleItemCount > 0) {
                    //加载更多
                }
            }
        });
```

上面的代码我相信做过自动加载的朋友都很熟悉， 这样做确实能做到自动加载更多，但是如果我们想显示加载的状态（**加载中，加载出错，没有更多了**）怎么办呢？只是用这种方案肯定是不能解决的。

### 2.进阶版

我们也都知道RecyclerView不能像ListView那样直接就有addHeadView和addFooterView之类的方法，要想实现加载状态的显示必须要在Adapter上动手脚才行。洋神对此也有了一种实现[LoadmoreWrapper](https://github.com/hongyangAndroid/baseAdapter/blob/master/baseadapter-recyclerview/src/main/java/com/zhy/adapter/recyclerview/wrapper/LoadmoreWrapper.java)(只是单纯的加载更多，并没有状态的处理)，代码大概是这样的（我只留下了关键部分的代码，想看代码完整实现的请直接点击上面的链接。）：

```java
public class LoadMoreWrapper<T> extends RecyclerView.Adapter<RecyclerView.ViewHolder>
{
    public static final int ITEM_TYPE_LOAD_MORE = Integer.MAX_VALUE - 2;

    private RecyclerView.Adapter mInnerAdapter;
    private View mLoadMoreView;
    private int mLoadMoreLayoutId;

    public LoadMoreWrapper(RecyclerView.Adapter adapter)
    {
        mInnerAdapter = adapter;
    }
    ...
    @Override
    public int getItemViewType(int position)
    {
        if (isShowLoadMore(position))
        {
            return ITEM_TYPE_LOAD_MORE;
        }
        return mInnerAdapter.getItemViewType(position);
    }

    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType)
    {
        if (viewType == ITEM_TYPE_LOAD_MORE)
        {
            ViewHolder holder;
            if (mLoadMoreView != null)
            {
                holder = ViewHolder.createViewHolder(parent.getContext(), mLoadMoreView);
            } else
            {
                holder = ViewHolder.createViewHolder(parent.getContext(), parent, mLoadMoreLayoutId);
            }
            return holder;
        }
        return mInnerAdapter.onCreateViewHolder(parent, viewType);
    }

    @Override
    public void onBindViewHolder(RecyclerView.ViewHolder holder, int position)
    {
        if (isShowLoadMore(position))
        {
            if (mOnLoadMoreListener != null)
            {
                mOnLoadMoreListener.onLoadMoreRequested();
            }
            return;
        }
        mInnerAdapter.onBindViewHolder(holder, position);
    }

    ...

    private OnLoadMoreListener mOnLoadMoreListener;

    public LoadMoreWrapper setOnLoadMoreListener(OnLoadMoreListener loadMoreListener)
    {
        if (loadMoreListener != null)
        {
            mOnLoadMoreListener = loadMoreListener;
        }
        return this;
    }

    ...
}
```

可以看到这里巧妙的用到了装饰者模式，完全与数据展示的逻辑分隔，在相应的方法里做了对应判断。加载更多的调用就在**onBindViewHolder**这个方法中，意思就是当这个View显示出来了，我们就触发加载更多这个方法。

但是这里还是没有实现状态的处理。这确实是一个好的方案这样做还是有点不能满足实际开发中的一些需求。并且这样做还有一个潜在的问题：如果你的请求没有延时，也就是说我们直接add的一批数据，然后直接调用了notifyDataSetChanged()方法，就会出下下面的错误：

```java
java.lang.IllegalStateException: Cannot call this method while RecyclerView is computing a layout or scrolling
```

### 3.综合版

上面两种方式各有各的优点，如果我们能将这两种方式结合在一起，那就好了。第一种方式服务加载更多，第二种方式负责状态的显示。下面来看看代码的实现（有省略）：

```java
public class LoadMoreWrapper extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    public static final int ITEM_TYPE_LOAD_FAILED_VIEW = Integer.MAX_VALUE - 1;
    public static final int ITEM_TYPE_NO_MORE_VIEW = Integer.MAX_VALUE - 2;
    public static final int ITEM_TYPE_LOAD_MORE_VIEW = Integer.MAX_VALUE - 3;
    public static final int ITEM_TYPE_NO_VIEW = Integer.MAX_VALUE - 4;//不展示footer view

    private Context mContext;
    private RecyclerView.Adapter mInnerAdapter;

    private View mLoadMoreView;
    private View mLoadMoreFailedView;
    private View mNoMoreView;

    private int mCurrentItemType = ITEM_TYPE_LOAD_MORE_VIEW;
    private LoadMoreScrollListener mLoadMoreScrollListener;


    private boolean isLoadError = false;//标记是否加载出错
    private boolean isHaveStatesView = true;

    public LoadMoreWrapper(Context context, RecyclerView.Adapter adapter) {
        this.mContext = context;
        this.mInnerAdapter = adapter;
        mLoadMoreScrollListener = new LoadMoreScrollListener() {
            @Override
            public void loadMore() {
                if (mOnLoadListener != null && isHaveStatesView) {
                    if (!isLoadError) {
                        showLoadMore();
                        mOnLoadListener.onLoadMore();
                    }
                }
            }
        };
    }

    public void showLoadMore() {
        mCurrentItemType = ITEM_TYPE_LOAD_MORE_VIEW;
        isLoadError = false;
        isHaveStatesView = true;
        notifyItemChanged(getItemCount());
    }

    public void showLoadError() {
        mCurrentItemType = ITEM_TYPE_LOAD_FAILED_VIEW;
        isLoadError = true;
        isHaveStatesView = true;
        notifyItemChanged(getItemCount());
    }

    public void showLoadComplete() {
        mCurrentItemType = ITEM_TYPE_NO_MORE_VIEW;
        isLoadError = false;
        isHaveStatesView = true;
        notifyItemChanged(getItemCount());
    }

    public void disableLoadMore() {
        mCurrentItemType = ITEM_TYPE_NO_VIEW;
        isHaveStatesView = false;
        notifyDataSetChanged();
    }

    //region Get ViewHolder
    private ViewHolder getLoadMoreViewHolder() {
        if (mLoadMoreView == null) {
            mLoadMoreView = new TextView(mContext);
            mLoadMoreView.setLayoutParams(new ViewGroup.LayoutParams(MATCH_PARENT, WRAP_CONTENT));
            mLoadMoreView.setPadding(20, 20, 20, 20);
            ((TextView) mLoadMoreView).setText("正在加载中");
            ((TextView) mLoadMoreView).setGravity(Gravity.CENTER);
        }
        return ViewHolder.createViewHolder(mContext, mLoadMoreView);
    }

    private ViewHolder getLoadFailedViewHolder() {
        if (mLoadMoreFailedView == null) {
            mLoadMoreFailedView = new TextView(mContext);
            mLoadMoreFailedView.setPadding(20, 20, 20, 20);
            mLoadMoreFailedView.setLayoutParams(new ViewGroup.LayoutParams(MATCH_PARENT, WRAP_CONTENT));
            ((TextView) mLoadMoreFailedView).setText("加载失败，请点我重试");
            ((TextView) mLoadMoreFailedView).setGravity(Gravity.CENTER);
        }
        return ViewHolder.createViewHolder(mContext, mLoadMoreFailedView);
    }

    private ViewHolder getNoMoreViewHolder() {
        if (mNoMoreView == null) {
            mNoMoreView = new TextView(mContext);
            mNoMoreView.setPadding(20, 20, 20, 20);
            mNoMoreView.setLayoutParams(new ViewGroup.LayoutParams(MATCH_PARENT, WRAP_CONTENT));
            ((TextView) mNoMoreView).setText("--end--");
            ((TextView) mNoMoreView).setGravity(Gravity.CENTER);
        }
        return ViewHolder.createViewHolder(mContext, mNoMoreView);
    }
    //endregion

    @Override
    public int getItemViewType(int position) {
        if (position == getItemCount() - 1 && isHaveStatesView) {
            return mCurrentItemType;
        }
        return mInnerAdapter.getItemViewType(position);
    }

    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        if (viewType == ITEM_TYPE_NO_MORE_VIEW) {
            return getNoMoreViewHolder();
        } else if (viewType == ITEM_TYPE_LOAD_MORE_VIEW) {
            return getLoadMoreViewHolder();
        } else if (viewType == ITEM_TYPE_LOAD_FAILED_VIEW) {
            return getLoadFailedViewHolder();
        }
        return mInnerAdapter.onCreateViewHolder(parent, viewType);
    }

    @Override
    public void onBindViewHolder(RecyclerView.ViewHolder holder, int position) {
        if (holder.getItemViewType() == ITEM_TYPE_LOAD_FAILED_VIEW) {
            mLoadMoreFailedView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    if (mOnLoadListener != null) {
                        mOnLoadListener.onRetry();
                        showLoadMore();
                    }
                }
            });
            return;
        }
        mInnerAdapter.onBindViewHolder(holder, position);
    }

    @Override
    public void onAttachedToRecyclerView(RecyclerView recyclerView) {
         ...
         recyclerView.addOnScrollListener(mLoadMoreScrollListener);
    }
   ...

    @Override
    public int getItemCount() {
        return mInnerAdapter.getItemCount() + (isHaveStatesView ? 1 : 0);
    }

    ...
}
```

代码的实现也还是很简单，定义了四种itemType，分别对应**加载失败**、**没有更多了**、**加载中**、**不显示**四种状态，同时也实现了错误重试的处理。在**onAttachedToRecyclerView**回调中去添加LoadMoreScrollListener。
完整版代码地址:[LoadMoreWrapper](https://github.com/burgessjp/QuickDevLib/blob/master/library/src/main/java/me/solidev/library/ui/adapter/wrapper/LoadMoreWrapper.java)

说了这么多，怎么用？

```java
//把你用的adapter传进去
LoadMoreWrapper mLoadMoreWrapper=new LoadMoreWrapper (mAdapter);
mLoadMoreWrapper.setOnLoadListener(new LoadMoreWrapper.OnLoadListener() {
            @Override
            public void onRetry() {
              //重试处理
            }

            @Override
            public void onLoadMore() {
               //加载更多
            }
        });
mRecyclerView.setAdapter(mLoadMoreWrapper);
```

在刷新数据的时候调用一下showLoadMore()，数据加载出错的时候调用一下showLoadError()，数据加载完成的时候调用showLoadComplete()。

想看Demo的请看这里:[AbsListFragment](https://github.com/burgessjp/QuickDevLib/blob/master/library/src/main/java/me/solidev/library/ui/fragment/AbsListFragment.java)，这是我封装了一个通用的列表展示Fragment。

Over.
