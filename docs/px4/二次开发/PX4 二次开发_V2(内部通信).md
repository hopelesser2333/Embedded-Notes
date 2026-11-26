# 伴飞无人机项目_v2

## PX4项目常用终端命令

```shell
# 列出构建项目
make list_config_targets
# 清理构建项目
make distclean
# 清理构建环境
make clean
# 编译
make <$target>
# 烧录
make <$target> upload
# 进入配置系统
make <$target> boardconfig
```





## PX4系统开发基本组件

### 实时多任务

##### 任务 task

1. 任务创建

   > ```cpp
   > #include <px4_platform_commom/tasks.h>
   > 
   > int px4_task_spawn_cmd(const char *name, 
   >                     int scheduler,
   >                     int priority,
   >                     int stack_size, 
   >                     main_t entry,
   >                     char *const argv[])
   > ```
   >
   > 1. 任务名称字符串
   >
   > 2. 任务优先级相同时的任务调度策略。
   >
   >    1. `SCHED_FIFO`:先入先出
   >    2. `SCHED_RR`:时间片轮转的调度
   >
   >    只能上面二选一。一般使用`SCHED_DEFAULT`(`SCHED_RR`)。
   >
   > 3. 任务优先级:数值越高，优先级越高。（这一点与linux和RTOS不同）
   >
   >    系统定义了一些默认的优先级：
   >
   >    1. `SCHED_PRIORITY_MAX`:
   >    2. `SCHED_PRIORITY_DEFAULT`:
   >    3. `SCHED_PRIORITY_MIN`:
   >
   > 4. 任务堆栈的大小
   >
   >    一般在刚开始时会给出较大的任务堆栈大小，在调试过程中通过`top`命令任务堆栈的使用情况，并根据显示结果调整堆栈大小。堆栈一般应该超过使用过程最大值的10%~15%。（仿真郭建不支持top）
   >
   > 5. 任务运行函数的入口地址
   >
   > 6. 传递给运行函数的参数数组

2. 任务延时

   > ```c++
   > #include <px4_platform_commom/time.h>
   > //以微妙进行延时
   > int px4_usleep(useconds_t usec);
   > //以秒进行延时
   > unsigned int px4_sleep(unsigned int seconds);
   > ```
   >
   > ```c++
   > hrt_abstime now = hrt_absolute_time();// 获取当前时间
   > 
   > hrt_abstime time_count = hrt_elapsed_time(&now);// 计算从上次获取时间到现在的时间间隔
   > px4_usleep(1_s - time_count);// 休眠一秒减去已经消耗的时间，确保每次循环间隔为一秒
   > ```
   >
   > 延时函数有一种特殊的使用方法，即以参数0调用，这种方式主要使再非SCHED_RR调度策略情况下，给相同优先级的任务一次运行的机会。

3. 任务管理函数

   > ```c++
   > int px4_task_delete_exit(px4_task_t pid)
   > ```
   >
   > 删除任务，任务堆栈占有空间将被释放
   >
   > tip：该函数必须谨慎使用，如果被删除的任务拥有资源（如分配的内存）则可能导致这些资源无法使用

4. 任务退出

   > ```c++
   > void px4_tasks_exit(int ret)
   > ```
   >
   > 任务退出函数，其任务堆栈将被释放，文件描述符将被关闭，文件流被刷新。一般无需显式调用该函数，任务执行完毕后隐式调用该函数。

5. 显示任务信息

   > ```c++
   > void px4_show_tasks()
   > ```
   >
   > 显示系统正在运行的任务信息，一般用于开发调试。更常用的做法是使用top，但是top命令不能用于仿真目标

6. 判断任务是否正在执行

   > ```c++
   > bool char *px4_task_is_running(const char *taskname)
   > ```
   >
   > 1. 任务的名称（不是句柄）

7. 获取当前任务名

   ```c++
   const char * px4_get_taskname()
   ```



### 任务同步和互斥

共享资源：多个任务或者中断都能访问的资源

临界区：包括共享资源的代码段

任务互斥：临界区必须保证每次只能由一个任务或线程访问

#### 信号量 sem

```c
#include <px4_platform_common/sem.h>
```



1. 信号量初始化

   > ```c
   > int px4_sem_init(FAR sem_t *sem, int pshared, unsigned int value)
   > ```
   >
   > - 待初始化的信号量
   > - 未被使用
   > - 表示信号量的初始值

2. 申请（获取）信号量

   > 如果信号量的值大于0，则信号量获取成果；其值减一，任务继续执行并占有此信号量。
   >
   > 如果信号量的等于0，则调用的任务会被阻塞，指导信号量被其他任务（或线程或终端）释放
   >
   > ```c
   > int px4_sem_wait(FAR sem_t *sem)
   > ```
   >
   > - 指向信号量的指针

3. 延时申请（获取）信号量

   > 在上一个函数的基础上加入了延时等待退出的功能。
   >
   > ```c
   > int px4_sem_timedwait(FAR sem_t *sem，const struct timespec *abstime)
   > ```

4. 尝试获取信号量

   > 如果能获得信号量就获取，并且返回值为0；如果不能获取到信号量就直接返回，并且返回值为-1.该函数不会导致任务阻塞
   >
   > ```c
   > int px4_sem_trywait(px4_sem_t *s)
   > ```

5. 释放信号量

   > 调用后信号量的值加1
   >
   > ```c
   > int px4_sem_post(px4_sem_t *s)
   > ```

6. 把信号量的值赋给 ``*sval`

   > ```c
   > int px4_sem_getvalue(px4_sem_t *s,int *sval)
   > ```

7. 销毁信号量

   > ```c
   > int px4_sem_destory(px4_sem_t *s)
   > ```
   >
   > 

未完待续





## PX4任务间通信

uORB：负责在不同模块（应用程序）之间传递数据。

PX4系统软件架构的核心思想是模块解耦，各个任务间需要复杂的数据交互关系，而任务模块相互独立的基础就是任务间的异步通信。

`uORB`是以异步通信原理实现的，它提供了一套多对多的官博



















