

# MAVLInk—— XML 结构和自定义

# Guide



### MAVLink xml文件结构

前面学习 MAVLink 时，我们接触过消息（Message）、消息 ID、消息字段（Field）、枚举（Enum）、命令（Command）、Dialect（方言）等概念。但这些概念究竟是如何定义的？MAVLink 又是如何从 XML 文件生成 C/C++ 头文件的？

#### XML Schema

**MAVLink 使用 XML 文件描述协议本身，而 XML Schema 则规定了这些 XML 文件应该遵循什么格式。**

XML Schema 可以理解为：**描述 XML 文件应该如何组织、允许出现哪些元素、标签有哪些属性、属性应该是什么类型的一套规则。**

例如，我们规定一个 MAVLink 消息：

+ 必须具有 `id` 属性。
+ 必须具有 `name` 属性。
+ 必须具有 `<description>` 子元素。
+ 可以具有多个 `<field>` 子元素。
+ 每个 `<field>` 必须具有 `type` 和 `name` 属性。

那么 XML Schema 就可以将这些约束描述出来。

例如，以下 XML：

```xml
<message name="BATTERY_STATUS">
    <field type="uint8_t" name="id"/>
</message>
```

虽然从普通 XML 语法来看没有问题，但它缺少 `id` 属性和 `<description>`，因此不符合 MAVLink 的 XML Schema。

方言文件的格式和结构在XML Schema文档 `mavschema.xsd` 中有明确定义。



#### MAVLink XML

MAVLink XML 文件的总体结构如下所示。

> 如果你正在创建自定义方言文件，其文件结构应类似于以下示例（但可以省略任何或全部部分）。

```xml
<?xml version="1.0"?>
<mavlink>

    <include>common.xml</include>
    <include>other_dialect.xml</include>

    <!-- NOTE: If the included file already contains a version tag, remove the version tag here, else uncomment to enable. -->
    <!-- <version>6</version> -->

    <dialect>8</dialect>

    <enums>
        <!-- Enums are defined here (optional) -->
    </enums>

    <messages>
        <!-- Messages are defined here (optional) -->
    </messages>

</mavlink>
```



**1. XML 声明**

```xml
<?xml version="1.0"?>
```

这是 XML 文件的声明，表示该文件遵循 XML 1.0 规范。

它不是 MAVLink 专属内容，而是 XML 文件本身的标准语法。
	 **2. 根元素 mavlink**

```xml
<mavlink>
    ...
</mavlink>
```

这是整个 MAVLink 方言文件的根节点。

所有 MAVLink 定义都必须位于这个根节点内部。

**3. include：引入其他方言文件**

```xml
<include>common.xml</include>
<include>other_dialect.xml</include>
```

这是一个非常重要的标签。

MAVLink 允许一个 XML 方言文件引入其他 XML 文件中的定义。

例如，一个自定义方言可能这样定义：

```xml
<mavlink>
    <include>common.xml</include>

    <enums>
        ...
    </enums>

    <messages>
        ...
    </messages>
</mavlink>
```

这意味着：

+ 引入 `common.xml` 中已经定义的标准消息和枚举。
+ 在当前文件中继续定义自己的消息和枚举。

因此，自定义方言不需要重复定义标准 MAVLink 消息。

例如，PX4 的 MAVLink 方言可以建立在 `common.xml` 的基础上，再增加 PX4 自己的消息。

**include 的几个特点：**

1. 可以存在多个 `<include>` 标签。
2. 被引入文件的路径可以相对于当前方言文件。
3. 支持嵌套 include，即被引入的文件还可以继续引入其他文件。
4. `mavgen` 最多允许 5 层嵌套。
5. 构建时，生成工具链会合并各个文件中的枚举和消息定义，并报告重复定义。

这里的合并不是简单地把文本拼接起来，而是生成工具读取各文件中的定义，并将它们纳入同一套协议定义中。

需要注意：不同方言之间不能随意重复使用相同的消息 ID 或重复定义枚举项。





**4. version：协议版本**

```
<version>6</version>
```

这个标签定义 MAVLink 的次版本号（minor version）。

它与 `HEARTBEAT` 消息中的 `mavlink_version` 字段有关。

需要特别注意：

如果当前文件引入了 `common.xml`，通常应该删除当前文件自己的 `<version>` 标签，让 `common.xml` 中的版本定义生效。

官方文档说明：如果顶层文件指定了 version，则顶层文件的定义会被使用。

对于私有方言，可以根据自己的需要设置版本号。

这里不要将 `<version>` 与 MAVLink 1、MAVLink 2 混淆。

MAVLink 1 和 MAVLink 2 是协议版本，而这里的 `<version>` 是方言定义中的次版本号。

 **5. dialect：方言编号**

```
<dialect>8</dialect>
```

这个标签用于表示方言编号。

不过官方文档明确指出：

+ 它是可选的。
+ 通常应该省略。
+ `mavgen` 生成工具链不会使用它。

所以在阅读实际 XML 文件时，不必过分关注这个字段。

**6. enums：枚举定义**

```
<enums>
    ...
</enums>
```

用于定义枚举类型。

例如：

```
<enums>
    <enum name="MAV_TYPE">
        ...
    </enum>
</enums>
```

 **7. messages：消息定义**

```
<messages>
    ...
</messages>
```

用于定义 MAVLink 消息。

例如：

```
<messages>
    <message id="0" name="HEARTBEAT">
        ...
    </message>
</messages>
```

这里可以先建立一个整体认识：

| 标签       | 作用                       |
| ---------- | -------------------------- |
| `mavlink`  | 根节点                     |
| `include`  | 引入其他方言               |
| `version`  | 方言次版本号               |
| `dialect`  | 方言编号（生成工具不使用） |
| `enums`    | 枚举集合                   |
| `messages` | 消息集合                   |

以上这些主要标签在官方文档中均标记为可选，也就是说，创建自定义方言时，可以根据实际需求省略不需要的部分。



#### 枚举定义（enum）

枚举定义在 `<enums>` 标签内部。，这些值可作为消息中的选项使用，例如用于定义错误、状态或模式。还有一个特殊的枚举 MAV_CMD，用于定义 MAVLink 命令。

枚举在 <enums> ... </enums> 块中通过 <enum> ... </enum> 标签定义（如前一节所述）。枚举值则使用 <entry> ... </entry> 标签在枚举内部定义。

例如，LANDING_TARGET_TYPE 消息的定义如下：

```xml
<enum name="LANDING_TARGET_TYPE">
    <description>Type of landing target</description>
    <entry value="0" name="LANDING_TARGET_TYPE_LIGHT_BEACON">
        <description>Landing target signaled by light beacon (ex: IR-LOCK)</description>
    </entry>
    <entry value="1" name="LANDING_TARGET_TYPE_RADIO_BEACON">
        <description>Landing target signaled by radio beacon (ex: ILS, NDB)</description>
    </entry>
    <entry value="2" name="LANDING_TARGET_TYPE_VISION_FIDUCIAL">
        <description>Landing target represented by a fiducial marker (ex: ARTag)</description>
    </entry>
    <entry value="3" name="LANDING_TARGET_TYPE_VISION_OTHER">
        <description>Landing target represented by a pre-defined visual shape/feature (ex: X-marker, H-marker, square)</description>
    </entry>
</enum>
```

- 这里涉及三个主要标签：
  + `<enums>`：枚举集合。
  + `<enum>`：一个枚举类型。
  + `<entry>`：枚举中的一个具体取值。

<img src="D:/Typora/Note/MAVLINK/assets/image-20261116205110570.png" alt="image-20261116205110570" style="zoom:67%;" />

1. #####  `<enum>` **标签**

例如：

```
<enum name="MAV_BATTERY_TYPE">
    ...
</enum>
```

它定义了一个枚举类型。

**属性：**

| 属性      | 是否必须 | 含义             |
| --------- | -------- | ---------------- |
| `name`    | 必须     | 枚举名称         |
| `bitmask` | 可选     | 是否为位掩码枚举 |

`name` 必须使用大写字母和下划线组成的形式。

例如：

```
<enum name="MAV_BATTERY_TYPE">
```

2. #####  **bitmask 属性**

这是一个比较重要的概念。

```
<enum name="MAV_MODE_FLAG" bitmask="true">
    ...
</enum>
```

当 `bitmask="true"` 时，表示这个枚举定义的是一组位标志（Bit Flags）。

因此，`bitmask="true"` 不只是一个描述性标签，它明确表达了这个枚举的数值具有位标志语义。



3. #####  `<entry>` **标签**

   `entry` 表示枚举中的一个具体取值。

```xml
<enum name="LANDING_TARGET_TYPE">

    <entry value="0" name="LANDING_TARGET_TYPE_LIGHT_BEACON">
        <description>
            Landing target signaled by light beacon
        </description>
    </entry>

</enum>
```

**属性：**

| 属性    | 是否必须 | 含义             |
| ------- | -------- | ---------------- |
| `name`  | 必须     | 枚举项名称       |
| `value` | 可选     | 枚举项对应的数值 |

这里的 `value` 是数值，而 `name` 是该数值对应的语义名称。

例如：

```
<entry value="2" name="MAV_TYPE_QUADROTOR"/>
```

生成代码后，可以得到类似：

```
MAV_TYPE_QUADROTOR = 2
```

注意：`entry` 的 `value` 在 XML Schema 中是可选的，并不意味着所有枚举值都必须显式写出数值。具体生成规则需要以 MAVLink 生成器实现为准。



4. #####  **Enum 的生命周期元素**

   `enum` 和 `entry` 内部都可以使用生命周期标签：

   + `<wip>`
   + `<superseded>`
   + `<deprecated>`

5. #####  **Enum 在 Message 中的作用**

枚举定义的价值不仅仅是生成 C 语言枚举。

它还可以与消息字段关联。

例如：

```
<field
    type="uint8_t"
    name="battery_function"
    enum="MAV_BATTERY_FUNCTION">
    Function of the battery
</field>
```

这里：

```
enum="MAV_BATTERY_FUNCTION"
```

表示该字段的数值应该按照 `MAV_BATTERY_FUNCTION` 枚举来理解。



#### **MAVLink Commands：命令定义（MAV_CMD）**



在学习 MAVLink 时，我们经常会看到：

```
MAV_CMD_NAV_WAYPOINT
MAV_CMD_COMPONENT_ARM_DISARM
MAV_CMD_DO_SET_MODE
MAV_CMD_REQUEST_MESSAGE
```

这些都属于 MAVLink 命令。

但是需要注意：

**MAVLink Command 并不是一种独立的 MAVLink Message。它是一种通过特定消息承载的命令定义。**



##### **MAVLink 命令与消息的关系**

MAVLink 命令定义在一个特殊的枚举中：

```xml
<enum name="MAV_CMD">
    ...
</enum>
```

每一个命令都是这个枚举中的一个 `<entry>`。

例如：



```xml
<enum name="MAV_CMD">

    <entry
        value="400"
        name="MAV_CMD_COMPONENT_ARM_DISARM"
        hasLocation="false"
        isDestination="false"
        mission="false"
        command="true">

        <description>
            Arms or disarms a component
        </description>

        <param index="1" label="Arm">
            0: Disarm, 1: Arm
        </param>

        <param index="2" label="Force">
            Force arm/disarm
        </param>

    </entry>

</enum>
```

这个定义表达了：

+ 命令名称：`MAV_CMD_COMPONENT_ARM_DISARM`
+ 命令编号：`400`
+ 参数 1：是否解锁。
+ 参数 2：是否强制执行。



##### **MAV_CMD 的 entry 属性**

使用 `MAV_CMD_NAV_PAYLOAD_PLACE` 举例：

```xml
<enum name="MAV_CMD">

    <entry
        value="94"
        name="MAV_CMD_NAV_PAYLOAD_PLACE"
        hasLocation="true"
        isDestination="true"
        mission="true"
        command="true">

        <description>
            Descend and place payload.
        </description>

        <param index="1" label="Max Descent" units="m" minValue="0">
            Maximum distance to descend.
        </param>

        <param index="5" label="Latitude/X">
            Latitude (global frame) or X coordinate (local frame)
        </param>

        <param index="6" label="Longitude/Y">
            Longitude (global frame) or Y coordinate (local frame)
        </param>

        <param index="7" label="Altitude/Z" units="m">
            Altitude (global frame) or Z coordinate (local frame)
        </param>

    </entry>

</enum>
```

 **1. name**

```
name="MAV_CMD_NAV_PAYLOAD_PLACE"
```

命令名称。

命令名称必须采用大写字母和下划线的形式，并且以 `MAV_CMD_` 开头。

 **2. value**

```
value="94"
```

命令编号。

这是命令在 MAVLink 中的数值标识。

例如：

```
#define MAV_CMD_NAV_PAYLOAD_PLACE 94
```

生成代码中的具体表示方式可能因语言和生成器而异，但本质上都是使用该编号识别命令。

 **3. hasLocation**

```
hasLocation="true"
```

默认值为 `false`。

表示该命令的第 5、6、7 号参数包含位置信息：

+ Param 5：纬度或局部坐标 X。
+ Param 6：经度或局部坐标 Y。
+ Param 7：高度或局部坐标 Z。

为什么这里使用纬度/X、经度/Y 这样的描述？

因为参数的实际含义与坐标系有关。

例如：

+ 在全球坐标系中，参数 5、6、7 可以代表纬度、经度、高度。
+ 在局部坐标系中，可以代表 X、Y、Z。

具体解释还需要结合命令使用的 `MAV_FRAME` 坐标系。

 **4. isDestination**

```
isDestination="true"
```

默认值为 `false`。

它表示这个命令是否属于飞行路径中的一个目的地。

例如：

`MAV_CMD_NAV_WAYPOINT` 是一个典型的导航航点命令。

它表示飞行器需要前往某个位置，因此属于目的地。

而 `MAV_CMD_DO_SET_ROI_LOCATION` 虽然也包含一个位置，但它的作用是设置兴趣点（ROI），并不是要求飞行器飞往那里。

所以，是否包含位置与是否属于飞行目的地是两个不同的概念。

官方还规定：

当 `isDestination="true"` 时，应该同时设置 `hasLocation="true"`。

 **5. hasAltitudeOnly**

```
hasAltitudeOnly="true"
```

默认值为 `false`。

表示命令只在第 7 号参数中包含高度信息，而第 5、6 号参数不包含位置。

例如：

`MAV_CMD_NAV_CONTINUE_AND_CHANGE_ALT`。

它表示继续执行任务并改变高度。

注意：

`hasAltitudeOnly` 与 `hasLocation` 互斥，不能同时设置为 `true`。

 **6. mission**

```
mission="true"
```

表示该命令能否用于任务计划（Mission）。

例如：

航点、起飞、降落等命令通常会出现在任务计划中。

 **7. fence**

```
fence="true"
```

表示该命令能否用于地理围栏（Geofence）计划。

地理围栏用于定义飞行器允许或禁止进入的地理区域。

 **8. rally**

```
rally="true"
```

表示该命令能否用于 Rally Point（集结点）计划。

Rally Point 通常用于定义紧急情况下的备选降落位置。

 **9. command**

```
command="true"
```

表示该命令能否通过 Command Protocol 发送。

这里对应前面提到的：

+ `COMMAND_LONG`
+ `COMMAND_INT`

以上四个属性：

```
mission="true"
fence="true"
rally="true"
command="true"
```

可以任意组合，并不是互斥关系。

例如，一个命令可以既能用于任务计划，也能通过命令协议单独发送。

**特别注意：** 这些属性主要用于描述命令的适用场景以及帮助地面站等实现理解命令，并不意味着设置为 `true` 后，飞控就自动实现了相应功能。飞控是否支持并执行该命令，仍然取决于其具体实现。

##### `<param>`**：命令参数定义**

这是命令定义中最值得仔细研究的部分。

一个 MAVLink 命令最多可以包含 7 个参数：

```
param1
param2
param3
param4
param5
param6
param7
```

这些参数最终会被编码到命令消息中。

例如：

```xml
<param index="1" label="Max Descent" units="m" minValue="0">
    Maximum distance to descend.
</param>
```

它描述了一个命令参数。

**属性说明：**

| 属性            | 含义                                       |
| --------------- | ------------------------------------------ |
| `index`         | 参数编号，必须为 1～7                      |
| `label`         | 在地面站等 UI 中显示的参数名称             |
| `units`         | 参数单位                                   |
| `enum`          | 参数可能取值对应的枚举                     |
| `decimalPlaces` | UI 显示时保留的小数位数                    |
| `increment`     | 参数允许的变化步长                         |
| `minValue`      | 参数最小值，包含边界                       |
| `maxValue`      | 参数最大值，包含边界                       |
| `multiplier`    | 将传输值乘以该系数，得到未缩放的原始值     |
| `reserved`      | 保留参数标记，相关位置不应作为普通参数使用 |

还有一个 `default` 属性，官方标记为已弃用或不再使用。

 **index：参数编号**

```
<param index="1">
```

这里的 `index` 表示该参数对应 `param1`。

例如：

```
<param index="1">...</param>
<param index="2">...</param>
<param index="5">...</param>
```

它们分别对应：

```
param1
param2
param5
```

注意，不是所有命令都需要使用全部 7 个参数。

如果一个命令只使用参数 1、2、5，那么其他参数就是未使用的参数位置。

官方明确要求：没有使用的参数位置属于保留位置，不应该在 XML 中将它们声明成普通参数。

 **label：参数显示名称**

```
label="Max Descent"
```

这个属性主要用于地面站界面显示。

例如，QGroundControl 可以根据命令定义向用户展示参数名称，而不是简单地显示：

```
Param 1
Param 2
Param 3
```

而是显示：

```
Max Descent
```

官方要求 label 中的单词首字母大写。

这也体现了 XML 不仅仅用于生成通信代码，还承载了协议的元数据，可以辅助地面站生成友好的用户界面。

 **units：参数单位**

```
units="m"
```

表示参数单位为米。

例如：

```
<param index="1" label="Max Descent" units="m">
```

地面站可以根据该信息显示参数的单位。

 **enum：参数关联的枚举**

```
<param index="1" label="Mode" enum="SOME_ENUM">
```

表示该参数的取值可以按照指定的枚举解释。

例如，一个参数可能允许：

```
0：关闭
1：开启
2：自动
```

这样，UI 就可以提供枚举选项，而不是让用户直接输入数字。

**decimalPlaces：小数位数**

```
<param index="1" decimalPlaces="2">
```

表示 UI 显示这个参数时，可以保留两位小数。

例如：

```
1.23456
```

显示为：

```
1.23
```

注意，这是显示层面的提示，不意味着传输时只保留两位小数。

**increment：变化步长**

```
<param index="1" increment="0.5">
```

表示该参数允许按照 0.5 的步长变化。

例如：

```
0
0.5
1.0
1.5
2.0
```

这有助于地面站生成合理的输入控件。

 **minValue 和 maxValue**

```
<param
    index="1"
    minValue="0"
    maxValue="100">
```

表示参数允许的范围是：

\[ 0 \leq param1 \leq 100 \]

两端都包含在允许范围内。

 **multiplier：缩放系数**

```
<param index="1" multiplier="0.01">
```

表示传输值需要乘以 0.01，才能得到未缩放的原始值。

例如：

```
传输值：250
multiplier：0.01
原始值：2.5
```

这个属性主要用于单位信息无法表达的缩放情况。

**reserved**

官方提到了 `reserved` 属性，但也特别说明，不应使用它来声明未使用的参数位置。

因为未使用的参数本来就是保留的，不需要通过 `<param>` 再次声明。





#### Message Definition

前面介绍的枚举和命令，都是协议中的重要组成部分，但真正用于在通信链路上传输数据的，是 MAVLink Message。

MAVLink 消息定义在：

```xml
<messages>
    ...
</messages>
```

每个具体消息使用：

```xml
<message>
    ...
</message>
```

每个消息内部可以定义多个：

```xml
<field>
    ...
</field>
```

例如，BATTERY_STATUS 消息的定义如下所示（该消息被选中是因为它包含了众多主要字段和属性）。



```xml
<messages>

    <message id="0" name="HEARTBEAT">

        <description>
            The heartbeat message
        </description>

        <field type="uint8_t" name="type" enum="MAV_TYPE">
            Vehicle type
        </field>

        <field type="uint8_t" name="autopilot" enum="MAV_AUTOPILOT">
            Autopilot type
        </field>

        <field type="uint8_t" name="base_mode">
            System mode
        </field>

    </message>

</messages>
```

这里：

+ `message` 表示一个完整的 MAVLink 消息。
+ `id` 表示消息 ID。
+ `name` 表示消息名称。
+ `description` 描述消息的含义。
+ `field` 定义消息携带的数据。

可以将它理解为一个 C 语言结构体：

```
typedef struct
{
    uint8_t type;
    uint8_t autopilot;
    uint8_t base_mode;

} mavlink_heartbeat_t;
```

当然，这里只是帮助理解的简化示例，实际生成的结构体还会包含其他字段。



##### `<messages>` **标签**

这是消息的集合容器。

```
<messages>
    <message ...>
        ...
    </message>

    <message ...>
        ...
    </message>
</messages>
```

属性：

无。

子元素：

\- 零个或多个 `<message>`。

也就是说，一个方言可以定义多个 MAVLink 消息。

##### `message>` **标签**

这是定义单个 MAVLink 消息的标签。

例如：

```
<message id="147" name="BATTERY_STATUS">
```

它有两个必须的属性。

###### **消息 ID**

```
id="147"
```

这是消息在 MAVLink 协议中的唯一编号。

接收端可以通过消息 ID 判断当前收到的是什么类型的消息。

例如：

```
147 → BATTERY_STATUS
```

不同消息不能随意使用相同的 ID。

MAVLink 1 和 MAVLink 2 在消息 ID 范围上有明显区别。

具体分配规则：

**MAVLink 1：**消息 ID 为 8 bit。

+ 有效 ID 范围：0～255。
+ 0～149 和 230～255 保留给 `common.xml`。
+ 180～229 可以用于自定义消息，但必须确保没有与引入的其他方言冲突。

**MAVLink 2：**消息 ID 为 24 bit。

+ 有效 ID 范围：0～16777215。
+ 小于 255 的 ID 应当视为保留编号，除非该消息也打算兼容 MAVLink 1。

这里有一个重要问题：

为什么 MAVLink 2 不建议随意使用小于 255 的消息 ID？

因为 MAVLink 1 只有 8 bit 消息 ID，而 MAVLink 2 扩展到了 24 bit。

如果一个新消息使用较大的 ID，那么 MAVLink 1 无法识别它。

而小于 255 的编号处于 MAVLink 1 的编号范围内，通常需要遵守现有的编号分配规则，以避免与已有消息产生冲突。

因此，**MAVLink 1 的消息 ID 资源非常有限，不能随意占用。**

###### **name：消息名称**

```
name="BATTERY_STATUS"
```

这是消息的可读名称。

例如：

```
<message id="147" name="BATTERY_STATUS">
```

它在生成代码中还会用于：

+ 命名消息结构体。
+ 命名打包函数。
+ 命名解包函数。
+ 命名消息相关的辅助函数。

例如：

```
mavlink_battery_status_t
mavlink_msg_battery_status_pack()
mavlink_msg_battery_status_decode()
```

需要注意：

`name` 不会直接作为消息名称字符串发送到通信链路上。

**实际传输的是消息 ID 和消息数据。**

这也是为什么接收端即使不知道 XML 文件，也可以通过已知的消息 ID 和对应的协议定义解析消息。



###### `<message>` **的子元素**

一个消息可以包含以下内容：

| 子元素          | 作用                        |
| --------------- | --------------------------- |
| `<wip>`         | 标记正在开发                |
| `<superseded>`  | 标记已有更合适的替代定义    |
| `<deprecated>`  | 标记即将淘汰                |
| `<description>` | 消息说明                    |
| `<field>`       | 消息数据字段                |
| `<extensions/>` | 标记 MAVLink 2 扩展字段起点 |

其中：

`description` 是必须的。

而且每个消息必须至少包含一个 `field`。

官方特别强调，消息描述应该尽可能完整，包括理解消息所需的信息和相关链接。

这不仅有助于阅读 XML，也有利于自动生成文档。



##### **Field：消息字段定义**

这是整个 XML Schema 中最值得花时间理解的部分。

因为 MAVLink 消息最终要编码成二进制数据，而每个 `field` 就决定了二进制数据中具体存储什么。

官方使用 `BATTERY_STATUS` 消息作为示例，因为它包含了很多常见字段属性。

```xml
<message id="147" name="BATTERY_STATUS">

    <description>
        Battery information.
        Updates GCS with flight controller battery status.
    </description>

    <field type="uint8_t" name="id" instance="true">
        Battery ID
    </field>

    <field type="uint8_t"
           name="battery_function"
           enum="MAV_BATTERY_FUNCTION">
        Function of the battery
    </field>

    <field type="uint8_t"
           name="type"
           enum="MAV_BATTERY_TYPE">
        Type (chemistry)
    </field>

    <field type="int16_t"
           name="temperature"
           units="cdegC"
           invalid="INT16_MAX">
        Temperature of the battery
    </field>

    <field type="uint16_t[10]"
           name="voltages"
           units="mV"
           invalid="[UINT16_MAX]">
        Battery voltage of cells 1 to 10
    </field>

    <field type="int16_t"
           name="current_battery"
           units="cA"
           invalid="-1">
        Battery current
    </field>

    <field type="int32_t"
           name="current_consumed"
           units="mAh"
           invalid="-1">
        Consumed charge
    </field>

    <field type="int32_t"
           name="energy_consumed"
           units="hJ"
           invalid="-1">
        Consumed energy
    </field>

    <field type="int8_t"
           name="battery_remaining"
           units="%"
           invalid="-1">
        Remaining battery energy
    </field>

    <extensions/>

    <field type="int32_t"
           name="time_remaining"
           units="s"
           invalid="0">
        Remaining battery time
    </field>

    <field type="uint8_t"
           name="charge_state"
           enum="MAV_BATTERY_CHARGE_STATE">
        State for extent of discharge
    </field>

    <field type="uint16_t[4]"
           name="voltages_ext"
           units="mV"
           invalid="[0]">
        Battery voltages for cells 11 to 14
    </field>

    <field type="uint8_t"
           name="mode"
           enum="MAV_BATTERY_MODE">
        Battery mode
    </field>

    <field type="uint32_t"
           name="fault_bitmask"
           enum="MAV_BATTERY_FAULT">
        Fault/health indications
    </field>

</message>
```

先将它理解成一个数据结构。

| 字段              | 类型         | 含义              |
| ----------------- | ------------ | ----------------- |
| id                | uint8_t      | 电池编号          |
| battery_function  | uint8_t      | 电池功能          |
| type              | uint8_t      | 电池类型          |
| temperature       | int16_t      | 温度              |
| voltages          | uint16_t[10] | 1～10 号电芯电压  |
| current_battery   | int16_t      | 电流              |
| current_consumed  | int32_t      | 已消耗电量        |
| energy_consumed   | int32_t      | 已消耗能量        |
| battery_remaining | int8_t       | 剩余电量百分比    |
| time_remaining    | int32_t      | 剩余时间          |
| charge_state      | uint8_t      | 充电状态          |
| voltages_ext      | uint16_t[4]  | 11～14 号电芯电压 |
| mode              | uint8_t      | 电池模式          |
| fault_bitmask     | uint32_t     | 故障位掩码        |

XML 其实就是在描述一个通信数据结构。

但与普通 C 语言结构体不同，MAVLink XML 还包含了很多额外的元数据：

+ 单位。
+ 枚举关联。
+ 无效值。
+ 多实例标记。
+ 数据缩放系数。
+ 扩展字段信息。

###### **type：数据类型**

```
<field type="uint8_t" name="id">
```

这里的 `type` 决定了字段在数据结构中的基本类型,决定底层数据如何存储。。

MAVLink 支持的类型主要包括：

| 类型       | 位数 | 字节数 | 取值类型     |
| ---------- | ---- | ------ | ------------ |
| `uint8_t`  | 8    | 1      | 无符号整数   |
| `int8_t`   | 8    | 1      | 有符号整数   |
| `uint16_t` | 16   | 2      | 无符号整数   |
| `int16_t`  | 16   | 2      | 有符号整数   |
| `uint32_t` | 32   | 4      | 无符号整数   |
| `int32_t`  | 32   | 4      | 有符号整数   |
| `uint64_t` | 64   | 8      | 无符号整数   |
| `int64_t`  | 64   | 8      | 有符号整数   |
| `float`    | 32   | 4      | 单精度浮点数 |
| `double`   | 64   | 8      | 双精度浮点数 |

另外还支持数组。

例如：

```
<field type="uint16_t[10]" name="voltages">
```

这表示：

```
uint16_t voltages[10];
```

它占用：

\[ 10\times 2=20\text{ bytes} \]

需要注意：MAVLink 的消息字段不是任意 C++ 类型，不能直接定义复杂类、指针、动态数组等类型。

因为 MAVLink 最终需要将字段转换成确定长度、确定布局的二进制数据。

###### **name：字段名称**

```
name="temperature"
```

表示字段名称。

这个名称主要用于：

+ 生成代码中的结构体成员。
+ 生成对应的打包和解包函数。
+ 生成文档。
+ 帮助开发者理解字段含义。

例如：

```xml
mavlink_battery_status_t battery;

battery.temperature = 2500;
```

###### **enum：字段关联的枚举**

例如：

```
<field
    type="uint8_t"
    name="charge_state"
    enum="MAV_BATTERY_CHARGE_STATE">
```

表示：

`charge_state` 字段使用 `uint8_t` 存储，但它的取值应该按照 `MAV_BATTERY_CHARGE_STATE` 枚举来解释。

例如：

```
typedef enum
{
    MAV_BATTERY_CHARGE_STATE_UNDEFINED = 0,
    MAV_BATTERY_CHARGE_STATE_OK = 1,
    MAV_BATTERY_CHARGE_STATE_LOW = 2
} MAV_BATTERY_CHARGE_STATE;
```

那么：

```
battery.charge_state = 2;
```

就表示：

```
MAV_BATTERY_CHARGE_STATE_LOW
```

这里需要区分：

+ `type` 决定底层数据如何存储。
+ `enum` 决定这个数值应该如何解释。

这两个属性并不冲突。



######  **units：单位**

例如：

```
<field
    type="int16_t"
    name="temperature"
    units="cdegC">
```

表示温度字段使用百分之一摄氏度作为单位。

这里：

```
cdegC = centi-degree Celsius
```

例如：

```
2500 → 25.00 ℃
```

注意，这里不应该把 `cdegC` 理解为普通的摄氏度。

MAVLink 对单位采用统一定义，具体合法单位可以在 `mavschema.xsd` 中搜索：

```
SI_Unit
```

###### **multiplier：缩放系数**

例如：

```
<field
    type="uint8_t"
    name="some_value"
    multiplier="0.5">
```

表示接收到的数值需要乘以 0.5，才能得到未缩放的原始数值。

###### **print_format 和 default**

官方文档目前将这两个属性标记为：

```
TBD
```

也就是待进一步定义。

因此，阅读现有 XML 时，不需要将它们作为核心字段属性理解。



###### **increment：步长**

```
<field
    type="float"
    name="some_value"
    increment="0.1">
```

用于描述该字段的允许变化步长。

它主要属于元数据，便于实现端理解字段的取值约束。

###### **6.9 minValue 和 maxValue**

```
<field
    type="float"
    name="some_value"
    minValue="0"
    maxValue="100">
```

表示字段的有效范围：
$$
\[ 0\leq x\leq100 \]
$$
两端都包含。

这些属性主要用于描述字段的有效取值范围，并不意味着 MAVLink 数据帧本身会自动执行范围检查。

###### **instance：实例标记**

这是你在学习 MAVLink 时值得特别关注的一个属性。

例如：

```
<field
    type="uint8_t"
    name="id"
    instance="true">
    Battery ID
</field>
```

这里的 `instance="true"` 表示：

这个消息可能来自多个同类型的设备或传感器，而当前字段用于区分具体是哪一个实例。

例如，一架无人机上有多个电池：

```
Battery 0
Battery 1
Battery 2
```

它们可能都发送：

```
BATTERY_STATUS
```

但通过消息中的：

```
id
```

字段，就可以知道数据来自哪一个电池。

假设收到：

```
BATTERY_STATUS:
    id = 0
    battery_remaining = 90
```

以及：

```
BATTERY_STATUS:
    id = 1
    battery_remaining = 70
```

接收端可以将这两条消息分别归属于不同的电池实例。

官方指出，这个属性允许接收端自动关联同一个传感器的消息，并将数据绘制到同一个数据曲线中。

需要特别区分：

`instance="true"` 并不会创建新的 MAVLink 通信实例，也不会产生新的消息 ID。

它只是告诉接收端：这个字段是区分消息数据来源实例的标识。

这与我们前面讨论的 PX4 MAVLink 模块中的 MAVLink instance 不是同一个概念

###### **invalid：无效数据标记**

这是一个非常重要的属性。

例如：

```
<field
    type="int16_t"
    name="current_battery"
    units="cA"
    invalid="-1">
    Battery current
</field>
```

它表示：

当该字段的值为 `-1` 时，接收端应该将其视为无效数据。

### 定义 XML  Enums/Messages

官方项目的 XML 定义文件存放在 GitHub 仓库：

[mavlink/mavlink — message_definitions/v1.0](https://github.com/mavlink/mavlink/tree/master/message_definitions/v1.0?utm_source=chatgpt.com)

该目录中包含：

```sh
message_definitions/
└── v1.0/
    ├── common.xml
    ├── minimal.xml
    ├── standard.xml
    ├── development.xml
    ├── ardupilotmega.xml
    ├── uAvionix.xml
    └── ...
```

这些 XML 文件是协议定义的源文件。

**一个 MAVLink 系统使用哪套 XML 定义，决定了它能够识别和生成哪些消息。**



1. **common.xml：通用协议定义**

`common.xml` 保存的是具有广泛通用性的 MAVLink 消息和枚举。

例如：

+ `HEARTBEAT`
+ `ATTITUDE`
+ `GLOBAL_POSITION_INT`
+ `GPS_RAW_INT`
+ `BATTERY_STATUS`
+ `MAV_TYPE`
+ `MAV_AUTOPILOT`
+ `MAV_FRAME`

这些协议定义可以被不同的飞控、地面站和其他 MAVLink 系统共同使用。

如果你定义的消息具有普遍适用性，可以考虑将其提交到 MAVLink 官方仓库的 `common.xml`。

但如果只是你的项目使用，就没有必要修改公共协议。



2.  **Dialect：方言文件**

   MAVLink 方言（Dialect）是针对某个系统、飞控或者特定应用扩展出来的协议定义。

   例如：

   + `ardupilotmega.xml`
   + `uAvionix.xml`
   + `icarous.xml`

   这些文件通常会通过 `<include>` 引入 `common.xml`，然后在自己的文件中定义特有的消息和枚举。

   例如：

   ```xml
   <?xml version="1.0"?>
   <mavlink>
   
       <include>common.xml</include>
   
       <dialect>8</dialect>
   
       <enums>
           <!-- 自定义枚举 -->
       </enums>
   
       <messages>
           <!-- 自定义消息 -->
       </messages>
   
   </mavlink>
   ```

   这里：

   ```xml
   <include>common.xml</include>
   ```

   表示当前方言引入公共 MAVLink 定义。

   因此，在这个方言中可以直接使用 `common.xml` 中已经定义的消息和枚举。

   

3. **include**

假设你的方言文件是：

```
my_project.xml
```

它引入：

```
<include>common.xml</include>
```

那么生成代码时，生成器并不只是生成 `my_project.xml` 中的消息。

它会将：

```
my_project.xml
    +
common.xml
```

中的协议定义一起纳入生成结果。

例如：

```sh
my_project.xml
    ├── include common.xml
    │      ├── HEARTBEAT
    │      ├── ATTITUDE
    │      ├── GLOBAL_POSITION_INT
    │      ├── MAV_TYPE
    │      └── MAV_FRAME
    │
    ├── MY_SENSOR_DATA
    └── MY_DEVICE_STATUS
```

最终生成的库就包含这些消息和枚举。

如果不同 XML 文件引入的消息存在 ID 冲突，或者枚举 entry 存在名称冲突，生成器会报告错误。

此外，**同名枚举的 entry 可以合并**。例如多个文件都扩展 `MAV_CMD`，生成器会把这些命令 entry 合并到同一个枚举定义中。



4. **应该把自定义协议放在哪里**

官方给出了三种情况：

| 场景                                 | 推荐位置            |
| ------------------------------------ | ------------------- |
| 多种飞控和地面站都可能使用的通用协议 | `common.xml`        |
| 特定飞控或特定方言专用协议           | 对应的方言 XML      |
| 仅供自己项目使用的私有协议           | 自己创建的 XML 方言 |

#### **如何创建一个新的 MAVLink 方言文件**

官方给出了一个标准模板。

```xml
<?xml version="1.0"?>

<mavlink>

    <include>common.xml</include>

    <!-- <version>9</version> -->

    <dialect>8</dialect>

    <enums>
        <!-- Enums are defined here (optional) -->
    </enums>

    <messages>
        <!-- Messages are defined here (optional) -->
    </messages>

</mavlink>
```

我们逐项理解。

#####  **XML 声明**

```xml
<?xml version="1.0"?>
```

这是 XML 文件的声明，表示该文件使用 XML 1.0 规范。

它不是 MAVLink 专有元素，而是 XML 自身的语法。



##### **根元素 mavlink**

```xml
<mavlink>
    ...
</mavlink>
```

这是 MAVLink 方言文件的根元素。

消息、枚举、include 等协议定义都放在这个元素内部。





##### **include**

```xml
<include>common.xml</include>
```

引入其他方言文件。

如果你的方言不依赖 `common.xml`，可以删除这一行。

也可以引入其他文件：

```
<include>common.xml</include>
<include>other_dialect.xml</include>
```

官方特别提醒：

**嵌套文件中的 include 会被忽略。**

也就是说，生成器以顶层方言文件作为入口，不能指望某个被间接引入的 XML 文件再通过自己的 include 递归地引入其他文件。

因此，如果你的顶层方言需要依赖多个文件，应当在顶层 XML 中明确列出它们。



##### **version**



```
<!-- <version>9</version> -->
```

表示方言版本号。

官方建议：

+ 如果你的方言引入了 `common.xml`，通常不需要单独定义 version。
+ 如果你的方言不依赖 `common.xml`，可以自行指定版本号。

这里还有一个重要规则：

**顶层 XML 文件中指定的 version 优先使用；如果顶层文件没有指定，则使用 include 文件中的 version。**

例如：

```
<mavlink>

    <include>common.xml</include>

    <version>10</version>

</mavlink>
```

这里顶层文件的版本号就是 `10`。



#####  **dialect**

```xml
<dialect>8</dialect>
```

这是方言编号。

它与消息 ID 不是一回事。

| 字段                | 含义                    |
| ------------------- | ----------------------- |
| dialect             | 方言的编号              |
| message id          | 某条 MAVLink 消息的编号 |
| MAV_CMD entry value | 某个 MAVLink 命令的编号 |

例如：

```xml
<dialect>8</dialect>

<messages>
    <message id="200" name="MY_SENSOR_DATA">
        ...
    </message>
</messages>
```

其中：

+ `8` 是方言编号；
+ `200` 是消息编号。

创建新的公开方言时，应选择尚未使用的方言编号，并遵循官方仓库的分配规则。



#####  **enums 和 messages**

```xml
<enums>
    ...
</enums>

<messages>
    ...
</messages>
```







#### **Message：如何定义一条 MAVLink 消息**

######  **message 的基本结构**

官方规定，消息通过 `<message>` 元素定义：

```xml
<message id="54" name="SAFETY_SET_ALLOWED_AREA">

    <description>
        Set a safety zone.
    </description>

    <field type="uint8_t" name="target_system">
        System ID
    </field>

    <field type="uint8_t" name="target_component">
        Component ID
    </field>

</message>
```

其中：

```
<message id="54" name="SAFETY_SET_ALLOWED_AREA">
```

包含两个必需属性：

+ `id`：消息编号。
+ `name`：消息名称。

官方还强烈建议为消息添加 `description`。

此外，每条消息至少需要一个字段。

######  **message 的 id**

MAVLink 数据包中包含消息 ID。

接收方收到数据包后，会根据消息 ID 判断当前数据包对应哪一种消息格式。

例如：

```
Message ID = 0
```

代表 `HEARTBEAT`。

而：

```
Message ID = 30
```

代表 `ATTITUDE`。

因此，消息 ID 是 MAVLink 接收端确定数据结构的关键依据。

如果不同消息使用了相同的 ID，接收端就无法可靠地区分它们的结构。

###### **message 的 name** 

`name` 是消息的名称。

例如：

```
<message id="30" name="ATTITUDE">
```

**生成器会使用它生成相应的函数、结构体和宏。**

在 C 语言 MAVLink 库中，通常会生成类似：

```
mavlink_attitude_t
```

以及：

```
mavlink_msg_attitude_pack()
mavlink_msg_attitude_decode()
```

因此，`name` 不仅用于文档展示，也会影响生成代码中的标识符。

消息名称应当具有明确含义，并且在最终生成的协议库中保持唯一。



###### **message 的 description**

例如：

```
<description>
    Set a safety zone.
</description>
```

它用于说明消息的用途。

建议准确描述：

+ 消息的目的；
+ 发送方和接收方；
+ 适用场景；
+ 字段之间的关系；
+ 特殊约束。

这部分一般不会改变数据包的二进制格式，但对代码生成文档、开发者理解和维护非常重要。



######  **message 的字段数量和大小限制**

官方列出了以下规则：

| 规则         | 要求                        |
| ------------ | --------------------------- |
| 消息 ID      | 必须定义                    |
| 消息名称     | 必须定义                    |
| 字段数量     | 至少 1 个，最多 64 个       |
| 字段名称     | 在同一消息内必须唯一        |
| 消息描述     | 强烈建议定义                |
| 字段描述     | 建议定义                    |
| Payload 大小 | 所有字段总计不超过 255 字节 |

这里要特别区分两个概念：

+ **字段数量限制**：最多 64 个字段。
+ **Payload 大小限制**：最多 255 字节。

例如：

```
<message id="200" name="MY_DATA">
    <field type="uint8_t" name="a">A</field>
    <field type="uint8_t" name="b">B</field>
    <field type="float" name="c">C</field>
</message>
```

字段数量为 3，数据长度为：
$$
 1+1+4=6\text{ bytes} 
$$
它满足上述两个限制。

但如果消息包含大量数组字段，即使字段数量很少，也可能超过 255 字节。

例如：

```
<field type="uint8_t[200]" name="data">
    Data
</field>
```

这个字段自身就占用 200 字节。

因此，设计消息时必须同时考虑字段数量和 Payload 大小。



###### **target_system 和 target_component**

官方特别指出：

**点对点消息（Point-to-point message）应该包含** `target_system` **字段。**

如果消息还需要针对某个具体组件，则还应包含 `target_component` 字段。

例如：

```xml
<message id="200" name="MY_CONTROL">

    <description>
        Custom control message.
    </description>

    <field type="uint8_t" name="target_system">
        Target system
    </field>

    <field type="uint8_t" name="target_component">
        Target component
    </field>

    <field type="float" name="target_value">
        Target value
    </field>

</message>
```

它们的作用分别是：

+ `target_system`：指定目标飞行器或系统。
+ `target_component`：指定目标系统中的某个组件。

###### **字段命名和说明规范**

官方对字段也提出了一些建议：

1. 同一条消息中，字段名称必须唯一。

2. 字段应该有描述。

3. 如果字段有单位，应使用 `units` 属性。

4. 如果字段的取值范围是有限且明确的，应尽可能使用 `enum` 属性。

   例如，不推荐：

   ```xml
   <field type="float" name="temperature">
       Temperature in degrees Celsius
   </field>
   ```

   更推荐：

   ```xml
   <field type="float" name="temperature" units="degC">
       Temperature
   </field>
   ```

   为什么？

   因为单位本身是一个独立的元数据，生成器可以读取它，文档工具也可以使用它。

   同样，下面这种字段：

   ```xml
   <field type="uint8_t" name="status">
       Status: 0 = idle, 1 = running, 2 = error
   </field>
   ```

   更适合定义成枚举：

   ```xml
   <field type="uint8_t"
          name="status"
          enum="MY_DEVICE_STATUS">
       Device status
   </field>
   ```

###### **mavgen 并不会检查所有规则**

这是官方特别提醒的一个问题。

不能认为只要 XML 能通过 `mavgen`，就代表所有协议设计都正确。

官方指出，`mavgen` 会检查一些问题，例如：

+ 重复的消息 ID；
+ 重复的字段名称；
+ 没有字段的消息；
+ 字段超过 64 个的消息。

但它并不保证检查所有问题，例如：

+ 重复的消息名称；
+ Payload 超过限制；
+ 其他不符合协议设计规范的问题。

因此，**代码生成成功不等于协议设计完全合规。**

开发时仍然要主动检查消息 ID、字段定义、Payload 大小和兼容性



##### **Message ID：消息编号分配规则**

消息 ID 是协议兼容性的关键部分。

所有被合并到同一个生成库中的消息，都必须具有唯一 ID。

```xml
common.xml
    └── MESSAGE_A，ID = 200

my_dialect.xml
    └── MESSAGE_B，ID = 200
```

如果两个 XML 被一起生成到一个库中，那么接收端遇到 ID 为 200 的数据包时，就不知道应该按照哪个消息结构解码。

所以，不同方言需要合理分配消息 ID 范围。

MAVLink 2 为不同方言分配了特定的 ID 范围，保证方言可以互相 include 而不产生冲突。

官方页面列出了一些分配范围：

| 方言                | 消息 ID 范围 |
| ------------------- | ------------ |
| `common.xml`        | 300–10000    |
| `uAvionix.xml`      | 10001–10049  |
| `loweheiser.xml`    | 10150–10199  |
| `ArduPilotMega.xml` | 11000–11999  |
| `icarous.xml`       | 42000–42999  |

这些是官方页面列出的范围示例，实际开发时还应检查当前仓库的 `all.xml` 和对应方言定义，避免使用已经分配或占用的编号。

 **MAVLink 1 和 MAVLink 2 的区别**

MAVLink 1 的消息 ID 只有 8 bit：$ 0\leq ID\leq255 $

MAVLink 2 的消息 ID 可以使用 24 bit：$ 0\leq ID\leq 2^{24}-1 $

因此，MAVLink 2 有更大的消息 ID 空间。

官方特别建议：

**新定义的消息不要使用 MAVLink 1 的消息 ID 范围。**

原因是 MAVLink 1 的 ID 资源非常有限，且旧消息 ID 的兼容性需要长期维护。

如果你要创建一个新的公开方言，最好先向 MAVLink 项目申请分配消息 ID 范围。

如果只是私有项目，则可以在确认没有冲突的前提下自行选择。



##### **修改已有消息会有什么后果？**

这一节非常重要，因为它涉及 MAVLink 协议的向后兼容性。

假设你已经发布了一条消息：

```
<message id="200" name="MY_SENSOR_DATA">

    <field type="uint8_t" name="sensor_id">
        Sensor ID
    </field>

    <field type="float" name="temperature">
        Temperature
    </field>

</message>
```

现在有一套旧版地面站已经使用这条消息。

如果你修改了消息定义，就可能导致新旧设备之间无法正常通信。

1.  修改消息名称

例如：

```
<message id="200" name="MY_SENSOR_DATA_V2">
```

虽然消息 ID 没有改变，但生成代码中的消息名称和相关 API 会改变。

旧程序可能仍然调用：

```
mavlink_msg_my_sensor_data_decode()
```

而新库生成的函数名称已经改变。

所以，改变消息名称会导致旧版生成库与新版生成库不兼容。

2.  修改消息 ID

例如：

```
<message id="201" name="MY_SENSOR_DATA">
```

这更直接。

旧版程序认为：

```
ID = 200 → MY_SENSOR_DATA
```

新版程序认为：

```
ID = 201 → MY_SENSOR_DATA
```

因此，双方对同一条消息的识别不一致。

3.  添加或删除字段

假设旧消息是：

```
<message id="200" name="MY_SENSOR_DATA">

    <field type="uint8_t" name="sensor_id">
        Sensor ID
    </field>

    <field type="float" name="temperature">
        Temperature
    </field>

</message>
```

现在你在中间增加字段：

```
<field type="float" name="pressure">
    Pressure
</field>
```

新旧消息的字段数量、位置和数据布局可能不再一致。

旧版解码器按照旧定义读取数据，而新版发送方按照新定义发送数据，就可能出现错误。

4. 修改字段名称或类型

例如：

```
<field type="float" name="temperature">
```

改成：

```
<field type="int16_t" name="temperature">
```

这会改变字段的数据类型。

接收端旧版代码按照 `float` 解析，新版发送端却可能按照 `int16_t` 组织数据。

显然会产生问题。

修改字段名称也可能导致生成代码 API 发生变化。

因此，以下修改都可能破坏兼容性：

+ 修改消息名称；
+ 修改消息 ID；
+ 添加字段；
+ 删除字段；
+ 修改字段名称；
+ 修改字段类型；
+ 改变字段顺序。

5. 如果确实需要修改，怎么办？

官方给出了两种主要方案。

**方案一：创建新的消息。**

例如：

```
<message id="200" name="MY_SENSOR_DATA">
    ...
</message>

<message id="201" name="MY_SENSOR_DATA_V2">
    ...
</message>
```

然后逐渐让新系统迁移到新版消息，旧消息以后可以标记为 deprecated。

这种方式通常更适合已经发布、被多个系统使用的协议。

**方案二：直接修改原消息，并迭代方言版本号。**

但这种方式要求所有使用该消息的系统都更新生成库。

如果是 `common.xml` 中的公共消息，修改还需要主要参与方达成一致。

6. 描述文字能不能修改？

可以。

例如：

```
<field type="float" name="temperature">
    Temperature
</field>
```

修改成：

```
<field type="float" name="temperature">
    Ambient temperature
</field>
```

通常不会破坏二进制兼容性。

但是需要注意：如果你修改描述的同时，实际上改变了字段含义，那么即使二进制格式没有改变，语义兼容性仍然可能被破坏。

例如，原来 `temperature` 表示摄氏温度，后来你把它改成华氏温度，但仍然使用相同字段和数据类型，接收方就可能错误解释数据。

所以，协议兼容性不仅是数据结构一致，还包括字段语义一致.



###### **Message Extensions：MAVLink 2 扩展字段**

这一节与上一节密切相关。

刚才讲到，直接给已有消息增加字段可能破坏兼容性。

那么，如果一个消息已经投入使用，后来确实需要增加一些数据，应该怎么办？

MAVLink 2 提供了扩展字段机制。

1. extensions 元素

例如：

```
<message id="100" name="OPTICAL_FLOW">

    <field type="uint64_t" name="time_usec" units="us">
        Timestamp
    </field>

    <field type="uint8_t" name="sensor_id">
        Sensor ID
    </field>

    <field type="int16_t" name="flow_x">
        Flow in X
    </field>

    <field type="int16_t" name="flow_y">
        Flow in Y
    </field>

    <field type="float" name="ground_distance" units="m">
        Ground distance
    </field>

    <extensions/>

    <field type="float" name="flow_rate_x" units="rad/s">
        Flow rate about X
    </field>

    <field type="float" name="flow_rate_y" units="rad/s">
        Flow rate about Y
    </field>

</message>
```

这里：

```
<extensions/>
```

就是扩展字段的分界标记。

它之前的字段是原始字段（Base fields）。

它之后的字段是扩展字段（Extension fields）。

**消息字段结构**

Base fields

```
time_usec
sensor_id
flow_x
flow_y
ground_distance
```

`<extensions/>` **扩展边界**

Extension fields

```
flow_rate_x
flow_rate_y
```

2. 为什么扩展字段不会破坏旧接收端？

假设有两个版本的系统。

**旧版接收端**

只认识原始字段

time_usec、sensor_id、flow_x、flow_y、ground_distance

**新版发送端**

原始字段 + 扩展字段

额外包含 flow_rate_x、flow_rate_y

新版发送端发送消息时，旧版接收端仍然可以根据原始字段进行解码。

它不认识扩展字段，就不会使用这些字段。

反过来，如果旧版发送端没有扩展字段，那么新版接收端解码时，扩展字段会得到零值。

这就实现了扩展字段的向后兼容性。

3. 扩展字段的具体规则

官方列出了以下规则：

| 规则                     | 解释                                    |
| ------------------------ | --------------------------------------- |
| 可以添加到已有消息       | 不必创建新消息 ID                       |
| MAVLink 1 不发送扩展字段 | 使用 MAVLink 1 编码时，扩展字段会被忽略 |
| 旧接收端看不到扩展字段   | 旧版解码器不认识这些字段                |
| 新接收端兼容旧发送端     | 缺失的扩展字段得到零值                  |
| 扩展字段不参与 CRC_EXTRA | 扩展字段不影响原始字段的 CRC_EXTRA      |
| 扩展字段不重新排序       | 按 XML 定义顺序序列化                   |
| 只能追加                 | 新扩展字段必须添加到已有扩展字段末尾    |

这里有两个特别重要的点。

 **第一：扩展字段不参与 CRC_EXTRA**

你之前已经学习过 MAVLink 的 CRC_EXTRA。

原始字段参与消息 CRC_EXTRA 的计算，而扩展字段不参与。

这也是为什么扩展字段可以在不改变旧版消息 CRC_EXTRA 的情况下追加。

 **第二：扩展字段不重新排序**

普通字段在生成消息序列化布局时会按照 MAVLink 的字段排序规则处理。

而扩展字段按照 XML 中的定义顺序排列。

例如：

```
<extensions/>

<field type="uint8_t" name="a">
    A
</field>

<field type="uint64_t" name="b">
    B
</field>

<field type="float" name="c">
    C
</field>
```

扩展部分的序列化顺序就是：

```
a → b → c
```

不会因为 `uint64_t` 比 `uint8_t` 大，就将 `b` 移到 `a` 前面。

4. 扩展字段能不能修改或删除？

不能随意修改或删除。

扩展字段一旦添加，也需要保持稳定。

你可以继续在扩展字段的末尾添加新字段，但仍然需要遵守字段数量和 Payload 大小限制。

因此，扩展机制并不是一种可以任意修改旧消息的手段。

它解决的是：

**在不破坏旧接收端兼容性的前提下，给已有消息追加新的字段。**

如果需要删除字段、改变字段类型或改变原始字段含义，仍然需要考虑创建新消息或版本升级。

#### **Enums：如何定义枚举**

```xml
<xs:element name="entry">
    <xs:complexType>
        <xs:sequence>
            <xs:choice minOccurs="0" maxOccurs="1">
                <xs:element ref="wip"/>
                <xs:element ref="superseded"/>
                <xs:element ref="deprecated"/>
            </xs:choice>
            <xs:element ref="description" minOccurs="0"/>
            <xs:element ref="param" minOccurs="0" maxOccurs="unbounded" />
        </xs:sequence>
        <xs:attribute ref="value" />
        <xs:attribute ref="name" use="required"/>
        <xs:attribute ref="hasLocation"/>
        <xs:attribute ref="hasAltitudeOnly"/>
        <xs:attribute ref="isDestination"/> <!-- requires hasLocation -->
        <xs:attribute ref="missionOnly"/>  <!-- planned for removal -->
        <xs:attribute ref="mission"/>
        <xs:attribute ref="fence"/>
        <xs:attribute ref="rally"/>
        <xs:attribute ref="command"/>
    </xs:complexType>
</xs:element>

<xs:element name="enum">
    <xs:complexType>
        <xs:sequence>
            <xs:choice minOccurs="0" maxOccurs="1">
                <xs:element ref="wip"/>
                <xs:element ref="superseded"/>
                <xs:element ref="deprecated"/>
            </xs:choice>
            <xs:element ref="description" minOccurs="0"/>
            <xs:element ref="entry" maxOccurs="unbounded"/>
        </xs:sequence>
        <xs:attribute ref="name" use="required"/>
        <xs:attribute ref="bitmask"/>
    </xs:complexType>
</xs:element>

...

<xs:element name="enums">
    <xs:complexType>
        <xs:sequence>
            <xs:element ref="enum" maxOccurs="unbounded" minOccurs="0"/>
        </xs:sequence>
    </xs:complexType>
</xs:element>
```



```xml
<enum name="LANDING_TARGET_TYPE">

    <description>
        Type of landing target
    </description>

    <entry value="0" name="LANDING_TARGET_TYPE_LIGHT_BEACON">
        <description>
            Landing target signaled by light beacon
        </description>
    </entry>

    <entry value="1" name="LANDING_TARGET_TYPE_RADIO_BEACON">
        <description>
            Landing target signaled by radio beacon
        </description>
    </entry>

    <entry value="2" name="LANDING_TARGET_TYPE_VISION_FIDUCIAL">
        <description>
            Landing target represented by a fiducial marker
        </description>
    </entry>

</enum>
```

这里有两个主要元素：

+ `<enum>`：定义一个枚举类型。

+ `<entry>`：定义枚举中的一个具体值。

+ 例如：

  ```
  LANDING_TARGET_TYPE
      ├── LANDING_TARGET_TYPE_LIGHT_BEACON = 0
      ├── LANDING_TARGET_TYPE_RADIO_BEACON = 1
      └── LANDING_TARGET_TYPE_VISION_FIDUCIAL = 2
  ```

  ###### **enum 的 name**

  ```
  <enum name="LANDING_TARGET_TYPE">
  ```

  `name` 是必需属性。

  它代表枚举的名称。

  在消息字段中使用时：

  ```
  <field type="uint8_t"
         name="target_type"
         enum="LANDING_TARGET_TYPE">
      Landing target type
  </field>
  ```

  这样就将字段与枚举建立了关联。

  注意：

  `enum` 属性并不会改变字段的底层数据类型。

  例如：

  ```
  <field type="uint8_t"
         name="target_type"
         enum="LANDING_TARGET_TYPE">
  ```

  它仍然是一个 8 bit 无符号整数，只是该整数的取值具有了枚举语义。

  ###### **enum 的 description**

  建议给枚举定义整体描述：

  ```
  <enum name="LANDING_TARGET_TYPE">
      <description>
          Type of landing target
      </description>
  </enum>
  ```

  如果多个 XML 文件定义了同名枚举，生成器会合并它们的 entry。

  但合并后，枚举整体的 description 只会保留其中一个，通常是最先遇到的那个。

  所以不要在不同文件中为同名枚举写互相矛盾的描述。

  ###### **entry 的 name**

  例如：

  ```
  <entry value="0"
         name="LANDING_TARGET_TYPE_LIGHT_BEACON">
  ```

  `name` 是必需属性。

  官方建议：

  **枚举 entry 的名称应该带有所属枚举的名称作为前缀。**

  例如：

  ```
  枚举名称：LANDING_TARGET_TYPE
  
  枚举值：
  LANDING_TARGET_TYPE_LIGHT_BEACON
  LANDING_TARGET_TYPE_RADIO_BEACON
  LANDING_TARGET_TYPE_VISION_FIDUCIAL
  ```

  这样做的好处是减少不同枚举之间的命名冲突，也方便开发者理解一个枚举值属于哪个枚举。

  ###### **entry 的 value**

  例如：

  ```
  <entry value="0"
         name="LANDING_TARGET_TYPE_LIGHT_BEACON">
  ```

  `value` 表示枚举值对应的数字。

  官方建议尽可能显式指定 value。

  例如：

  ```
  <enum name="MY_DEVICE_STATE">
  
      <entry value="0" name="MY_DEVICE_STATE_IDLE">
          Idle
      </entry>
  
      <entry value="1" name="MY_DEVICE_STATE_RUNNING">
          Running
      </entry>
  
      <entry value="2" name="MY_DEVICE_STATE_ERROR">
          Error
      </entry>
  
  </enum>
  ```

  为什么推荐显式指定？

  假设你不指定：

  ```
  <enum name="MY_DEVICE_STATE">
  
      <entry name="MY_DEVICE_STATE_IDLE">
          Idle
      </entry>
  
      <entry name="MY_DEVICE_STATE_RUNNING">
          Running
      </entry>
  
      <entry name="MY_DEVICE_STATE_ERROR">
          Error
      </entry>
  
  </enum>
  ```

  生成器会自动分配连续的值。

  官方说明：如果没有显式指定值，自动编号从 1 开始（如果第一个 entry 没有指定 value）。

  这就可能带来一个问题：

  以后你在中间增加新的枚举值，原来自动分配的后续编号可能发生变化。

  例如：

  ```
  旧版本：
  IDLE    = 1
  RUNNING = 2
  ERROR   = 3
  ```

  后来增加：

  ```
  STARTING
  ```

  自动编号可能变成：

  ```
  IDLE     = 1
  STARTING = 2
  RUNNING  = 3
  ERROR    = 4
  ```

  这会导致新旧系统对相同数字的理解不同。

  所以，**枚举值最好始终显式指定，不要依赖自动编号。**

  ######  **enum 的 entry 可以合并**

  官方允许多个 XML 文件定义同名枚举。

  例如：

  `common.xml`：

  ```
  <enum name="MY_DEVICE_STATE">
  
      <entry value="0" name="MY_DEVICE_STATE_IDLE">
          Idle
      </entry>
  
  </enum>
  ```

  `my_dialect.xml`：

  ```
  <enum name="MY_DEVICE_STATE">
  
      <entry value="1" name="MY_DEVICE_STATE_RUNNING">
          Running
      </entry>
  
  </enum>
  ```

  生成器会把它们合并成：

  ```
  MY_DEVICE_STATE
      ├── IDLE = 0
      └── RUNNING = 1
  ```

  但必须避免：

  + 同一个枚举中出现重复的 entry 名称；
  + 合并后的枚举中出现重复的数值。

  ###### **bitmask：位掩码枚举**

  这是枚举中一个非常重要的特殊形式。

  普通枚举通常表示多个互斥选项：

  ```
  IDLE
  RUNNING
  ERROR
  ```

  而位掩码枚举表示多个可以同时成立的标志。

  例如：

  ```
  <enum name="MY_DEVICE_FLAGS" bitmask="true">
  
      <entry value="1" name="MY_DEVICE_FLAGS_ENABLED">
          Enabled
      </entry>
  
      <entry value="2" name="MY_DEVICE_FLAGS_CALIBRATED">
          Calibrated
      </entry>
  
      <entry value="4" name="MY_DEVICE_FLAGS_ERROR">
          Error
      </entry>
  
  </enum>
  ```

  为什么这些值是：

  ```
  1、2、4
  ```

  因为它们分别对应不同的二进制位：

  | 标志       | 十进制 | 二进制 |
  | ---------- | ------ | ------ |
  | ENABLED    | 1      | `0001` |
  | CALIBRATED | 2      | `0010` |
  | ERROR      | 4      | `0100` |

  这样可以通过按位或组合多个状态。

  例如：

  ```
  flags = MY_DEVICE_FLAGS_ENABLED |
          MY_DEVICE_FLAGS_CALIBRATED;
  ```

  得到：

  ```
  0001 | 0010 = 0011
  ```

  即：

  ```
  flags = 3
  ```

  表示设备同时具有：

  + 已启用；
  + 已校准。

  这与普通枚举的含义不同。

  普通枚举的值通常表示一个选项，而位掩码表示多个独立的布尔标志。

  XML 中：

  ```
  bitmask="true"
  ```

  就是告诉工具，这个枚举应该按位标志处理。

  官方提到，地面站可以据此使用复选框等 UI 控件来显示和编辑这些标志。

  ###### **deprecated：废弃的枚举和 entry**

  枚举或枚举 entry 可以标记为废弃。

  例如：

  ```
  <enum name="MY_DEVICE_STATE">
  
      <entry value="0" name="MY_DEVICE_STATE_IDLE">
          Idle
      </entry>
  
      <entry value="1" name="MY_DEVICE_STATE_OLD">
          <deprecated/>
          Old state
      </entry>
  
  </enum>
  ```

  `deprecated` 表示这个定义已经不推荐继续使用。

  但它不等于立即删除。

  保留旧定义可以让旧系统继续识别以前的枚举值。

#### **Commands：如何定义 MAVLink 命令？**

前面已经介绍过：

MAVLink 命令是 `MAV_CMD` 枚举中的 entry。

这一节进一步讲解命令的 XML 定义规范。

##### **10.1 命令的基本结构**

例如：

```
<enum name="MAV_CMD">

    <description>
        Commands to be executed by the MAV.
    </description>

    <entry value="16"
           name="MAV_CMD_NAV_WAYPOINT">

        <description>
            Navigate to waypoint.
        </description>

        <param index="1">
            Hold time in decimal seconds.
        </param>

        <param index="2">
            Acceptance radius in meters.
        </param>

        <param index="3">
            Pass-by radius in meters.
        </param>

        <param index="4">
            Desired yaw angle at waypoint.
        </param>

        <param index="5">
            Latitude
        </param>

        <param index="6">
            Longitude
        </param>

        <param index="7">
            Altitude
        </param>

    </entry>

</enum>
```

这里：

+ `MAV_CMD`：命令枚举。
+ `MAV_CMD_NAV_WAYPOINT`：一个具体命令。
+ `value="16"`：命令编号。
+ `<param>`：描述命令的参数。

这与普通枚举的基本结构相同，只是命令 entry 可以包含额外的 `<param>` 元素以及命令相关属性。

##### **10.2 命令编号的分配范围**

与消息 ID 类似，命令也需要唯一编号。

但需要注意：

**消息 ID 和命令 ID 是两套不同的编号空间。**

官方页面列出了一些命令编号范围：

| 方言                | 命令 ID 范围 |
| ------------------- | ------------ |
| `common.xml`        | 0–39999      |
| `asluav.xml`        | 40001–41999  |
| `ArduPilotMega.xml` | 42000–42999  |

这些是命令 entry 的编号范围，不是消息 ID 范围。

例如：

```
<message id="200" name="MY_SENSOR_DATA">
```

这里的 `200` 是消息 ID。

而：

```
<entry value="42000" name="MAV_CMD_MY_ACTION">
```

这里的 `42000` 是命令 ID。

两者不能混淆。

官方建议：

+ 命令必须显式指定 value；
+ 同类命令尽可能放在相近的编号区间；
+ 如果未来可能增加类似命令，可以预留一些编号。

例如：

```
MAV_CMD_MY_DEVICE_START  = 42000
MAV_CMD_MY_DEVICE_STOP   = 42001
MAV_CMD_MY_DEVICE_RESET  = 42002
```

这样就便于维护和扩展。

##### **10.3 命令名称规范**

命令名称通常以：

```
MAV_CMD_
```

开头。

官方还介绍了几种常见前缀：

| 前缀                 | 含义       | 典型用途     |
| -------------------- | ---------- | ------------ |
| `MAV_CMD_NAV_`       | Navigation | 导航和移动   |
| `MAV_CMD_DO_`        | Do         | 执行某种操作 |
| `MAV_CMD_CONDITION_` | Condition  | 任务执行条件 |

例如：

```
MAV_CMD_NAV_WAYPOINT
MAV_CMD_NAV_TAKEOFF
MAV_CMD_DO_SET_MODE
MAV_CMD_DO_CHANGE_SPEED
MAV_CMD_CONDITION_DELAY
```

它们大致表达了不同的用途：

+ `NAV`：让飞行器前往某个位置或执行某种移动。
+ `DO`：执行某种操作，例如设置模式或改变速度。
+ `CONDITION`：定义任务状态机继续执行下一个任务项之前必须满足的条件。

这些前缀是命名约定，并不是绝对严格的分类规则。

#### **Command Parameters：命令参数的详细规则**

这是本章最后一个重点。

普通消息可以自定义任意字段，而 MAVLink 命令使用规定的 7 个参数。

##### **11.1 参数编号：1～7**

命令参数必须使用：

```
index="1"
```

到：

```
index="7"
```

例如：

```
<param index="1">Hold time</param>
<param index="2">Acceptance radius</param>
<param index="3">Pass-by radius</param>
<param index="4">Desired yaw</param>
<param index="5">Latitude</param>
<param index="6">Longitude</param>
<param index="7">Altitude</param>
```

需要注意，参数编号不是 XML 中的字段编号，而是 MAVLink 命令协议规定的参数位置。

##### **11.2 参数 5、6、7 的标准位置含义**

当命令包含位置信息时，官方规定：

| 参数    | 标准含义      |
| ------- | ------------- |
| Param 5 | X / Latitude  |
| Param 6 | Y / Longitude |
| Param 7 | Z / Altitude  |

例如：

```
Param 5 = 34.123456
Param 6 = 108.123456
Param 7 = 100.0
```

如果使用全球坐标，可以理解为：

```
纬度 = 34.123456°
经度 = 108.123456°
高度 = 100.0 m
```

如果使用局部坐标，则可能表示：

```
X = 10.0 m
Y = 20.0 m
Z = -5.0 m
```

到底是全球坐标还是局部坐标，要根据命令和所使用的坐标系确定。

这也是为什么命令中经常还需要指定 `frame`，例如 `MAV_FRAME_GLOBAL_INT` 或 `MAV_FRAME_LOCAL_NED`。

##### **11.3 参数的数据类型**

官方对参数的数据类型有明确说明：

| 参数      | 传输类型             |
| --------- | -------------------- |
| Param 1–4 | `float`              |
| Param 5   | `float` 或 `int32_t` |
| Param 6   | `float` 或 `int32_t` |
| Param 7   | `float`              |

其中：

+ `COMMAND_LONG` 使用浮点参数。
+ `COMMAND_INT` 可以使用整数形式的 Param 5、Param 6 来表达位置坐标。

这也是为什么参数 5 和 6 不适合用来存储必须依赖浮点数表达的数据，例如 NaN。

例如，`COMMAND_INT` 中的 X、Y 通常可以用缩放后的整数表示全球经纬度。

##### **11.4 未使用的参数：Reserved Parameters**

并不是每个命令都需要 7 个参数。

例如，某个命令只需要：

+ Param 1：目标编号；
+ Param 2：重复次数。

那么其他参数就可以保留，不必在 XML 中定义。

官方建议：

**未使用的参数不要随意定义成普通参数，而应该保留为 reserved。**

为什么？

因为未来可能需要扩展命令。

例如，原本只使用：

```
Param 1
Param 2
```

以后需要增加功能，就可以考虑使用 Param 3，而不必改变已有参数的语义。

##### **11.5 Reserved 参数应该发送什么值？**

这是一个很容易出错的地方。

不同命令消息的未使用参数有规定的“无操作”值。

| 承载消息           | 未使用参数的发送值                                   |
| ------------------ | ---------------------------------------------------- |
| `COMMAND_LONG`     | 所有未使用参数发送 `NaN`                             |
| `COMMAND_INT`      | Param 1–4、7 发送 `NaN`；Param 5、6 发送 `INT32_MAX` |
| `MISSION_ITEM_INT` | Param 1–4、7 发送 `NaN`；Param 5、6 发送 `INT32_MAX` |

为什么要这样做？

因为如果未使用参数随意填 `0`，接收端可能会把它解释为一个真实的参数值。

例如：

```
Param 1 = 0
```

可能表示：

+ 目标速度为 0；
+ 等待时间为 0；
+ 目标编号为 0；
+ 或其他实际含义。

而 `NaN` 或 `INT32_MAX` 可以作为明确的无效值或无操作标记。

官方还特别指出，历史上 MAVLink 曾允许使用 `0` 作为哨兵值，但实现正在迁移到上述标准哨兵值。实际开发时，应检查具体飞控的文档和实现，不要假设所有系统都已经完全完成迁移。

##### **11.6 示例：MAV_CMD_DO_JUMP**

官方给出了 `MAV_CMD_DO_JUMP` 作为示例。

```
<entry value="177"
       name="MAV_CMD_DO_JUMP"
       mission="true">

    <description>
        Jump to the desired command in the mission list.
        Repeat this action only the specified number of times.
    </description>

    <param index="1"
           label="Number"
           minValue="0"
           increment="1">
        Sequence number
    </param>

    <param index="2"
           label="Repeat"
           minValue="0"
           increment="1">
        Repeat count
    </param>

</entry>
```

我们逐项理解。

```
<entry value="177"
       name="MAV_CMD_DO_JUMP"
       mission="true">
```

表示：

+ 命令 ID 是 177；
+ 命令名称是 `MAV_CMD_DO_JUMP`；
+ `mission="true"` 表示该命令用于任务协议。

参数 1：

```
<param index="1"
       label="Number"
       minValue="0"
       increment="1">
    Sequence number
</param>
```

含义是：

+ 参数编号：1；
+ 地面站 UI 标签：Number；
+ 最小值：0；
+ 增量：1；
+ 参数描述：任务序列号。

参数 2：

```
<param index="2"
       label="Repeat"
       minValue="0"
       increment="1">
    Repeat count
</param>
```

表示重复次数。

因为该命令只需要两个参数，所以 XML 中只定义了 Param 1 和 Param 2。

Param 3～7 没有定义，表示它们不使用。

##### **11.7 param 的 GUI 属性**

官方还定义了一些供地面站 UI 使用的参数属性。

这些属性并不直接改变命令的二进制数据格式，而是为地面站提供显示和编辑提示。

| 属性            | 含义                   | 示例            |
| --------------- | ---------------------- | --------------- |
| `label`         | 参数在 UI 中显示的标签 | `Hold Altitude` |
| `units`         | 参数单位               | `m`             |
| `decimalPlaces` | 显示的小数位数         | `2`             |
| `enum`          | 参数对应的枚举         | `MAV_FRAME`     |
| `increment`     | 参数允许的增量         | `0.5`           |
| `minValue`      | 最小值                 | `0`             |
| `maxValue`      | 最大值                 | `100`           |

例如：

```
<param index="1"
       label="Target Speed"
       units="m/s"
       decimalPlaces="2"
       minValue="0"
       maxValue="20"
       increment="0.5">
    Target speed
</param>
```

地面站就可以根据这些元数据，设计更加合适的参数编辑界面。

例如：

+ 显示名称为 Target Speed；
+ 单位为 m/s；
+ 最小值为 0；
+ 最大值为 20；
+ 步进值为 0.5；
+ 显示两位小数。

如果有 `enum` 属性，地面站还可以将参数显示成下拉选项，而不是让用户手动输入数字。

这对你以后扩展 QGC 地面站很有用：协议 XML 中的元数据可以帮助地面站生成更友好的界面，但 QGC 是否真正读取和使用某个属性，还取决于它自己的实现。

