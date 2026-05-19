---
title: "ThinDownloadManager源码解析"
date: 2016-04-26
tags: ["源码分析"]
category: "Android"
excerpt: "深入分析ThinDownloadManager轻量级下载框架的源码实现，从DownloadRequest、DownloadRequestQueue到DownloadDispatcher的完整流程解析。"
---

关于Android自带的DownloadManager可能大家都知道，使用自带的DownloadManager可以很方便的就实现文件下载。还不知道的也没关系，看看下面的示例代码你就知道怎么去使用了。

```java
DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
//下载请求
DownloadManager.Request down = new DownloadManager.Request(Uri.parse("https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo_top_ca79a146.png"));
//设置允许使用的网络类型
down.setAllowedNetworkTypes(DownloadManager.Request.NETWORK_MOBILE | DownloadManager.Request.NETWORK_WIFI);
//禁止发出通知，既后台下载
down.setNotificationVisibility(DownloadManager.Request.VISIBILITY_HIDDEN);
//下载完成文件存放的位置
down.setDestinationInExternalFilesDir(MainActivity.this, null, "logo.png");
//将下载请求放入队列中,开始下载
manager.enqueue(down);
```

是不是很简单，直接使用系统自带的，几行代码就搞定了一个下载。使用这种方法，默认的会在系统的通知栏告诉用户有个下载的任务正在进行，如果不想让用户知道有任务正在进行你就必须加上

```xml
down.setNotificationVisibility(DownloadManager.Request.VISIBILITY_HIDDEN);
```

但是单单加这个还是不行的，你不信可以运行一次试试，应用会直接Crash掉。我们还需要在清单文件声明下面这个权限：

```xml
<uses-permission android:name="android.permission.DOWNLOAD_WITHOUT_NOTIFICATION" />
```

如果不再在意这些直接使用系统自带的DownloadManager 就足够了，但是很多人不想声明权限，就想让任务在后台运行（ps：不要问我为什么，我什么都不知道），这样就需要自己去实现下载功能了。

该说说ThinDownloadManager了，其实我也是无意中发现这个的，因为我想在我的开源项目[MaterialDesignDemo](https://github.com/burgessjp/MaterialDesignDemo)中实现一个图片下载的功能，但是又不想自己去造轮子，我就想有一个下载功能而已，也不想使用那些很笨重的网络框架，所以就去到处找，最后发现了这个东东，比较轻量级，使用起来也还是比较的方便。因为我自己之前本来也计划自己去撸一个网络相关的框架，但是如果想写一个网络框架涉及的东西太多了，而我现在也还没有达到那个层次，所以就放弃了，平时使用的也就是对一些开源框架的再封装而已。

现在发现了这个，也还是对他的源码比较好奇，所以就决定去研究一下他的源码，看完了之后，我发现这个框架的结构比较简单不算复杂，于是就决定把我怎么去分析ThinDownloadManager这个框架源码的过程记录下来，给那些还不知道怎么去分析源码的同学一点经验。虽然这个库在现在已经有点过时了，但是他的一些思想还是值得我们去学习的。**学习Android一定要学会看源码，不要一遇到问题就一昧的去网上搜，这个怎么实现，那个怎么实现，其实你只要先看看源码，可能问题很容易的就解决了，看源码对自己的提升也是显而易见的，就算以后Android不火了，但是他的很多编程思想是值得借鉴的**
ThinDownloadManager的GitHub地址：[ThinDownloadManager](https://github.com/smanikandan14/ThinDownloadManager)

在分析源码之前我们先来看看ThinDownloadManager怎么去使用吧，如果连怎么使用都不会，分析源码也就是纸上谈兵了

![ThinDownloadManager使用示例](http://upload-images.jianshu.io/upload_images/623504-49339e5afd524ee9.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

ThinDownloadManager的使用也还是比较简单的，和系统自带的差不多，我这里是为了我以后使用的方便所以就做了一次再封装，只需传入下载地址，保存地址，还有下载时的回调就可以了。

1. 根据使用的顺序，我们就先来看看**DownloadRequest**，其实根据单词意思我们都能大概知道这里面是封装的肯定是下载请求的一些参数。
先来看看他的构造方法

```java
public DownloadRequest(Uri uri) {
       if (uri == null) {
           throw new NullPointerException();
       }

       String scheme = uri.getScheme();
       if (scheme == null || (!scheme.equals("http") && !scheme.equals("https"))) {
           throw new IllegalArgumentException("Can only download HTTP/HTTPS URIs: " + uri);
       }
       mCustomHeader = new HashMap<>();
       mDownloadState = DownloadManager.STATUS_PENDING;
       mUri = uri;
   }
```

在构造方法中对传入的uri做了校验，以及一些初始化的操作。
在示例代码中我们在使用**DownloadRequest**的时候，我们用到了setRetryPolicy和setDestinationURI以及setStatusListener，所以现在我们定位到这几个方法的源码中去。
看看setRetryPolicy（关于RetryPolicy 就是重试策略而已，在第一次看的时候，需先走一遍的流程，不需要去在意部分细节）

```java
public DownloadRequest setRetryPolicy(RetryPolicy mRetryPolicy) {
       this.mRetryPolicy = mRetryPolicy;
       return this;
   }
```

这里的实现就是一个简单的赋值操作而已，既然有赋值方法，那么应该就有对应的取值方法，我Ctrl+F找了一下果然有getRetryPolicy这么一个方法。

```java
public RetryPolicy getRetryPolicy() {
       return mRetryPolicy == null ? new DefaultRetryPolicy() : mRetryPolicy;
   }
```

从这里看出如果mRetryPolicy 设置了，我们就返回mRetryPolicy ，如果没有被设置我们就返回默认的。从这里可见在示例代码中的那句`setRetryPolicy(new DefaultRetryPolicy())`是可以不用设置的，因为默认的就是DefaultRetryPolicy。
再来看看setDestinationURI这个方法

```java
public DownloadRequest setDestinationURI(Uri destinationURI) {
      this.mDestinationURI = destinationURI;
      return this;
  }
```

和setRetryPolicy方法一样，就是一个简单的赋值操作而已。
setStatusListener同理，我就不再做多余的解释了。

2. 当**DownloadRequest**配置完成之后，我们就使用到了ThinDownloadManager，也还是先进他的构造方法里面去看看。ThinDownloadManager的构造方法就不只一个了，我们就直接来看看他默认的吧

```java
public ThinDownloadManager() {
      mRequestQueue = new DownloadRequestQueue();
      mRequestQueue.start();
  }
```

在这里他新建了一个下载的请求队列DownloadRequestQueue，然后调用了DownloadRequestQueue的start方法。
再来看看ThinDownloadManager的add方法都干了些什么

```java
public int add(DownloadRequest request) throws IllegalArgumentException {
       if(request == null) {
           throw new IllegalArgumentException("DownloadRequest cannot be null");
       }

       return mRequestQueue.add(request);
   }
```

从源码中可以看到add方法就是把我们的下载请求添加到DownloadRequestQueue这个请求队列中去。

3. 在分析ThinDownloadManager这个类的时候，我们发现DownloadRequestQueue用到的比较多，并且也比较重要，现在我们就定位到DownloadRequestQueue这个类中去。一样我们还是先来看看其构造方法，一般在使用一个类的时候，我们都需要先初始化他，所以先看构造方法也还是有必要的。

```java
/**
 * Default constructor.
 */
 public DownloadRequestQueue() {
	initialize(new Handler(Looper.getMainLooper()));
}
```

在这里他调用了 initialize方法，所以我们就来看看initialize的实现

```java
private void initialize(Handler callbackHandler) {
		int processors = Runtime.getRuntime().availableProcessors();
		mDownloadDispatchers = new DownloadDispatcher[processors];
		mDelivery = new CallBackDelivery(callbackHandler);
	}
```

在这里processors 就是java虚拟机可用的处理器个数，最初的时候我也不知道这是啥，最后去查了一下才知道，所以看源码还是能学到很多东西的，废话不多说，我们继续。从代码中可以看出在initialize中新建了一个processors 大小的DownloadDispatcher数组，以及CallBackDelivery。

在ThinDownloadManager的构造方法中调用了DownloadRequestQueue的start方法，所以这里我们就先来看看start方法

```java
public void start() {
		stop(); // Make sure any currently running dispatchers are stopped.
		// Create download dispatchers (and corresponding threads) up to the pool size.
		for (int i = 0; i < mDownloadDispatchers.length; i++) {
			DownloadDispatcher downloadDispatcher = new DownloadDispatcher(mDownloadQueue, mDelivery);
			mDownloadDispatchers[i] = downloadDispatcher;
			downloadDispatcher.start();
		}
	}
```

stop可以先不用去看他，直接来看for循环里面都干了些什么，可以看到在for循环里就是对mDownloadDispatchers中的每一个DownloadDispatcher 做了一次初始化操作
随后就调用了DownloadDispatcher 的start方法。

4. 上面这么多的代码都涉及到了DownloadDispatcher ，下面我们就来看看DownloadDispatcher 的实现吧。
其构造方法如下：

```java
/** Constructor take the dependency (DownloadRequest queue) that all the Dispatcher needs */
   public DownloadDispatcher(BlockingQueue<DownloadRequest> queue,
                             DownloadRequestQueue.CallBackDelivery delivery) {
       mQueue = queue;
       mDelivery = delivery;
   }
```

在这里就传了一个下载请求的队列和CallBackDelivery（CallBackDelivery是用来进行回调的分发用的，是DownloadRequestQueue的一个内部类，后面自己去看源码就知道了，第一次走流程的时候不需要太在意这个） 进来并给成员变量赋值。在DownloadRequestQueue使用到了downloadDispatcher.start()，所以我就点进start去看看，结果发现怎么进了Thread的start方法了，仔细看了一下DownloadDispatcher 源码，发现原来DownloadDispatcher 继承了Thread，也就是说DownloadDispatcher 其实就是一个线程，所以之前调用了start方法就是让这个线程开始执行，既然继承了Thread那么肯定得有run方法吧，于是我就定位到了run方法:

```java
public void run() {
      Process.setThreadPriority(Process.THREAD_PRIORITY_BACKGROUND);
      mTimer = new Timer();
  	while(true) {
  		try {
              mRequest = mQueue.take();
              mRedirectionCount = 0;
              Log.v(TAG, "Download initiated for " + mRequest.getDownloadId());
              updateDownloadState(DownloadManager.STATUS_STARTED);
              executeDownload(mRequest.getUri().toString());
  		} catch (InterruptedException e) {
              // We may have been interrupted because it was time to quit.
              if (mQuit) {
                  if(mRequest != null) {
                      mRequest.finish();
                      updateDownloadFailed(DownloadManager.ERROR_DOWNLOAD_CANCELLED, "Download cancelled");
                      mTimer.cancel();
                  }
                  return;
              }
              continue;
  		}
  	}
  }
```

可见在run方法中有一个while的无限循环，里面的最主要的事的就是从当前的请求队列中取出一个请求然后调用executeDownload去执行下载。**（PS：因为这个队列是可阻塞的队列，所以当队列里没有任何请求的话，就会阻塞在mQueue.take()，直到队列中有请求的时候，才会继续向下执行，这个是Java并发编程相关的知识点）**

```java
private void executeDownload(String downloadUrl) {
       URL url;
       try {
           url = new URL(downloadUrl);
       } catch (MalformedURLException e) {
           updateDownloadFailed(DownloadManager.ERROR_MALFORMED_URI,"MalformedURLException: URI passed is malformed.");
           return;
       }

       HttpURLConnection conn = null;

       try {
           conn = (HttpURLConnection) url.openConnection();
           conn.setInstanceFollowRedirects(false);
           conn.setConnectTimeout(mRequest.getRetryPolicy().getCurrentTimeout());
           conn.setReadTimeout(mRequest.getRetryPolicy().getCurrentTimeout());

           HashMap<String, String> customHeaders = mRequest.getCustomHeaders();
           if (customHeaders != null) {
           	for (String headerName : customHeaders.keySet()) {
           		conn.addRequestProperty(headerName, customHeaders.get(headerName));
           	}
           }

           // Status Connecting is set here before
           // urlConnection is trying to connect to destination.
       	updateDownloadState(DownloadManager.STATUS_CONNECTING);

           final int responseCode = conn.getResponseCode();

           Log.v(TAG, "Response code obtained for downloaded Id "
               + mRequest.getDownloadId()
               + " : httpResponse Code "
               + responseCode);

           switch (responseCode) {
               case HTTP_PARTIAL:
               case HTTP_OK:
                   shouldAllowRedirects = false;
                   if (readResponseHeaders(conn) == 1) {
                       transferData(conn);
                   } else {
                       updateDownloadFailed(DownloadManager.ERROR_DOWNLOAD_SIZE_UNKNOWN, "Transfer-Encoding not found as well as can't know size of download, giving up");
                   }
                   return;
               case HTTP_MOVED_PERM:
               case HTTP_MOVED_TEMP:
               case HTTP_SEE_OTHER:
               case HTTP_TEMP_REDIRECT:
                   // Take redirect url and call executeDownload recursively until
                   // MAX_REDIRECT is reached.
                   while (mRedirectionCount++ < MAX_REDIRECTS && shouldAllowRedirects) {
                       Log.v(TAG, "Redirect for downloaded Id "+mRequest.getDownloadId());
                       final String location = conn.getHeaderField("Location");
                       executeDownload(location);
                       continue;
                   }

                   if (mRedirectionCount > MAX_REDIRECTS) {
                       updateDownloadFailed(DownloadManager.ERROR_TOO_MANY_REDIRECTS, "Too many redirects, giving up");
                       return;
                   }
                   break;
               case HTTP_REQUESTED_RANGE_NOT_SATISFIABLE:
                   updateDownloadFailed(HTTP_REQUESTED_RANGE_NOT_SATISFIABLE, conn.getResponseMessage());
                   break;
               case HTTP_UNAVAILABLE:
                   updateDownloadFailed(HTTP_UNAVAILABLE, conn.getResponseMessage());
                   break;
               case HTTP_INTERNAL_ERROR:
                   updateDownloadFailed(HTTP_INTERNAL_ERROR, conn.getResponseMessage());
                   break;
               default:
                   updateDownloadFailed(DownloadManager.ERROR_UNHANDLED_HTTP_CODE, "Unhandled HTTP response:" + responseCode +" message:" +conn.getResponseMessage());
                   break;
           }
       } catch(SocketTimeoutException e) {
           e.printStackTrace();
           // Retry.
           attemptRetryOnTimeOutException();
       } catch (ConnectTimeoutException e) {
           e.printStackTrace();
           attemptRetryOnTimeOutException();
       } catch(IOException e) {
           e.printStackTrace();
           updateDownloadFailed(DownloadManager.ERROR_HTTP_DATA_ERROR, "Trouble with low-level sockets");
       } finally {
           if (conn != null) {
               conn.disconnect();
           }
       }
	}
```

学习过Android网络编程的同学肯定对这里面的代码很熟悉了，从代码中可以看到其实ThinDownloadManager的底层就是用HttpURLConnection去实现的，其他的代码其实就是去更新当前下载的状态，还有网络连接超时的重试等等。

到这里整个过程就分析的差不多了，更详细的实现可以去下载[ThinDownloadManager](https://github.com/smanikandan14/ThinDownloadManager)源码自己详看。

通过上面的分析大致流可以总结为：先创建一个下载请求DownloadRequest，随后再新建一个请求队列DownloadRequestQueue和下载器DownloadDispatcher，下载器DownloadDispatcher随即开始执行，然后再将请求加入到下载请求队列中由下载器去从请求队列中取出下载请求，然后下载。

ThinDownloadManager的源码的层次结构还是比较清晰的，所以看起来相对也比较容易，看源码一般都是从我们使用的地方进去，一步一步的跟进，刚开始注重流程，不要太去部分在意细节的实现，流程走通了，然后再来看实现，我相信你会收获的更多，本文主要介绍了看源码的其中一种方法，仅供参考，可以让你看源码的时候多一种思路，希望能给正在阅读的你带来帮助。
