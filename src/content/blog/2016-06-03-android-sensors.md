---
title: "Android 关于传感器你需要知道的"
date: 2016-06-03
tags: ["Android"]
category: "Android"
excerpt: "介绍Android平台传感器的类型、使用方法，并实现一个基于加速度传感器的摇一摇随机查看图片功能。"
---

最近在搞一个自己的App，突发一个想法，给App加一个摇一摇随机查看图片的功能，这样可以使得用户在使用App的时候有更多的乐趣。实现摇一摇肯定少不了传感器，在使用之余，索性总结一下在Android中关于传感器的使用。

> 本文目录：
> 1.什么是传感器
> 2.常用传感器介绍与用法
> 3.实现图片摇一摇

## 1.什么是传感器

维基百科是这样定义的：*传感器是一种物理装置或生物器官，能够探测、感受外界的信号、物理条件（如光、热、湿度）或化学组成（如烟雾），并将探知的信息传递给其他装置或器官。*

在Android中传感器可以展示当前手机状态的应用，包括硬件信息、当前位置、加速计、陀螺仪、光感、磁场、定向、电池窗态，声压，同时还可以进行多点触控的测试。只要你的想象力足够丰富，完全可以利用这些信息做出一些很新奇得应用。

## 2.常用传感器介绍与用法

Android平台支持三个大类的传感器

- Motion sensors（运动传感器）
 这些传感器测量加速力，并沿三个轴的旋转力。此类别包括加速度计，重力感应器， 陀螺仪和旋转矢量传感器。
- Environmental sensors （环境传感器）
这些传感器测量各种环境参数，例如环境空气温度和压力，照明和湿度。此类别包括气压计，光度计，和温度计。
- Position sensors （位置传感器）
这些传感器测量设备的物理位置。这个类别包括方向传感器和磁力计。

好。下面来看看Android中怎么去使用传感器。

第一步：得到SensorManager

```java
SensorManager mSensorManager = (SensorManager) mContext
                .getSystemService(Context.SENSOR_SERVICE);
```

第二步:注册传感器

```java
Sensor sensor = mSensorManager
               .getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
       if (null != sensor)
           mSensorManager.registerListener(this, sensor,
                   SensorManager.SENSOR_DELAY_NORMAL);
```

嗯。然后就可以监听传感器数据的变化了。

我相信第一步大家都能看懂，这里主要说一下第二步。

registerListener这个方法有三个参数。

- 第一个参数是传感器数据变化的监听器
我们需要去实现SensorEventListener接口，他里面有两个回调方法

```java
@Override
   public void onSensorChanged(SensorEvent event) {
    //当传感器的数值发生变化时调用
   }

   @Override
   public void onAccuracyChanged(Sensor sensor, int accuracy) {
    //传感器的精度发生变化时调用
   }
```

- 第二个参数是我们需要监听的传感器
我们得到传感器用的是下面这种方法：

```java
Sensor sensor = mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
```

TYPE_ACCELEROMETER代表的就是加速度传感器。Android定义了很多的常量来代表支持的传感器，我们来看看Android平台支持的传感器类型。

- 加速度传感器：TYPE_ACCELEROMETER
 以m/s2测量它设备所有三个物理轴线方向（x,y,和z）加速度。
- 周围温度传感器：TYPE_AMBIENT_TEMPERATURE
检测周围空气温度。
- 重力传感器：TYPE_GRAVITY
  测量重力
- 陀螺仪传感器：TYPE_GYROSCOPE
 以rad/s测量设备三个物理轴线方向（x,y,和z)。旋转速度。
- 光照传感器：TYPE_LIGHT
  以lx测量周围的光线级别。
- 线性加速度传感器：TYPE_LINEAR_ACCELERATION
检测沿着一个轴向的加速度。
- 磁力传感器：TYPE_MAGNETIC_FIELD
 测量周围的三个物理轴线方向的磁场。
- 方向传感器： TYPE_ORIENTATION
 测量设备所有三个物理轴线方向（x,y和x）的旋转角度。
- 压力传感器：TYPE_PRESSURE
 测量周围空气气压
- 接近传感器：TYPE_PROXIMITY
检测物体与手机的距离
- 相对湿度传感器：TYPE_RELATIVE_HUMIDITY
 检测周围空气相对湿度
- 旋转矢量传感器：TYPE_ROTATION_VECTOR
 用于检测运动和检测旋转。
- 温度传感器： TYPE_TEMPERATURE
 检测设备的温度

下面再来看看传感器的平台的可用性

![来源于官网](http://upload-images.jianshu.io/upload_images/623504-11cb13cb313621ef.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

注意到图中Yes右上角有个上标：1这个类型的传感器在Android1.5（API Level 3）被添加，但是直到Android2.3（API Level 9）也不可用。 2这个传感器是可用的，但是它被弃用。

- 第三个参数是传感器数据更新数据的速度
有以下四个值可选，他们的速度是递增的
  - SENSOR_DELAY_UI
  - SENSOR_DELAY_NORMAL
  - SENSOR_DELAY_GAME
  - SENSOR_DELAY_FASTEST

传感器的基本使用和介绍截差不多就这些，下面来看看，怎么去实现一个图片摇一摇的功能。

## 3.实现图片摇一摇

要实现摇一摇，主要就是去监听手机加速度的变化，当达到一个值的时候就出发摇一摇这个事件。

说到这，你肯定就知道我们要用的就是**加速度传感器**去实现这个功能。

先来看看效果图：

![摇一摇效果图](http://upload-images.jianshu.io/upload_images/623504-8e6bcf68406ee6e8.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

废话不多说了，下面直接上代码，经过前面的知识储备，我相信你肯定能看懂的

```java
/**
 * Created by _SOLID
 * Date:2016/6/3
 * Time:9:55
 */
public class ShakePictureUtils implements SensorEventListener {

    // 两次检测的时间间隔
    private static final int UPTATE_INTERVAL_TIME = 100;
    // 加速度变化阈值，当摇晃速度达到这值后产生作用
    private static final int SPEED_THRESHOLD = 2000;

    private Context mContext;
    private SensorManager mSensorManager = null;
    private Vibrator mVibrator = null;
    private PictureDialog mPictureDialog = null;


    public ShakePictureUtils(Context context) {
        mContext = context;
        mSensorManager = (SensorManager) mContext
                .getSystemService(Context.SENSOR_SERVICE);
        mVibrator = (Vibrator) mContext.getSystemService(Context.VIBRATOR_SERVICE);
        mPictureDialog = new PictureDialog(mContext, R.style.PictureDialog);
        mPictureDialog.setOnDismissListener(new DialogInterface.OnDismissListener() {
            @Override
            public void onDismiss(DialogInterface dialog) {
                registerSensor();
            }
        });
    }


    private long lastUpdateTime;
    private float lastX;
    private float lastY;
    private float lastZ;

    @Override
    public void onSensorChanged(SensorEvent event) {
        long currentUpdateTime = System.currentTimeMillis();

        long timeInterval = currentUpdateTime - lastUpdateTime;

        if (timeInterval < UPTATE_INTERVAL_TIME) {
            return;
        }

        lastUpdateTime = currentUpdateTime;
        float[] values = event.values;

        // 获得x,y,z加速度
        float x = values[0];
        float y = values[1];
        float z = values[2];

        // 获得x,y,z加速度的变化值
        float deltaX = x - lastX;
        float deltaY = y - lastY;
        float deltaZ = z - lastZ;

        // 将现在的坐标变成last坐标
        lastX = x;
        lastY = y;
        lastZ = z;


        Logger.i("values[0] = " + values[0]);
        Logger.i("values[1] = " + values[1]);
        Logger.i("values[2] = " + values[2]);

        double speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ
                * deltaZ)
                / timeInterval * 10000;
        Logger.i("speed:" + speed);
        if (speed > SPEED_THRESHOLD) {
            //在这里可以提供一个回调
            mVibrator.vibrate(300);
            requestPicture();
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {

    }

    public void registerSensor() {
        Sensor sensor = mSensorManager
                .getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
        if (null != sensor)
            mSensorManager.registerListener(this, sensor,
                    SensorManager.SENSOR_DELAY_NORMAL);
    }

    public void unRegisterSensor() {

        lastX = 0;
        lastY = 0;
        lastZ = 0;
        mSensorManager.unregisterListener(this);
    }


    private void requestPicture() {
        HttpClientManager.getData(Apis.Urls.RandomPicture, new JsonHttpCallBack<RandomPictureBean>() {
            @Override
            public void onStart() {
                unRegisterSensor();
                ToastUtils.getInstance().showToast("图片获取中...");
            }

            @Override
            public void onSuccess(RandomPictureBean result) {
                mPictureDialog.setPicture(result.getP_ori());
            }

            @Override
            public void onError(Exception e) {
                registerSensor();
            }
        });
    }
}
```

我是将摇一摇这个功能做了一下封装，方便以后的使用。代码的实现思想就是去判断三个坐标轴加速度的变化值，当其达到一个阈值的时候则触发摇一摇。
最后来看看在Activity中怎么去使用

1. 在onCreate方法中去初始化摇一摇

```java
ShakePictureUtils mShakePictureUtils = new ShakePictureUtils(this);
```

2. 在onResume方法中去注册

```java
@Override
protected void onResume() {
    super.onResume();
    mShakePictureUtils.registerSensor();
}
```

3. 在onPause方法中去解注册

```java
@Override
protected void onPause() {
    super.onPause();
    mShakePictureUtils.unRegisterSensor();
}
```

源码地址：[ShakePictureUtils](https://github.com/burgessjp/GanHuoIO/blob/master/app/src/main/java/ren/solid/ganhuoio/utils/ShakePictureUtils.java)

也请大家也关注下我的一个开源项目[GanHuoIO](https://github.com/burgessjp/GanHuoIO)。这是基于gank.io提供的api写的一个Android客户端，谢谢。
