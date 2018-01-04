# n-i18n

> i18n是什么？i18n（其来源是英文单词internationalization的首末字符i和n，18为中间的字符数）是“国际化”的简称。

## API Doc(i18n-a)

> 应用场景为中小型活动页面的多语言静态配置，支持文本配置（可简单传参），图片配置，样式配置。

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

#### Demo

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

## API Doc(i18n-b)

> 基于i18n-a基础上添加了动态观察数据的功能。应用场景为某些多语言数据依赖于后端返回，并在应用生命周期内持续更新。为了避免低效的手动操作。i18n-b版本实现了简单的数据观察。

#### 数据观察

多语言中需要动态变化的数据从data配置。之后可以通过实例的$data属性**（暂不支持数组）**修改。视图将得到通知，对应更新依赖了此数据的所有Dom节点。具体使用参见test示例

#### Demo

```html
<p data-i18n="$h('pocket', {from: '支付宝', username: name, pocket: msg.pocket})"></p>
```

```javascript
const N = new Ni18n({
    locale: 'zh',
    messages: lang,
    selector: '#i18n-stage',
    data: {
        name: '1kg',
        msg: {
            pocket: 100
        }
    }
});

setInterval(() => {
    N.$data.msg.pocket++;
}, 1000);

setTimeout(() => {
    N.$data.name = '1kg\'s son';
}, 5000);
```