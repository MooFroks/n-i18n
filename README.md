# 简单多语言配置工具库

> 应用场景为中小型活动页面的多语言配置功能，支持文本配置，图片配置，样式配置的多语言配置

- 图片路径配置
- 样式配置（比如背景图片）
- 文本配置（具体使用规范参考vue-i18n）

---

```javascript
const lang = {
    'en': {
        title: 'I like {span#id.cls1.cls2@content}'
    },
    'zh-CN': {
        title: '我喜欢{span#id.cls1.cls2@content}'
    }
}
```