
import { defineConfig } from 'vitepress'

export default defineConfig({
  // GitHub Pages 部署路径
  base: '/Embedded-Notes/',

  title: "Zachary's Notes",
  description: '嵌入式软件开发、PX4 无人机、MAVLink、QGC、C++、Linux 与 STM32 技术学习笔记',

  themeConfig: {
    // 顶部导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: 'C++', link: '/cpp/' },
      { text: 'Linux', link: '/linux/' },
      { text: 'PX4', link: '/px4/' },
      { text: 'QGC', link: '/qgc/' },
      { text: 'STM32', link: '/stm32/' }
    ],

    // 左侧导航栏
    sidebar: {
      '/px4/': [
        {
          text: 'PX4 二次开发',
          collapsed: false,
          items: [
            {
              text: '二次开发 V1',
              link: '/px4/二次开发/PX4 二次开发_V1'
            },
            {
              text: '二次开发 V2（内部通信）',
              link: '/px4/二次开发/PX4 二次开发_V2(内部通信)'
            },
            {
              text: '二次开发 V3（外部通信）',
              link: '/px4/二次开发/PX4 二次开发_V3(外部通信)'
            }
          ]
        },
        {
          text: '源码分析',
          collapsed: false,
          items: [
            {
              text: 'MAVLink',
              collapsed: false,
              items: [
                {
                  text: 'MAVLink 概览',
                  link: '/px4/mavlink/'
                },
                {
                  text: 'MAVLink 协议与 PX4 外部通信',
                  link: '/px4/mavlink/MAVLink'
                },
                {
                  text: 'MAVLink 2 和 XML',
                  link: '/px4/mavlink/MAVLink XML 结构和自定义'
                }
              ]
            },
            {
              text: 'uORB',
              link: '/px4/uorb/'
            },
            {
              text: '核心源码',
              link: '/px4/source-code/'
            }
          ]
        }
      ]
    },

    // 页面外观
    outline: {
      level: [2, 6],
      label: '本页目录'
    },

    // 页脚
    footer: {
      message: '持续学习，持续积累',
      copyright: "Copyright © 2026 Zachary's Notes"
    },

    // 搜索
    search: {
      provider: 'local'
    }
  }
})
