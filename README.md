# n-i18n

> i18n是什么？i18n（其来源是英文单词internationalization的首末字符i和n，18为中间的字符数）是“国际化”的简称。
> 此工具库应用场景为中小型活动页面的多语言配置，支持文本配置（可简单传参），图片配置，样式配置。

## API Doc(i18n-a)

#### 四种模式

- `data-i18n="$t()"` 文本模式渲染
- `data-i18n="$h()"` HTML模式渲染
- `data-i18n="$c()"` 动态替换样式
- `data-i18n="$m()"` 动态替换图片

#### 混合使用多种模式

`data-i18n="$c(); $m()"` 动态替换样式和图片

#### 注意事项

- `$c()` 对class命名规范约束，以locale为前缀命名class。例如`.en-classname`、`.zh-classname`

- `$m()` 对图片路径规范约束，以locale严格命名为子文件夹下存放所有该语言使用的图片。参见test示例

## Demo

```html
<p data-i18n="$t('message.hello', {msg: 'world'})"></p>
```

```javascript
const lang = {
    en: {
        message: {
            hello: 'hello {msg}!'
        }
    }
};
new Ni18n({
    locale: 'en',
    messages: lang
});
```