---
title: "Android 多媒体之Camera"
date: 2016-03-28
tags: ["Android"]
category: "Android"
excerpt: "介绍Android中Camera类的使用方法，包括拍照预览、切换摄像头、保存照片等功能，基于自定义CameraSurfaceView实现。"
---

Camera顾名思义，就是照相机、摄像机的意思。在Android中使用这个类可以做拍照和录像的功能。但是在Android5.0中这个类已经不推荐使用了，5.0之后使用更强大的Camera2替换他。在这篇文章中我们使用的是Camera，虽然已经不推荐使用了，但是原理都差不多，Camera会用了，相信Camera2肯定也不会太难。本文主要介绍Camera的简单使用以及使用过程中一些常见的问题，绝对的干货，也主要是针对刚学这一块的同学。

Android中关于相机的实现，是基于SurfaceView的，如果还有不知道SurfaceView的请查看这篇文章[Android中SurfaceView的使用详解](http://blog.csdn.net/listening_music/article/details/6860786),不知道SurfaceView的务必要看一下那篇文章。
我相信初学者都不喜欢看太过的理论知识，如果有一个小Demo再配几幅图是再好不过了，所以本文就是基于一个小Demo进行讲解的。

还是先来看一下最后的效果是怎么样的。
![CameraDemo](http://upload-images.jianshu.io/upload_images/623504-80774fdc5022c683.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

从这幅图中可以看到在右上角有一个切换摄像头的按钮，在左下角有一个图片框，这里主要是用来展示拍照之后得到的图片，并且点击这个按钮会进入自定义的图库可进行照片的选择，界面如下图
![CameraDemo](http://upload-images.jianshu.io/upload_images/623504-35d97e8ba924b16c.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

中间即是拍照的按钮了，右下角是进入到录像的界面（PS：本文没去讲解录像功能和图库选择的实现，但是在文章最后给出的源码中有实现，感兴趣的小伙伴可以去下载，如果发现有问题欢迎提出）
好了，到现在基本上就只知道下面要干什么了，我们正式开始吧！

我们来看看这个主界面的布局文件：

```xml
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/FrameLayout1"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <RelativeLayout
        android:layout_width="match_parent"
        android:layout_height="50dp"
        android:background="#282828"
        android:paddingRight="20dp">

        <ImageView
            android:layout_width="35dp"
            android:layout_height="35dp"
            android:layout_alignParentRight="true"
            android:layout_centerVertical="true"
            android:onClick="changeCameraFacing"
            android:src="@drawable/icon_camear_change" />
    </RelativeLayout>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="0dp"
        android:layout_weight="1"
        android:orientation="vertical">

        <ren.solid.camerademo.view.CameraSurfaceView
            android:id="@+id/cameraSurfaceView"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

    </LinearLayout>

    <RelativeLayout
        android:id="@+id/rl_bottom"
        android:layout_width="match_parent"
        android:layout_height="80dp"
        android:background="#282828"
        android:padding="10dp">
        <!-- 拍照按钮 -->
        <ImageView
            android:id="@+id/takepicture"
            android:layout_width="50dp"
            android:layout_height="50dp"
            android:layout_centerInParent="true"
            android:onClick="btnOnclick"
            android:src="@drawable/icon_take_photo" />

        <ImageView
            android:id="@+id/iv_photo"
            android:layout_width="45dp"
            android:layout_height="45dp"
            android:layout_alignParentLeft="true"
            android:layout_centerVertical="true"
            android:background="@drawable/bg_photo_done"
            android:onClick="openPhotoAlbum" />

        <ImageView
            android:id="@+id/iv_switch"
            android:layout_width="50dp"
            android:layout_height="50dp"
            android:layout_alignParentRight="true"
            android:layout_centerVertical="true"
            android:onClick="ivSwitchClick"
            android:background="@drawable/icon_pushmsg_video" />
    </RelativeLayout>

</LinearLayout>
```

细心小伙伴肯定注意到这几行代码了

```xml
<ren.solid.camerademo.view.CameraSurfaceView
    android:id="@+id/cameraSurfaceView"
    android:layout_width="match_parent"
    android:layout_height="match_parent" />
```

从代码中我们可以看到我们是使用的一个自定义的CameraSurfaceView，现在我们就来看看这个CameraSurfaceView是怎么实现的（PS：其实本文的核心东西就是这个自定义SurfaceView）。
看下面红框里面的内容，可以看出CameraSurfaceView是继承于SurfaceView实现的，说白了CameraSurfaceView就是对SurfaceView与Camera的封装。

![](http://upload-images.jianshu.io/upload_images/623504-903591077f6c0177.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这里实现了SurfaceView类的三个构造方法，并且前两个构造方法最后都指向有三个参数的，这样写的好处就是不用在三个构造方法中都去写一次init()方法（已经知道的无视这句）。下载我们再来看看init()方法中都做了些什么

![](http://upload-images.jianshu.io/upload_images/623504-d2b2a0567b239026.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

第一句就是得到摄像头的数量，可以用这个去判断是否有前置摄像头。getCamera()是打开系统摄像头实现如下图

![](http://upload-images.jianshu.io/upload_images/623504-8f5cc7e4400a5f82.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这里面最核心的就是**mSurfaceHolder.addCallback(new SurfaceCallback())**这一句。为SurfaceHolder添加一个回调。各种功能的切换就是在这个回调里面实现的，下面我们来看看SurfaceCallback这个类的实现
![](http://upload-images.jianshu.io/upload_images/623504-237da7bbc43425b5.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这个类中重写了三个方法
**1.surfaceChanged**：拍照状态改变时调用，也就是你的手机竖屏和横屏相互切换时会调用这个方法，我试过当手机横屏的时候拍照，效果十分不好（拉伸十分严重），用了很多方法也没解决这个问题，我也看了下我系统自带的相机，也没有在横屏下拍照的功能，所以我还是建议最好把拍照界面固定为竖屏，在竖屏状态下拍照。
**2.surfaceCreated**：就是当surface被创建的时候调用。在这里我们就在surface被创建的时候就开始拍照的预览。我们再来看看startPreview方法是怎么实现的。

![](http://upload-images.jianshu.io/upload_images/623504-3439c39a89d18fc1.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

从图中可以看到我们调用了camera的三个api，至于作用，注释写的很清楚了，这里我就不再重复了。
**3.surfaceDestroyed：**这里主要是在surface被销毁的时候做一些回收的工作。熟悉SurfaceView的同学肯定知道，当SurfaceView界面不可见时这个方法就会被调用。因为SurfaceView是很占CPU的。

最后我们再来看看是怎么拍照的吧
![](http://upload-images.jianshu.io/upload_images/623504-4f8f85ffb4e9647a.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
从图中我们可以看到这里提供了一个takePictue方法，在里面调用了camera的带有三个参数的takePicture方法，其中第一个参数是按下快门的回调，第二个参数是原始图片的回调，第三个参数是经压缩处理后比较小的jpeg图片的回调。

下面再来看看MyCameraPictureCallback的实现吧
![](http://upload-images.jianshu.io/upload_images/623504-e615de2a30b11a17.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

其实这里简单，就是把拍照得到的照片保存到sd卡中去。
**这里需要知道一点：当每次拍完照之后，相机都会自动释放资源，所以这里需要重新开启预览**

对了我们再来看看切换摄像头是怎么实现的吧
![](http://upload-images.jianshu.io/upload_images/623504-e6b677fee50e17c3.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
到这里这个自定义的SurfaceView就差不多了。详细代码见最后。

最后我们再来看看这个类怎么使用吧
![](http://upload-images.jianshu.io/upload_images/623504-93fd9d34c387f7b0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
还是很简单吧，我们只需几句话就能搞定拍照了。以后哪里有需要的地方直接拿过去用就OK了！
这里一定要记得与Activity的生命周期同步，不然可以在界面切换的时候出现现一些错误。
![](http://upload-images.jianshu.io/upload_images/623504-7f3c6f2190f7606b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

附详细代码：

```java
/**
 * Created by _SOLID
 * Date:2016/3/23
 * Time:9:43
 * <p>
 * <uses-permission android:name="android.permission.CAMERA">
 * <uses-permission android:name="android.permission.MOUNT_UNMOUNT_FILESYSTEMS">
 * <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE">
 * <p>
 * 注：应用程序同时只能存在一个激活的 camera
 * </p><p>
 * 关于图片拉伸变形的问题，要把SurfaceView的宽高比例和图片的预览尺寸的宽高比例设置相同
 */
public class CameraSurfaceView extends SurfaceView {

    private static String TAG = "CameraSurfaceViewTAG";
    private SurfaceHolder mSurfaceHolder;
    private Camera camera;
    private Camera.Parameters parameters = null;
    private Context mContext;
    private int mCameraCount;
    private int mCurrentCameraFacing = Camera.CameraInfo.CAMERA_FACING_BACK;
    private String mPictureSaveDir;
    private String mPictureSavePath;
    private OnSavePictureListener mOnSavePictureListener;

    public CameraSurfaceView(Context context) {
        this(context, null);
    }

    public CameraSurfaceView(Context context, AttributeSet attrs) {
        this(context, attrs, 0);
    }

    public CameraSurfaceView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        mContext = context;
        init();
    }


    private void init() {
        mCameraCount = Camera.getNumberOfCameras();//得到摄像头数量
        mSurfaceHolder = getHolder();
        getCamera();
        mSurfaceHolder.setKeepScreenOn(true);// 屏幕常亮
        mSurfaceHolder.addCallback(new SurfaceCallback());//为SurfaceView的Holder添加一个回调函数

        setOnClickListener(new OnClickListener() {
            @Override
            public void onClick(View v) {
                if (camera != null) {
                    camera.autoFocus(null);
                }
            }
        });

    }

    /***
     * 得到系统相机
     */
    private void getCamera() {
        if (camera == null)
            camera = Camera.open(mCurrentCameraFacing); // 打开后置摄像头
    }


    private final class SurfaceCallback implements SurfaceHolder.Callback {
        // 拍照状态变化时调用该方法
        @Override
        public void surfaceChanged(SurfaceHolder holder, int format, int width,
                                   int height) {
            Log.i(TAG, "surfaceChanged    " + "width:" + width + "|" + "height:" + height);
            if (camera != null) {
                camera.stopPreview();
                startPreview(holder);
                setCameraParameters(width, height);
            }
        }

        @Override
        public void surfaceCreated(SurfaceHolder holder) {
            Log.i(TAG, "surfaceCreated");
            startPreview(holder);
        }

        @Override
        public void surfaceDestroyed(SurfaceHolder holder) {
            Log.i(TAG, "surfaceDestroyed");
            releaseCamera();
        }

    }

    /***
     * 切换相机摄像头
     */
    public void changCameraFacing() {
        if (mCameraCount > 1) {
            mCurrentCameraFacing = (mCurrentCameraFacing == Camera.CameraInfo.CAMERA_FACING_BACK) ?
                    Camera.CameraInfo.CAMERA_FACING_FRONT : Camera.CameraInfo.CAMERA_FACING_BACK;
            releaseCamera();
            startPreview(mSurfaceHolder);
        } else {
            //手机不支持前置摄像头
        }
    }

    /***
     * 设置相机参数
     *
     * @param width
     * @param height
     */
    private void setCameraParameters(int width, int height) {
        mSurfaceHolder.setFixedSize(width, height);//照片的大小
        parameters = camera.getParameters(); // 获取相机参数
        parameters.setPictureFormat(ImageFormat.JPEG); // 设置图片格式

        parameters.setPreviewSize(width, height); // 设置预览大小
        parameters.setPictureSize(width, height); // 设置保存的图片尺寸

        parameters.setPreviewFpsRange(4, 10);//fps
        parameters.setJpegQuality(100); // 设置照片质量
        parameters.setFocusMode(Camera.Parameters.FOCUS_MODE_AUTO);//自动对焦
        //parameters.setFocusMode(Camera.Parameters.FOCUS_MODE_CONTINUOUS_PICTURE);//连续对焦
        //camera.cancelAutoFocus();//如果要实现连续的自动对焦，这一句必须加上
        camera.setParameters(parameters);
    }

    /**
     * 开始预览
     */
    private void startPreview(SurfaceHolder surfaceHolder) {
        getCamera();//防止Camera实例为空
        try {
            camera.setPreviewDisplay(surfaceHolder); // 设置用于显示预览的SurfaceHolder对象
            camera.setDisplayOrientation(getPreviewDegree());//设置预览的旋转角度，这句很关键，不然预览拉伸很严重
            camera.startPreview(); // 开始预览
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 用于根据手机方向获得相机预览画面旋转的角度
     */
    private int getPreviewDegree() {
        // 获得手机的方向
        WindowManager windowManager = (WindowManager) mContext.getSystemService(Context.WINDOW_SERVICE);
        int rotation = windowManager.getDefaultDisplay()
                .getRotation();
        Log.i(TAG, "rotation:" + rotation);
        int degree = 0;
        // 根据手机的方向计算相机预览画面应该选择的角度
        switch (rotation) {
            case Surface.ROTATION_0:
                degree = 90;
                break;
            case Surface.ROTATION_90:
                degree = 0;
                break;
            case Surface.ROTATION_180:
                degree = 270;
                break;
            case Surface.ROTATION_270:
                degree = 180;
                break;
        }
        return degree;
    }

    /**
     * 将拍下来的照片存放在SD卡中
     *
     * @param data
     * @throws IOException
     */
    private void saveToSDCard(byte[] data) throws IOException {
        Date date = new Date();
        SimpleDateFormat format = new SimpleDateFormat("yyyyMMddHHmmss"); // 格式化时间
        String filename = format.format(date) + ".jpg";

        File fileFolder = new File(getPictureSaveDir());

        if (!fileFolder.exists()) { // 如果目录不存在，则创建一个名为"finger"的目录
            fileFolder.mkdir();
        }
        File jpgFile = new File(fileFolder, filename);
        FileOutputStream outputStream = new FileOutputStream(jpgFile); // 文件输出流

        //由于在预览的时候，我们调整了预览的方向，所以在保存的时候我们要旋转回来，不然保存的图片方向是不正确的
        Matrix matrix = new Matrix();
        if (mCurrentCameraFacing == Camera.CameraInfo.CAMERA_FACING_BACK) {
            matrix.setRotate(90);
        } else {
            matrix.setRotate(-90);
        }
        Bitmap bitmap = BitmapFactory.decodeByteArray(data, 0, data.length);
        bitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, false);
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, outputStream);

        outputStream.flush(); // 写入sd卡中
        outputStream.close(); // 关闭输出流
        mPictureSavePath = getPictureSaveDir() + File.separator + filename;
        if (mOnSavePictureListener != null) {
            mOnSavePictureListener.onSuccess(mPictureSavePath);
        }
        Toast.makeText(mContext.getApplicationContext(), "图片已保存至:" + mPictureSavePath,
                Toast.LENGTH_LONG).show();

        MediaScannerConnection.scanFile(mContext, new String[]{
                        mPictureSavePath},
                null, new MediaScannerConnection.OnScanCompletedListener() {
                    public void onScanCompleted(String path, Uri uri) {
                        // Log.e(TAG, "扫描完成");
                    }
                });


    }


    private final class MyCameraPictureCallback implements Camera.PictureCallback {
        @Override
        public void onPictureTaken(byte[] data, Camera camera) {
            try {
                saveToSDCard(data); // 保存图片到sd卡中
                camera.startPreview(); // 拍完照后，重新开始预览
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    /**
     * 拍照
     */
    public void takePicture() {
        if (camera != null) {
            camera.takePicture(null, null, new MyCameraPictureCallback());//每次调用takePicture获取图像后，摄像头会停止预览
        } else {
            //TODO: 提示用户相机不存在
        }
    }

    /***
     * 释放相机资源
     */
    public void releaseCamera() {
        if (camera != null) {
            camera.stopPreview();
            camera.release();
            camera = null;
        }
    }

    /**
     * 设置图片的保存路径
     *
     * @param pictureSavePath
     */
    public void setPictureSavePath(String pictureSavePath) {
        mPictureSaveDir = pictureSavePath;
    }

    /***
     * 得到图片保存的目录
     *
     * @return
     */
    public String getPictureSaveDir() {
        String path;
        if (mPictureSaveDir == null)
            if (Environment.getExternalStorageState().equals(Environment.MEDIA_MOUNTED))
                path = Environment.getExternalStorageDirectory()
                        + "/SolidCamera/";
            else {
                path = mContext.getCacheDir().getAbsolutePath()
                        + "/SolidCamera/";
            }
        else {
            path = mPictureSaveDir;
        }
        mPictureSaveDir = path;
        return path;
    }

    public void onResume() {
        getCamera();
    }

    public void onPause() {
        releaseCamera();
    }

    /***
     * 设置拍照成功后的回调
     * @param onSavePictureListener
     */
    public void setOnSavePictureListener(OnSavePictureListener onSavePictureListener) {
        mOnSavePictureListener = onSavePictureListener;
    }

    public interface OnSavePictureListener {
        void onSuccess(String filePath);
    }
}
```

其实录像和拍照其实差不多，只需添加一个MeadiaRecorder即可，关于录像源码中有。

[源码下载](https://github.com/burgessjp/CameraDemo)

参考链接
- [使用Camera2 替代过时的Camera API](http://www.jcodecraeer.com/a/anzhuokaifa/androidkaifa/2015/0428/2811.html)
- [Android Camera多屏幕适配解决预览照片拉伸](http://www.lai18.com/content/1165371.html)
- [Android Camera 使用小结](http://www.cnblogs.com/franksunny/archive/2011/11/17/2252926.html)
- [Android 相机自动对焦和定点对焦的一些总结](http://www.apkbus.com/android-170300-1-1.html)
- [Android保存图片到图库，Android扫描文件到媒体库，Android保存图片到SD卡](http://blog.csdn.net/yanzhenjie1003/article/details/44937057)
