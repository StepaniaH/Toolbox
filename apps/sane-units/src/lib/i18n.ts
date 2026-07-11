import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { getLang, onChange, setLang as setCoreLang, type Lang } from "@toolbox/i18n/core";

export type LanguageCode = "zh-CN" | "en";

function coreToSaneUnits(lang: Lang): LanguageCode {
  return lang === "en" ? "en" : "zh-CN";
}

function saneUnitsToCore(lang: LanguageCode): Lang {
  return lang === "en" ? "en" : "zh";
}
export type TranslationKey = string;
export type Translation = string | number | Translation[] | { [key: string]: Translation };
export type Translations = Record<LanguageCode, { [key: string]: Translation }>;

const TRANSLATIONS = {
  "zh-CN": {
    nav: {
      home: "首页",
      storage: "存储",
      network: "网络",
      video: "视频",
      power: "电费",
      about: "关于",
    },
    brand: {
      name: "SaneUnits",
      subtitle: "不糊弄人的单位换算与现实估算工具",
      subtitleShort: "单位解释与现实估算",
    },
    home: {
      heroTitle: "SaneUnits",
      heroLead:
        "一个不糊弄人的单位换算与现实估算工具。它不只告诉你结果，还会把单位、公式和现实损耗摆在一起。",
      metricPureFrontend: "纯前端",
      metricPureFrontendValue: "0 后端",
      metricShareable: "可分享",
      metricShareableValue: "URL 状态",
      metricMobile: "移动端",
      metricMobileValue: "可直接用",
      cards: [
        {
          meta: "存储容量语义换算",
          title: "硬盘容量为什么变少了？",
          description: "TB / TiB、GB / GiB 的差别，一次说清。",
          path: "/storage",
        },
        {
          meta: "网络带宽与传输时间",
          title: "宽带速度到底等于多少下载速度？",
          description: "Mbps 与 MB/s、实际吞吐和传输时间。",
          path: "/network",
        },
        {
          meta: "现实估算",
          title: "下载 / 传输一个文件需要多久？",
          description: "把文件大小、带宽和现实折扣放进一个公式。",
          path: "/network",
        },
        {
          meta: "电费与 7x24 成本",
          title: "设备 24 小时运行一年多少电费？",
          description: "W、kWh、日耗电与年成本的对应关系。",
          path: "/power",
        },
        {
          meta: "网络相关估算",
          title: "视频码率、文件大小、时长换算",
          description: "监控、点播和大文件传输都能用上。",
          path: "/video",
        },
        {
          meta: "扩展路线",
          title: "显示器 / 手机屏幕 PPI 计算",
          description: "后续版本可扩展到显示和打印场景。",
          path: "/storage",
        },
        {
          meta: "存储容量",
          title: "4TB 硬盘实际可用空间是多少？",
          description: "厂商标 4TB，系统显示 3.63TB，差的去哪了？",
          path: "/storage",
        },
        {
          meta: "监控存储",
          title: "4K 监控摄像头一天占多少硬盘？",
          description: "按码率算存储需求，别等硬盘满了才发现。",
          path: "/video",
        },
        {
          meta: "设备电费",
          title: "软路由 / NAS 一年电费多少？",
          description: "7×24 运行的设备，一年下来电费可能比你想的多。",
          path: "/power",
        },
      ],
    },
    storage: {
      title: "存储容量语义换算",
      description: "把厂商标称容量、系统显示和二进制单位放进同一个语境里。",
      panelInput: { title: "输入", subtitle: "数值、单位和使用场景" },
      panelAnswer: { title: "直接答案", subtitle: "先给结论，再给解释" },
      panelUnitExplain: { title: "单位解释", subtitle: "先讲口径，再讲数字" },
      panelFormula: { title: "计算公式", subtitle: "可直接复核" },
      panelReality: { title: "现实修正", subtitle: "最容易被忽略的地方" },
      panelShare: { title: "分享链接", subtitle: "直接复制当前状态" },
      panelExamples: { title: "形象举例", subtitle: "帮你感受实际量级" },
      fieldValue: "数值",
      fieldUnit: "单位",
      fieldScenario: "使用场景",
      fieldPresets: "常用预设",
      resultLabel: "结果",
      resultBinaryDisplay: "操作系统常见二进制显示：约",
      resultDifference: "差异：",
      statExactBytes: "精确 bytes",
      statBinaryDisplay: "二进制显示",
      statUnitDiff: "单位差异",
      formulaLine1: "bytes = 数值 × 所选单位的换算系数",
      formulaLine2: "二进制显示 = bytes ÷ 1024^n",
      realityTitle: "常见误区",
      hintValue: "输入要换算的容量数值",
      hintUnit: "选择十进制或二进制单位，TB/GB 是十进制，TiB/GiB 是二进制",
      hintScenario: "选择使用场景，不同场景默认使用不同的单位口径",
      scenarios: {
        drive:
          "厂商标称容量通常按十进制算，系统里更常见的是二进制显示。",
        os: "系统界面显示经常会切到 TiB / GiB 口径，看起来会更小一些。",
        memory:
          "内存容量大多按二进制口径理解，和磁盘标称不是同一套。",
        file: "文件大小最好和存储单位区分开，不然很容易把 MB 和 MiB 混掉。",
      },
      examples: {
        movie: "约 {0} 部 8GB 高清电影",
        photo: "约 {0} 张 4MB 照片",
        song: "约 {0} 首 10MB 无损歌曲",
      },
    },
    network: {
      title: "网络带宽与传输时间",
      description: "把带宽、文件大小和现实吞吐放在一起，别再把 Mbps 当成 MB/s。",
      panelInput: { title: "输入", subtitle: "带宽、文件和现实折扣" },
      panelAnswer: { title: "直接答案", subtitle: "带宽、速度和时间" },
      panelUnitExplain: { title: "单位解释", subtitle: "别把 bit 和 byte 混了" },
      panelFormula: { title: "计算公式", subtitle: "可复核的那种" },
      panelReality: { title: "现实修正", subtitle: "实际通常会慢一点" },
      panelShare: { title: "分享链接", subtitle: "直接复制当前状态" },
      panelExamples: { title: "形象举例", subtitle: "帮你感受实际量级" },
      fieldBandwidth: "带宽",
      fieldFileSize: "文件大小",
      fieldScenario: "场景",
      fieldEfficiency: "现实折扣 %",
      fieldPresets: "常用预设",
      resultLabel: "结果",
      resultTheoryTime: "理论传输时间：",
      resultEffectiveTime: "有效吞吐估算：",
      statTheoryMBs: "理论 MB/s",
      statTheoryMiBs: "理论 MiB/s",
      statEffectiveTime: "有效时间",
      formulaLine1: "速度（MB/s） = 带宽（Mbps） ÷ 8",
      formulaLine2: "时间 = 文件大小 × 8 ÷ 带宽 ÷ 有效吞吐",
      realityTitle: "常见影响因素",
      noteUnitExplain:
        "Mbps 是 megabit per second，MB/s 是 megabyte per second。1 byte = 8 bits。",
      hintBandwidth:
        "带宽指每秒传输的比特数（bit/s），不是字节数。1000Mbps ≈ 125MB/s",
      hintEfficiency:
        "现实中的传输速度受协议开销、网络拥塞、服务端限速等影响，通常达不到理论值",
      scenarios: {
        "wired-lan":
          "有线局域网通常接近理论值，但仍会受磁盘和协议开销影响。",
        wifi: "Wi‑Fi 受信号、干扰和路由器性能影响更明显。",
        public: "公网下载常受服务端限速、链路拥塞和地区差异影响。",
        vps: "VPS 和良好公网通常比家庭宽带更稳定，但并不等于满速。",
        vpn: "VPN / Tailscale / WireGuard 会多一层封装和加密开销。",
        crossborder:
          "跨境和晚高峰更容易被链路拥塞、丢包和绕路拖慢。",
        custom: "自定义折扣适合你已经知道环境表现的情况。",
      },
      examples: {
        movie: "一部 8GB 高清电影 → {0}",
        episode: "一集 1GB 1080p 剧集 → {0}",
        song: "一首 30MB 无损音乐 → {0}",
      },
    },
    video: {
      title: "视频码率与文件大小",
      description:
        "码率、时长、文件大小——知道两个就能算第三个，音频和封装开销也不忘。",
      panelInput: { title: "输入", subtitle: "选择求解目标，填入已知量" },
      panelAnswer: { title: "直接答案", subtitle: "当前模式：" },
      panelUnitExplain: { title: "单位解释", subtitle: "bit 和 byte 的口径差异" },
      panelFormula: { title: "计算公式", subtitle: "可直接复核" },
      panelReality: { title: "现实修正", subtitle: "估算不是真值" },
      panelShare: { title: "分享链接", subtitle: "直接复制当前状态" },
      panelExamples: { title: "形象举例", subtitle: "帮你感受实际量级" },
      fieldTarget: "求解目标",
      fieldVideoBitrate: "视频码率",
      fieldDuration: "时长",
      fieldFileSize: "文件大小",
      fieldAudioBitrate: "音频码率",
      fieldOverhead: "封装开销 %",
      fieldPresets: "常用预设",
      solvingLabel: "（求解中）",
      resultLabel: "结果",
      statVideoBitrate: "视频码率",
      statDuration: "时长",
      statFileSize: "文件大小",
      realityTitle: "常见影响因素",
      hintBitrate:
        "视频码率决定画质和文件大小，单位用 bit/s（如 Mbps）。8Mbps 是常见 1080p 码率",
      hintOverhead:
        "容器封装会额外占用空间，MP4/MKV 通常 1-3%，可通过 ffprobe 查看实际文件开销",
      hintDuration: "视频的播放时长",
      examples: {
        movie: "约 {0} 部 2 小时 1080p 电影",
        episode: "约 {0} 集 45 分钟剧集",
        min4k: "约 {0} 分钟 4K 视频（按此码率）",
        hourSize: "按此码率，1 小时视频约 {0}",
      },
    },
    power: {
      title: "电费与 7x24 运行成本",
      description: "把功率换成电量，再把电量换成你能感受到的成本。",
      panelInput: { title: "输入", subtitle: "功率、运行时长和电价" },
      panelAnswer: { title: "直接答案", subtitle: "日、月、年都给你算好" },
      panelUnitExplain: { title: "单位解释", subtitle: "把功率和电量拆开" },
      panelFormula: { title: "计算公式", subtitle: "三步就够了" },
      panelReality: { title: "现实修正", subtitle: "别只看功率铭牌" },
      panelShare: { title: "分享链接", subtitle: "直接复制当前状态" },
      panelExamples: { title: "形象举例", subtitle: "帮你感受实际量级" },
      fieldWatt: "功率",
      fieldHoursPerDay: "每天运行小时数",
      fieldDaysPerYear: "每年运行天数",
      fieldPrice: "电价",
      fieldPresets: "常用预设",
      resultLabel: "结果",
      resultDaily: "每日耗电：",
      resultAnnual: "每年电费：",
      statDaily: "每日耗电",
      statMonthly: "每月耗电",
      statAnnual: "每年耗电",
      unitExplainTitle: "口径",
      unitExplainText:
        "W 是功率，kWh 是电量。设备越长时间开着，电量和成本就越高。",
      noteMonthly: "月度按 30 天粗算，更适合日常估算。",
      formulaLine1: "每日耗电 = W ÷ 1000 × 每天小时数",
      formulaLine2: "每年耗电 = 每日耗电 × 每年天数",
      formulaLine3: "电费 = kWh × 电价",
      realityTitle: "常见误区",
      hintWatt: "W 是功率（瓦特），不是电量（kWh）。铭牌功率通常低于实际功耗",
      hintPrice:
        "电价单位是 元/kWh（度）。中国居民电价约 0.5-0.6 元/kWh",
      examples: {
        kwh: "约 {0} 度电",
        ac: "够一台 2000W 空调运行约 {0} 小时",
        led: "够一台 10W LED 灯亮约 {0} 天",
      },
    },
    about: {
      title: "关于 SaneUnits",
      description: "它不是普通单位换算器，而是一个单位语义解释器和现实估算器。",
      panelWhat: {
        title: "SaneUnits 是什么",
        subtitle: "不只是单位换算器",
      },
      whatP1:
        "SaneUnits 是一个单位解释和现实估算工具。它不只告诉你换算结果，更会解释背后的单位差异、计算公式和现实损耗。",
      whatP2:
        "为什么硬盘标着 4TB，插上电脑就变成 3.64TB？因为 TB 和 TiB 用的是不同的进制。1000Mbps 宽带为什么下载只有 100MB/s 左右？因为 Mbps 和 MB/s 相差 8 倍，还有协议开销和网络拥塞。",
      whatP3:
        "我们默认把边界条件和常见误区摆出来，不把理论值包装成现实值。",
      panelHow: {
        title: "怎么用",
        subtitle: "简单直接",
      },
      howP1:
        "选择一个计算器，填入你关心的数值，答案和解释就会出来。你可以通过链接分享当前状态给朋友，不需要注册账号。",
      howP2:
        "所有计算都在浏览器本地完成，状态通过 URL 参数和浏览器存储保存。手机、电脑都能直接用。",
      panelPrivacy: {
        title: "隐私",
        subtitle: "你的数据留在你手里",
      },
      privacyP1: "所有计算都在你的浏览器本地完成。",
      privacyP2:
        "状态通过 URL query 分享，偏好通过 localStorage 保存。",
      privacyP3: "没有账号、没有数据库、没有上传。",
    },
    common: {
      copy: "复制链接",
      copied: "已复制",
      copyFailed: "复制失败",
      share: "分享链接",
    },
    sidebar: {
      note: "默认解释边界条件，不把理论值包装成现实值。",
      tbNote: "TB ≠ TiB",
      mbpsNote: "Mbps ≠ MB/s",
      wattNote: "W ≠ kWh",
    },
    pageTitles: {
      "/": "SaneUnits",
      "/storage": "SaneUnits · 存储容量语义换算",
      "/network": "SaneUnits · 网络带宽与传输时间",
      "/video": "SaneUnits · 视频码率与文件大小",
      "/power": "SaneUnits · 电费与运行成本",
      "/about": "SaneUnits · 关于",
    },
    footer: {
      selfHosted: "自托管静态站点",
      mitLicense: "MIT 许可证",
      github: "GitHub",
    },
  },
  en: {
    nav: {
      home: "Home",
      storage: "Storage",
      network: "Network",
      video: "Video",
      power: "Power",
      about: "About",
    },
    brand: {
      name: "SaneUnits",
      subtitle: "A unit converter & reality estimator that doesn't lie to you",
      subtitleShort: "Unit explanation & reality estimation",
    },
    home: {
      heroTitle: "SaneUnits",
      heroLead:
        "A unit converter and reality-estimation tool that doesn't hide the messy details. It gives you the answer and explains the units, formulas, and real-world losses.",
      metricPureFrontend: "Frontend only",
      metricPureFrontendValue: "0 backend",
      metricShareable: "Shareable",
      metricShareableValue: "URL state",
      metricMobile: "Mobile-ready",
      metricMobileValue: "Just works",
      cards: [
        {
          meta: "Storage Capacity Semantics",
          title: "Why is my hard drive smaller than advertised?",
          description: "TB vs TiB, GB vs GiB — explained once and for all.",
          path: "/storage",
        },
        {
          meta: "Network Bandwidth & Transfer Time",
          title: "How fast is my internet speed really?",
          description: "Mbps vs MB/s, real throughput, and transfer time.",
          path: "/network",
        },
        {
          meta: "Reality Estimation",
          title: "How long to download / transfer a file?",
          description: "File size, bandwidth, and real-world discount in one formula.",
          path: "/network",
        },
        {
          meta: "Electricity Cost & 24/7 Runtime",
          title: "How much does it cost to run a device 24/7 for a year?",
          description: "W, kWh, daily consumption, and annual cost explained.",
          path: "/power",
        },
        {
          meta: "Network-Related Estimation",
          title: "Video bitrate, file size, and duration",
          description: "Useful for surveillance, streaming, and large file transfers.",
          path: "/video",
        },
        {
          meta: "Roadmap",
          title: "Display / phone screen PPI calculator",
          description: "Future versions may extend to display and print scenarios.",
          path: "/storage",
        },
        {
          meta: "Storage",
          title: "How much usable space on a 4TB drive?",
          description: "Label says 4TB, system shows 3.63TB — where did it go?",
          path: "/storage",
        },
        {
          meta: "Surveillance",
          title: "How much storage for a 4K security camera per day?",
          description: "Calculate storage needs by bitrate before the drive fills up.",
          path: "/video",
        },
        {
          meta: "Device Power",
          title: "How much does a router/NAS cost per year in electricity?",
          description: "7×24 devices can add up to more than you'd think.",
          path: "/power",
        },
      ],
    },
    storage: {
      title: "Storage Capacity Semantics",
      description:
        "Put manufacturer specs, system displays, and binary units into the same context.",
      panelInput: { title: "Input", subtitle: "Value, unit, and usage scenario" },
      panelAnswer: {
        title: "Direct Answer",
        subtitle: "Conclusion first, explanation next",
      },
      panelUnitExplain: {
        title: "Unit Explanation",
        subtitle: "Understand the numbering system first",
      },
      panelFormula: { title: "Formula", subtitle: "Verifiable" },
      panelReality: {
        title: "Reality Check",
        subtitle: "The most overlooked part",
      },
      panelShare: { title: "Share Link", subtitle: "Copy current state" },
      panelExamples: { title: "Real-World Examples", subtitle: "Grasp the actual scale" },
      fieldValue: "Value",
      fieldUnit: "Unit",
      fieldScenario: "Scenario",
      fieldPresets: "Common Presets",
      resultLabel: "Result",
      resultBinaryDisplay: "Typical OS binary display: ~",
      resultDifference: "Difference: ",
      statExactBytes: "Exact bytes",
      statBinaryDisplay: "Binary display",
      statUnitDiff: "Unit difference",
      formulaLine1: "bytes = value × conversion factor of chosen unit",
      formulaLine2: "binary display = bytes ÷ 1024^n",
      realityTitle: "Common Pitfall",
      hintValue: "Enter the capacity value to convert",
      hintUnit:
        "Choose decimal or binary units — TB/GB are decimal, TiB/GiB are binary",
      hintScenario:
        "Choose a usage scenario — different scenarios default to different unit conventions",
      scenarios: {
        drive:
          "Manufacturer capacity is typically decimal; OS often displays binary.",
        os: "System interfaces often show TiB/GiB, which appear smaller.",
        memory:
          "Memory capacity is usually understood in binary, separate from disk labeling.",
        file: "File sizes are best kept distinct from storage units to avoid MB/MiB confusion.",
      },
      examples: {
        movie: "~{0} 8GB HD movies",
        photo: "~{0} 4MB photos",
        song: "~{0} 10MB lossless songs",
      },
    },
    network: {
      title: "Network Bandwidth & Transfer Time",
      description:
        "Put bandwidth, file size, and real throughput together — stop confusing Mbps with MB/s.",
      panelInput: {
        title: "Input",
        subtitle: "Bandwidth, file, and real-world discount",
      },
      panelAnswer: {
        title: "Direct Answer",
        subtitle: "Bandwidth, speed, and time",
      },
      panelUnitExplain: {
        title: "Unit Explanation",
        subtitle: "Don't confuse bits and bytes",
      },
      panelFormula: { title: "Formula", subtitle: "The verifiable kind" },
      panelReality: {
        title: "Reality Check",
        subtitle: "Real world is usually slower",
      },
      panelShare: { title: "Share Link", subtitle: "Copy current state" },
      panelExamples: { title: "Real-World Examples", subtitle: "Grasp the actual scale" },
      fieldBandwidth: "Bandwidth",
      fieldFileSize: "File Size",
      fieldScenario: "Scenario",
      fieldEfficiency: "Real-world Discount %",
      fieldPresets: "Common Presets",
      resultLabel: "Result",
      resultTheoryTime: "Theoretical transfer time: ",
      resultEffectiveTime: "At effective throughput: ",
      statTheoryMBs: "Theoretical MB/s",
      statTheoryMiBs: "Theoretical MiB/s",
      statEffectiveTime: "Effective time",
      formulaLine1: "Speed (MB/s) = Bandwidth (Mbps) ÷ 8",
      formulaLine2:
        "Time = File Size × 8 ÷ Bandwidth ÷ Effective Throughput",
      realityTitle: "Common Factors",
      noteUnitExplain:
        "Mbps is megabit per second, MB/s is megabyte per second. 1 byte = 8 bits.",
      hintBandwidth:
        "Bandwidth is measured in bits per second (bit/s), not bytes. 1000Mbps ≈ 125MB/s",
      hintEfficiency:
        "Real-world transfer speed is affected by protocol overhead, network congestion, and server-side limits — usually below the theoretical maximum",
      scenarios: {
        "wired-lan":
          "Wired LAN is typically near theoretical, but still affected by disk and protocol overhead.",
        wifi: "Wi‑Fi is more affected by signal, interference, and router performance.",
        public:
          "Public internet downloads are often limited by server-side throttling, link congestion, and regional differences.",
        vps: "VPS and good public connections are usually more stable than home broadband, but not full speed.",
        vpn: "VPN / Tailscale / WireGuard adds an extra layer of encapsulation and encryption overhead.",
        crossborder:
          "Cross-border and peak hours are more affected by congestion, packet loss, and routing detours.",
        custom:
          "Custom discount for when you already know your environment's performance.",
      },
      examples: {
        movie: "One 8GB HD movie → {0}",
        episode: "One 1GB 1080p episode → {0}",
        song: "One 30MB lossless track → {0}",
      },
    },
    video: {
      title: "Video Bitrate & File Size",
      description:
        "Bitrate, duration, file size — know two to solve the third, with audio and container overhead accounted for.",
      panelInput: {
        title: "Input",
        subtitle: "Choose what to solve for, fill in known values",
      },
      panelAnswer: {
        title: "Direct Answer",
        subtitle: "Current mode: ",
      },
      panelUnitExplain: {
        title: "Unit Explanation",
        subtitle: "Bit vs byte convention difference",
      },
      panelFormula: { title: "Formula", subtitle: "Verifiable" },
      panelReality: {
        title: "Reality Check",
        subtitle: "Estimates are not exact values",
      },
      panelShare: { title: "Share Link", subtitle: "Copy current state" },
      panelExamples: { title: "Real-World Examples", subtitle: "Grasp the actual scale" },
      fieldTarget: "Solve For",
      fieldVideoBitrate: "Video Bitrate",
      fieldDuration: "Duration",
      fieldFileSize: "File Size",
      fieldAudioBitrate: "Audio Bitrate",
      fieldOverhead: "Container Overhead %",
      fieldPresets: "Common Presets",
      solvingLabel: " (solving)",
      resultLabel: "Result",
      statVideoBitrate: "Video Bitrate",
      statDuration: "Duration",
      statFileSize: "File Size",
      realityTitle: "Common Factors",
      hintBitrate:
        "Video bitrate determines quality and file size, measured in bit/s (e.g. Mbps). 8Mbps is a typical 1080p bitrate",
      hintOverhead:
        "Container format adds extra space — MP4/MKV typically 1-3%. Use ffprobe to check actual file overhead",
      hintDuration: "Playback duration of the video",
      examples: {
        movie: "~{0} 2-hour 1080p movies",
        episode: "~{0} 45-minute episodes",
        min4k: "~{0} minutes of 4K video (at this bitrate)",
        hourSize: "At this bitrate, 1 hour of video ≈ {0}",
      },
    },
    power: {
      title: "Electricity Cost & Runtime",
      description:
        "Convert power to energy, then energy to cost you can feel.",
      panelInput: {
        title: "Input",
        subtitle: "Power, runtime, and electricity price",
      },
      panelAnswer: {
        title: "Direct Answer",
        subtitle: "Daily, monthly, and annual breakdown",
      },
      panelUnitExplain: {
        title: "Unit Explanation",
        subtitle: "Separating power from energy",
      },
      panelFormula: { title: "Formula", subtitle: "Three steps is all it takes" },
      panelReality: {
        title: "Reality Check",
        subtitle: "Don't just look at the power label",
      },
      panelShare: { title: "Share Link", subtitle: "Copy current state" },
      panelExamples: { title: "Real-World Examples", subtitle: "Grasp the actual scale" },
      fieldWatt: "Power",
      fieldHoursPerDay: "Hours per Day",
      fieldDaysPerYear: "Days per Year",
      fieldPrice: "Electricity Price",
      fieldPresets: "Common Presets",
      resultLabel: "Result",
      resultDaily: "Daily consumption: ",
      resultAnnual: "Annual cost: ",
      statDaily: "Daily",
      statMonthly: "Monthly",
      statAnnual: "Annual",
      unitExplainTitle: "Convention",
      unitExplainText:
        "W is power, kWh is energy. The longer a device runs, the higher the energy and cost.",
      noteMonthly:
        "Monthly is roughly estimated at 30 days — suitable for daily estimation.",
      formulaLine1: "Daily energy = W ÷ 1000 × hours per day",
      formulaLine2: "Annual energy = Daily energy × days per year",
      formulaLine3: "Cost = kWh × electricity price",
      realityTitle: "Common Pitfall",
      hintWatt:
        "W is power (watts), not energy (kWh). Nameplate power is usually lower than actual consumption",
      hintPrice:
        "Electricity price unit is per kWh. Typical US residential rate is $0.10-0.15/kWh",
      examples: {
        kwh: "~{0} kWh",
        ac: "Powers a 2000W air conditioner for ~{0} hours",
        led: "Powers a 10W LED bulb for ~{0} days",
      },
    },
    about: {
      title: "About SaneUnits",
      description:
        "Not just a converter — a unit semantics explainer and reality estimator.",
      panelWhat: {
        title: "What is SaneUnits",
        subtitle: "More than a unit converter",
      },
      whatP1:
        "SaneUnits is a unit explanation and reality-estimation tool. It doesn't just give you conversion results — it explains the unit differences, formulas, and real-world factors behind them.",
      whatP2:
        "Why does a 4TB drive show up as 3.64TB on your computer? Because TB and TiB use different numbering systems. Why does a 1000Mbps connection only download at ~100MB/s? Because Mbps and MB/s differ by a factor of 8, plus protocol overhead and network congestion.",
      whatP3:
        "We surface boundary conditions and common pitfalls by default. We don't package theoretical values as real-world ones.",
      panelHow: {
        title: "How to Use",
        subtitle: "Simple and straightforward",
      },
      howP1:
        "Pick a calculator, fill in the values you care about, and the answer with explanations appears. Share your current state via URL — no account needed.",
      howP2:
        "All calculations run locally in your browser. State is saved via URL parameters and browser storage. Works on desktop and mobile.",
      panelPrivacy: {
        title: "Privacy",
        subtitle: "Your data stays with you",
      },
      privacyP1:
        "All calculations run locally in your browser.",
      privacyP2:
        "State is shared via URL query strings, preferences via localStorage.",
      privacyP3:
        "No accounts, no databases, no uploads.",
    },
    common: {
      copy: "Copy Link",
      copied: "Copied",
      copyFailed: "Copy Failed",
      share: "Share Link",
    },
    sidebar: {
      note: "Explains boundary conditions by default — never packages theory as reality.",
      tbNote: "TB ≠ TiB",
      mbpsNote: "Mbps ≠ MB/s",
      wattNote: "W ≠ kWh",
    },
    pageTitles: {
      "/": "SaneUnits",
      "/storage": "SaneUnits · Storage Capacity Semantics",
      "/network": "SaneUnits · Network Bandwidth & Transfer Time",
      "/video": "SaneUnits · Video Bitrate & File Size",
      "/power": "SaneUnits · Electricity Cost & Runtime",
      "/about": "SaneUnits · About",
    },
    footer: {
      selfHosted: "Self-hosted static site",
      mitLicense: "MIT License",
      github: "GitHub",
    },
  },
};

export interface LanguageContextValue {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => any;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "zh-CN",
  setLang: () => {},
  t: (key: TranslationKey) => key,
});

export function useTranslation(): LanguageContextValue {
  return useContext(LanguageContext);
}

function getNested(obj: Translation | undefined, path: string): Translation | undefined {
  return path.split(".").reduce<Translation | undefined>((current, key) => {
    if (current === undefined || current === null) return undefined;
    if (typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as { [key: string]: Translation })[key];
  }, obj);
}

export function resolveTranslation(
  translations: Translations,
  lang: string,
  key: TranslationKey,
): Translation {
  return getNested(translations[lang as LanguageCode], key) ?? getNested(translations["zh-CN"], key) ?? key;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LanguageCode>(() => coreToSaneUnits(getLang()));

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const unsubscribe = onChange((coreLang) => {
      setLangState(coreToSaneUnits(coreLang));
    });
    return unsubscribe;
  }, []);

  const setLang = useCallback((next: LanguageCode) => {
    setLangState(next);
    setCoreLang(saneUnitsToCore(next));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => resolveTranslation(TRANSLATIONS, lang, key),
    [lang],
  );

  const value = useMemo<LanguageContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return React.createElement(LanguageContext.Provider, { value }, children);
}

export { TRANSLATIONS };
