# dsh-api-balance

中文 | [English](docs/README.en.md) | [日本語](docs/README.ja.md) | [偽中国語](docs/README.pcn.md)

API 用量余额插件（DeepSeek Harness）——在 webui 用量圆圈（发送按钮左侧的上下文已用显示）的弹出面板中提供「用量 / 余额」标签切换。

> [!NOTE]
> 由于维护者（狐莉）患有罕见的视网膜色素变性（锥杆营养不良15型）疾病，并经中华人民共和国残疾人联合会认证属于一级视力残疾，暂时无法独立完成 NPM 软件包提交流程，故本仓库暂时不会提供 npm 打包。我们（狐莉与小爪）对此引起的不便表示抱歉，该问题终有一天会得到解决，但十分遗憾可能并不是现在立刻马上。在此之前，辛苦各位使用者通过 GitHub 源码安装（详见文档）。当然，这位用户，可以耽误您一点时间吗嘛？请允许我向您介绍我们声明式和可复现的 NixOS 以及更加符合狐莉美学的 nix flake 安装方案。（乖巧

## 安装

### 从 GitHub 源码安装

```bash
dsh plugin --profile web add github:Kihara777/dsh-api-balance
```

包内 `dsh.bundle` 指向 `cordis.patch.yml`，安装后即作为 profile 的一个 layer 激活。
卸载：`dsh plugin --profile web remove @kihara777/dsh-api-balance`。

### 声明式安装（NixOS）

NixOS 用户可经 [NixKits](https://github.com/Kihara777/NixKits) 的 `nixkits.dsh` 模块声明式安装——
版本由 Nix 锁定、随系统代际更新、可复现：

```nix
{
  nixkits.dsh.plugins.packages = [{
    package = pkgs.dsh-api-balance;
    id = "api-balance";
    name = "@kihara777/dsh-api-balance";
  }];
}
```

详见[完整文档](docs/README.md#安装)。

## 功能

- **余额 / 用量面板**：webui 用量圆圈弹出面板内的「用量 / 余额」标签切换
- **账户余额**：DeepSeek 官方 `GET /user/balance`（API key 认证）
- **用量明细**：当日 / 当月 / 30 日消耗（金额 + token + 分模型明细）与图表
- **平台令牌自动获取**：默认从本机浏览器登录态自动扫描，手动连接为回退
- **语音播报**：语音包 + TTS（浏览器内置 / 自定义 API），峰谷计费自动提示
- **界面增强**：峰时红色标识、疑问窗口滚动优化、回车换行开关等

## 开发

纯 JS 插件，无构建步骤（`lib/index.js` + `lib/client.js` 直接提交）：

```bash
npm install --legacy-peer-deps    # 安装依赖（peer 由宿主 dsh 在运行时提供）
```

代码结构：

| 文件 | 作用 |
|------|------|
| `lib/index.js` | host 半部：端点、令牌管理、上游查询 |
| `lib/client.js` | client 半部：webui 面板与交互 |
| `cordis.patch.yml` | bundle patch：供 `dsh plugin add` 注册本插件 |

## 许可

MIT
